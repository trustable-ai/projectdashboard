"""Idempotent setup for the tasks store.

Primary: MongoDB — creates the `tasks` collection, ensures indexes, and seeds
starter tasks exactly once via a durable marker in the `meta` collection.
Fallback: Redis — if MongoDB is unavailable (e.g. a stale managed credential),
seeds the Redis-backed fallback store (used by v1/tasks) so the app has data.

Safe to run repeatedly.
"""

import json
from datetime import datetime, timezone
from pymongo.errors import PyMongoError

COLLECTION = "tasks"
META_COLLECTION = "meta"
SEED_MARKER = "tasks_seeded_v1"

H_KEY = "tasks:store:h"
IDS_KEY = "tasks:store:ids"
SEQ_KEY = "tasks:store:seq"
CACHE_SET = "tasks:cache:keys"


SEED_TASKS = [
    {
        "title": "Define project scope",
        "description": "Write down goals, success criteria and the MVP feature list for the dashboard.",
        "category": "Discovery",
        "priority": "high",
        "dueDate": "2025-01-08",
        "status": "completed",
        "createdAt": "2024-12-20T00:00:00+00:00",
    },
    {
        "title": "Design mobile-first layout",
        "description": "Create responsive wireframes for 320px, 768px and 1440px breakpoints.",
        "category": "Design",
        "priority": "high",
        "dueDate": "2025-01-14",
        "status": "in_progress",
        "createdAt": "2024-12-28T00:00:00+00:00",
    },
    {
        "title": "Set up component library",
        "description": "Configure reusable UI components and Tailwind theme tokens.",
        "category": "Frontend",
        "priority": "medium",
        "dueDate": "2025-01-18",
        "status": "in_progress",
        "createdAt": "2025-01-02T00:00:00+00:00",
    },
    {
        "title": "Implement task cards",
        "description": "Build the responsive task card component for mobile and desktop views.",
        "category": "Frontend",
        "priority": "medium",
        "dueDate": "2025-01-22",
        "status": "todo",
        "createdAt": "2025-01-05T00:00:00+00:00",
    },
    {
        "title": "Prepare MongoDB service",
        "description": "Wire the tasks collection through OpenServerless actions.",
        "category": "Backend",
        "priority": "low",
        "dueDate": "2025-01-25",
        "status": "todo",
        "createdAt": "2025-01-06T00:00:00+00:00",
    },
    {
        "title": "Wire Redis session plan",
        "description": "Document how Redis-backed sessions will plug into the services layer.",
        "category": "Backend",
        "priority": "low",
        "dueDate": "2025-01-28",
        "status": "todo",
        "createdAt": "2025-01-07T00:00:00+00:00",
    },
]


def rkey(ctx, name):
    return f"{getattr(ctx, 'REDIS_PREFIX', '') or ''}pdt:{name}"


def setup_mongo(ctx):
    db = ctx.MONGODB
    report = {"backend": "mongo", "collection": COLLECTION, "indexes": [], "seeded": 0}
    existing = db.list_collection_names()
    if COLLECTION not in existing:
        db.create_collection(COLLECTION)
        report["created"] = True
    coll = db[COLLECTION]
    for name, keys in [
        ("status", [("status", 1)]),
        ("priority", [("priority", 1)]),
        ("category", [("category", 1)]),
        ("dueDate", [("dueDate", 1)]),
    ]:
        coll.create_index(keys, name=name, background=True)
        report["indexes"].append(name)
    meta = db[META_COLLECTION]
    if meta.find_one({"_id": SEED_MARKER}) is None:
        now = datetime.now(timezone.utc).isoformat()
        docs = [{**t} for t in SEED_TASKS]
        if docs:
            coll.insert_many(docs)
            report["seeded"] = len(docs)
        meta.update_one(
            {"_id": SEED_MARKER},
            {"$set": {"seeded": True, "createdAt": now}},
            upsert=True,
        )
    report["count"] = coll.count_documents({})
    report["ok"] = True
    return report


def setup_redis(ctx):
    r = ctx.REDIS
    h = rkey(ctx, H_KEY)
    ids = rkey(ctx, IDS_KEY)
    seq = rkey(ctx, SEQ_KEY)
    report = {"backend": "redis", "seeded": 0}

    # Invalidate any stale list/search cache.
    try:
        ckeys = list(r.smembers(rkey(ctx, CACHE_SET)) or [])
        if ckeys:
            r.delete(*ckeys)
        r.delete(rkey(ctx, CACHE_SET))
    except Exception:
        pass

    existing = r.hlen(h) or 0
    if existing == 0:
        # Seed only when the fallback store is empty.
        r.set(seq, 0)
        for i, t in enumerate(SEED_TASKS, start=1):
            tid = f"r-{i}"
            doc = {**t, "id": tid}
            r.hset(h, tid, json.dumps(doc))
            r.sadd(ids, tid)
        r.incrby(seq, len(SEED_TASKS))
        report["seeded"] = len(SEED_TASKS)

    report["count"] = r.hlen(h) or 0
    report["ok"] = True
    return report


def main(args, ctx=None):
    if not ctx:
        return {"ok": False, "error": "no context configured"}

    # Try MongoDB first (primary store).
    if getattr(ctx, "MONGODB", None) is not None:
        try:
            return setup_mongo(ctx)
        except PyMongoError as e:
            mongo_err = f"database error: {e}"
        except Exception as e:
            mongo_err = str(e)
    else:
        mongo_err = "MongoDB non configurato"

    # Fall back to Redis seeding so the app stays functional.
    if getattr(ctx, "REDIS", None) is not None:
        report = setup_redis(ctx)
        report["mongoError"] = mongo_err
        report["note"] = (
            "MongoDB unavailable; seeded Redis fallback store. "
            "v1/tasks will serve from Redis until MongoDB is re-synced."
        )
        return report

    return {"ok": False, "error": mongo_err}