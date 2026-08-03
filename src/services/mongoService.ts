// MongoDB integration placeholder.
//
// The document database will back task storage once the official MongoDB
// capability is configured. The action wrapper will expose
// `ctx.MONGODB_CLIENT` / `ctx.MONGODB` to the editable module; the browser
// never holds a connection string.
//
// Until then, the tasks service falls back to local mock data and reports a
// deterministic "non configurato" state here.

export type MongoStatus = "non configurato" | "configurato";

export const mongoService = {
  status: "non configurato" as MongoStatus,

  isConfigured(): boolean {
    return this.status === "configurato";
  },

  // TODO(step 3): call the public v1 action that uses ctx.MONGODB to read/write
  // the "tasks" collection. No connection details live in the browser.
};