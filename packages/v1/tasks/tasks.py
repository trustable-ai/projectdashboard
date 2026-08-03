"""Tasks CRUD + search API.

Primary store: MongoDB (ctx.MONGODB from action_add_mongodb).
Cache + fallback store: Redis (ctx.REDIS / ctx.REDIS_PREFIX from action_add_redis).

Public web action reachable at:
  GET    /api/my/v1/tasks[?status=&priority=&category=&q=]  -> list/search
  POST   /api/my/v1/tasks            -> create
  PUT    /api/my/v1/tasks/<id>       -> update
  DELETE /api/my/v1/tasks/<id>       -> delete

Resilience: when MongoDB is unavailable (e.g. a stale managed credential),
reads/writes transparently fall back to a Redis-backed store so the app keeps
working. A `backend` field in the response tells the caller which store served
the request ("mongo" | "redis" | "cache"). Redis also caches list/search
results (cache-aside) to speed up the dashboard and common searches.
"""

import json
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.errors import PyMongoError

COLLECTION = "tasks"
VALID_STATUSES = ("todo", "in_progress", "completed")
VALID_PRIORITIES = ("low", "medium", "high")
CACHE_TTL = 60  # seconds


# ---------------------------------------------------------------------------
# Request helpers
# ---------------------------------------------------------------------------

def request_data(args):
    data = dict(args) if isinstance(args, dict) else {}
    body = data.get("body")
    if isinstance(body, str):
        try:
            body = json.loads(body)
        except Exception:
            body = {}
    merged = dict(body) if isinstance(body, dict) else {}
    ignored = {
        "body", "MONGODB_URI", "REDIS_URL", "REDIS_PREFIX",
        "__ow_method", "__ow_headers", "__ow_path", "__ow_body", "__ow_query",
    }
    merged.update({k: v for k, v in data.items() if k not in ignored})
    return merged


def request_method(args):
    return (args.get("__ow_method") or args.get("method") or "GET").upper()


