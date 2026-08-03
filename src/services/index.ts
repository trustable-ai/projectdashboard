// Central export point for the services layer.
// MongoDB (primary store), Redis (cache + fallback), and the TodoWrite
// gateway are wired through the OpenServerless tasks API.

export { apiFetch } from "./api";
export type { ApiResult } from "./api";
export { openServerlessService } from "./openServerlessService";
export type { TaskListParams, TaskListResponse } from "./openServerlessService";
export { todoWriteService } from "./todoWriteService";
export type { TodoWriteResult } from "./todoWriteService";
export { mongoService } from "./mongoService";
export { redisService } from "./redisService";