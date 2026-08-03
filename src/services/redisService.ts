// Redis integration placeholder.
//
// Redis will back authenticated application sessions and ephemeral caches once
// the auth endpoints are introduced. Every session key must be built from
// `ctx.REDIS_PREFIX` on the server; the browser only stores the opaque token.
//
// This module is a structural placeholder for the future client-side helpers
// (token storage, session validation) and intentionally has no runtime
// connection to Redis.

export type RedisStatus = "non configurato" | "configurato";

export const redisService = {
  status: "non configurato" as RedisStatus,

  isConfigured(): boolean {
    return this.status === "configurato";
  },

  // TODO(step 4): call the v1/session action that validates the opaque token
  // against the Redis record built with ctx.REDIS_PREFIX.
};