def _truthy(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def request_query(args):
    q = args.get("__ow_query")
    if isinstance(q, dict):
        return {k: v for k, v in q.items()}
    out = {}
    for k in ("status", "priority", "category", "q", "search", "overdue"):
        if args.get(k) is not None:
            out[k] = args.get(k)
    return out


def request_route_id(args, resource_name="tasks"):
    raw_path = str(args.get("__ow_path") or args.get("path") or "").strip("/")
    if raw_path:
        parts = [p for p in raw_path.split("/") if p]
        if resource_name in parts:
            idx = parts.index(resource_name)
            if idx + 1 < len(parts):
                return parts[idx + 1]
        if parts:
            return parts[-1]
    return ""


# ---------------------------------------------------------------------------
# Validation / shared helpers
# ---------------------------------------------------------------------------

def clean_task_input(data, partial=False):
    fields = {}
    if "title" in data:
        title = str(data.get("title") or "").strip()
        if not title and not partial:
            return None, "title is required"
        if title:
            fields["title"] = title
    if "description" in data or not partial:
        fields["description"] = str(data.get("description") or "").strip()
    if "category" in data or not partial:
        fields["category"] = str(data.get("category") or "").strip() or "General"
    if "priority" in data or not partial:
        priority = str(data.get("priority") or "medium").strip()
        if priority not in VALID_PRIORITIES:
            return None, f"priority must be one of {VALID_PRIORITIES}"
        fields["priority"] = priority
    if "status" in data or not partial:
        status = str(data.get("status") or "todo").strip()
        if status not in VALID_STATUSES:
            return None, f"status must be one of {VALID_STATUSES}"
        fields["status"] = status
    if "dueDate" in data or not partial:
        due = data.get("dueDate")
        fields["dueDate"] = "" if due in (None, "") else str(due)
    return fields, None


def serialize_mongo(doc):
    if not doc:
        return None
    out = {}
    for k, v in doc.items():
        if k == "_id":
            out["id"] = str(v)
        elif isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


def today_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def is_overdue(task, today=None):
    today = today or today_str()
    due = (task.get("dueDate") or "").strip()
    return bool(due) and due < today and task.get("status") != "completed"


def matches_filters(task, flt, q, today=None):
    today = today or today_str()
    status = flt.get("status")
    if status == "pending":
        if task.get("status") == "completed":
            return False
    elif status not in (None, "", "all") and task.get("status") != status:
        return False
    for key in ("priority", "category"):
        val = flt.get(key)
        if val not in (None, "", "all") and task.get(key) != val:
            return False
    if flt.get("overdue"):
        if not is_overdue(task, today):
            return False
    if q:
        hay = f"{task.get('title', '')} {task.get('description', '')} {task.get('category', '')}".lower()
        if q.lower() not in hay:
            return False
    return True


# ---------------------------------------------------------------------------
# Redis key helpers
# ---------------------------------------------------------------------------

def rkey(ctx, name):
    return f"{getattr(ctx, 'REDIS_PREFIX', '') or ''}pdt:{name}"

H_KEY = "tasks:store:h"        # hash id -> json task (fallback store)
IDS_KEY = "tasks:store:ids"   # set of ids (fallback store)
SEQ_KEY = "tasks:store:seq"   # id counter (fallback store)
CACHE_SET = "tasks:cache:keys"  # set of cache keys for invalidation


# ---------------------------------------------------------------------------
# Mongo store
# ---------------------------------------------------------------------------

class MongoStore:
    name = "mongo"

    def __init__(self, ctx):
        self.coll = ctx.MONGODB[COLLECTION]

    def list(self, flt, q):
        query = {}
        status = flt.get("status")
        if status == "pending":
            query["status"] = {"$ne": "completed"}
        elif status not in (None, "", "all"):
            query["status"] = status
        for key in ("priority", "category"):
            val = flt.get(key)
            if val not in (None, "", "all"):
                query[key] = val
        if flt.get("overdue"):
            today = today_str()
            query["dueDate"] = {"$ne": "", "$lt": today}
            query["status"] = {"$ne": "completed"}
        if q:
            query["$or"] = [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"category": {"$regex": q, "$options": "i"}},
            ]
        docs = list(self.coll.find(query).sort("createdAt", -1))
        return [serialize_mongo(d) for d in docs]

    def create(self, fields):
        doc = {**fields}
        doc.setdefault("createdAt", datetime.now(timezone.utc).isoformat())
        result = self.coll.insert_one(doc)
        return serialize_mongo(self.coll.find_one({"_id": result.inserted_id}))

    def update(self, task_id, fields):
        oid = ObjectId(task_id) if ObjectId.is_valid(task_id) else None
        if oid is None:
            return None, "invalid task id"
        res = self.coll.find_one_and_update(
            {"_id": oid}, {"$set": fields}, return_document=True
        )
        if res is None:
            return None, "task not found"
        return serialize_mongo(res), None

    def delete(self, task_id):
        oid = ObjectId(task_id) if ObjectId.is_valid(task_id) else None
        if oid is None:
            return None, "invalid task id"
        r = self.coll.delete_one({"_id": oid})
        if r.deleted_count == 0:
            return None, "task not found"
        return task_id, None


# ---------------------------------------------------------------------------
# Redis fallback store
# ---------------------------------------------------------------------------

class RedisStore:
    name = "redis"

    def __init__(self, ctx):
        self.r = ctx.REDIS
        self.h = rkey(ctx, H_KEY)
        self.ids = rkey(ctx, IDS_KEY)
        self.seq = rkey(ctx, SEQ_KEY)

    def _all(self):
        raw = self.r.hgetall(self.h) or {}
        tasks = []
        for _k, v in raw.items():
            try:
                tasks.append(json.loads(v))
            except Exception:
                continue
        tasks.sort(key=lambda t: t.get("createdAt", ""), reverse=True)
        return tasks

    def list(self, flt, q):
        return [t for t in self._all() if matches_filters(t, flt, q)]

    def create(self, fields):
        doc = {k: v for k, v in fields.items() if k != "_id"}
        doc.setdefault("createdAt", datetime.now(timezone.utc).isoformat())
        n = self.r.incr(self.seq) or 1
        task_id = f"r-{int(n)}"
        doc["id"] = task_id
        self.r.hset(self.h, task_id, json.dumps(doc))
        self.r.sadd(self.ids, task_id)
        return doc

    def update(self, task_id, fields):
        raw = self.r.hget(self.h, task_id)
        if not raw:
            return None, "task not found"
        try:
            task = json.loads(raw)
        except Exception:
            return None, "task not found"
        task.update(fields)
        self.r.hset(self.h, task_id, json.dumps(task))
        return task, None

    def delete(self, task_id):
        removed = self.r.hdel(self.h, task_id)
        if not removed:
            return None, "task not found"
        self.r.srem(self.ids, task_id)
        return task_id, None


