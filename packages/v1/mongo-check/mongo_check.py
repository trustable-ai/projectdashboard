"""Diagnostic: compare PLAIN (ctx.MONGODB) vs SCRAM (authMechanism stripped)
to determine which auth mechanism FerretDB accepts. Does not echo the URI."""

import os
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from pymongo import MongoClient
from pymongo.errors import PyMongoError


def strip_auth_mechanism(uri):
    """Remove authMechanism (and related) params so pymongo uses SCRAM default."""
    try:
        p = urlparse(uri)
        params = [(k, v) for k, v in parse_qsl(p.query) if k.lower() != "authmechanism"]
        new_query = urlencode(params)
        return urlunparse(p._replace(query=new_query))
    except Exception:
        return uri


def try_connect(label, uri):
    if not uri:
        return {"label": label, "ok": False, "error": "no uri"}
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=8000)
        db = client.get_default_database()
        names = db.list_collection_names()
        return {"label": label, "ok": True, "db": db.name, "collections": sorted(names)}
    except PyMongoError as e:
        return {"label": label, "ok": False, "error": str(e)[:160]}
    except Exception as e:
        return {"label": label, "ok": False, "error": str(e)[:160]}


def main(args, ctx=None):
    bound_uri = args.get("MONGODB_URI") if isinstance(args, dict) else None
    scram_uri = strip_auth_mechanism(bound_uri) if bound_uri else None

    results = {
        "bound_uri_present": bool(bound_uri),
        "bound_uri_len": len(str(bound_uri)) if bound_uri else 0,
        "has_authmechanism_plain": "authMechanism=PLAIN" in (bound_uri or ""),
        "scram_uri_len": len(str(scram_uri)) if scram_uri else 0,
        "plain_via_ctx": None,
        "scram_stripped": None,
    }

    # Test 1: PLAIN via ctx.MONGODB (the generated binding)
    if ctx is not None and hasattr(ctx, "MONGODB") and ctx.MONGODB is not None:
        try:
            db = ctx.MONGODB
            names = db.list_collection_names()
            results["plain_via_ctx"] = {"ok": True, "db": db.name, "collections": sorted(names)}
        except PyMongoError as e:
            results["plain_via_ctx"] = {"ok": False, "error": str(e)[:160]}
        except Exception as e:
            results["plain_via_ctx"] = {"ok": False, "error": str(e)[:160]}
    else:
        results["plain_via_ctx"] = {"ok": False, "error": "ctx.MONGODB absent"}

    # Test 2: SCRAM (authMechanism stripped) with a fresh client
    results["scram_stripped"] = try_connect("scram", scram_uri)

    return results