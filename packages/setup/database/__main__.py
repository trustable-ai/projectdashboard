#--kind python:default
#--web false
# Note: this timeout is 5 minutes - 10 minutes is max allowed
#--timeout 300000
import types, os, database

builder = []
## build-context ##
#--param REDIS_URL "$REDIS_URL"
#--param REDIS_PREFIX "$REDIS_PREFIX"
import redis
def init_redis(args, ctx):
  ctx.REDIS = redis.from_url(args.get("REDIS_URL", os.getenv("REDIS_URL")), decode_responses=True)
  ctx.REDIS_PREFIX = args.get("REDIS_PREFIX", os.getenv("REDIS_PREFIX"))
builder.append(init_redis)
#--param MONGODB_URI "$MONGODB_URI"
from pymongo import MongoClient
def init_mongodb(args, ctx):
  uri = args.get("MONGODB_URI", os.getenv("MONGODB_URI"))
  if not uri:
    raise RuntimeError("MONGODB_URI is not configured for this action")
  ctx.MONGODB_CLIENT = MongoClient(uri)
  ctx.MONGODB = ctx.MONGODB_CLIENT.get_default_database()
builder.append(init_mongodb)

def main(args):
  try:
    ctx = types.SimpleNamespace()
    for fn in builder: fn(args, ctx)
    return { "body": database.main(args, ctx=ctx) }
  except Exception as e:
    import traceback
    traceback.print_exc()
    return {
      "body": {"error": str(e) },
      "statusCode": 500
    }