# ---------------------------------------------------------------------------
# Cache helpers (cache-aside for list/search)
# ---------------------------------------------------------------------------

def cache_key(ctx, flt, q):
    parts = [f"{k}={flt.get(k, '')}" for k in ("status", "priority", "category")]
    parts.append(f"q={q or ''}")
    parts.append(f"overdue={bool(flt.get('overdue'))}")
    return rkey(ctx, f"tasks:cache:list:{'|'.join(parts)}")


def cache_get(ctx, key):
    r = getattr(ctx, "REDIS", None)
    if r is None:
        return None
    try:
        raw = r.get(key)
    except Exception:
        return None
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


def cache_set(ctx, key, tasks):
    r = getattr(ctx, "REDIS", None)
    if r is None:
        return
    try:
        r.set(key, json.dumps(tasks), ex=CACHE_TTL)
        r.sadd(rkey(ctx, CACHE_SET), key)
    except Exception:
        pass


def cache_invalidate(ctx):
    r = getattr(ctx, "REDIS", None)
    if r is None:
        return
    try:
        keys = list(r.smembers(rkey(ctx, CACHE_SET)) or [])
        if keys:
            r.delete(*keys)
        r.delete(rkey(ctx, CACHE_SET))
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Store selection (Mongo primary, Redis fallback)
# ---------------------------------------------------------------------------

def with_store(ctx, op, mutate=False):
    """Run op(store); on Mongo PyMongoError, retry on the Redis fallback.

    For mutate ops (update/delete) that return a (value, err) tuple, also fall
    back to Redis when Mongo cannot fulfill the request (e.g. an id that is not a
    valid ObjectId, or a task not present in Mongo).

    Returns (op_result, backend_name).
    """
    if getattr(ctx, "MONGODB", None) is not None:
        try:
            res = op(MongoStore(ctx))
            if mutate and isinstance(res, tuple) and len(res) == 2 and res[0] is None and res[1]:
                return op(RedisStore(ctx)), "redis"
            return res, "mongo"
        except PyMongoError:
            pass
    return op(RedisStore(ctx)), "redis"


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main(args, ctx=None):
    if ctx is None or (
        getattr(ctx, "REDIS", None) is None and getattr(ctx, "MONGODB", None) is None
    ):
        return {"ok": False, "error": "no storage backend configured"}

    method = request_method(args)
    data = request_data(args)
    task_id = request_route_id(args)
    query = request_query(args)
    q = (query.get("q") or query.get("search") or "").strip()
    flt = {k: query.get(k) for k in ("status", "priority", "category")}
    flt["overdue"] = _truthy(query.get("overdue"))

    try:
        if method == "GET":
            ck = cache_key(ctx, flt, q)
            cached = cache_get(ctx, ck)
            if cached is not None:
                return {"ok": True, "tasks": cached, "backend": "cache",
                        "count": len(cached), "cached": True}
            tasks, backend = with_store(ctx, lambda s: s.list(flt, q))
            cache_set(ctx, ck, tasks)
            return {"ok": True, "tasks": tasks, "backend": backend,
                    "count": len(tasks), "cached": False}

        if method == "POST":
            fields, err = clean_task_input(data, partial=False)
            if err:
                return {"ok": False, "error": err}
            task, backend = with_store(ctx, lambda s: s.create(fields))
            cache_invalidate(ctx)
            return {"ok": True, "task": task, "backend": backend}

        if method == "PUT":
            if not task_id:
                return {"ok": False, "error": "task id required for update"}
            fields, err = clean_task_input(data, partial=True)
            if err:
                return {"ok": False, "error": err}
            if not fields:
                return {"ok": False, "error": "no valid fields to update"}
            res, backend = with_store(ctx, lambda s: s.update(task_id, fields), mutate=True)
            value, err = res  # (task|None, err|None)
            if err:
                return {"ok": False, "error": err, "backend": backend}
            cache_invalidate(ctx)
            return {"ok": True, "task": value, "backend": backend}

        if method == "DELETE":
            if not task_id:
                return {"ok": False, "error": "task id required for delete"}
            res, backend = with_store(ctx, lambda s: s.delete(task_id), mutate=True)
            value, err = res
            if err:
                return {"ok": False, "error": err, "backend": backend}
            cache_invalidate(ctx)
            return {"ok": True, "id": value, "backend": backend}

        return {"ok": False, "error": f"method {method} not allowed"}

    except PyMongoError as e:
        return {"ok": False, "error": f"database error: {e}"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"ok": False, "error": str(e)}