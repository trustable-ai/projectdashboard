// OpenServerless / Nuvolaris tasks API client.
//
// Public actions live under the "v1" package and are reachable at
// "/api/my/v1/tasks". Frontend code uses relative URLs so the browser keeps its
// origin and the managed Vite proxy forwards to OpenServerless.

import { apiFetch, type ApiResult } from "./api";
import type { Task, TaskInput, TaskPriority, TaskStatus, TaskStatusFilter } from "@/types/task";

const BASE = "/api/my/v1/tasks";

export interface TaskListParams {
  status?: TaskStatusFilter;
  priority?: TaskPriority | "all";
  category?: string;
  q?: string;
  overdue?: boolean;
}

export interface TaskListResponse {
  ok: boolean;
  tasks: Task[];
  backend?: "mongo" | "redis" | "cache";
  count?: number;
  cached?: boolean;
  error?: string;
}

function toQuery(params: TaskListParams): string {
  const sp = new URLSearchParams();
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.priority && params.priority !== "all") sp.set("priority", params.priority);
  if (params.category && params.category !== "all") sp.set("category", params.category);
  if (params.q && params.q.trim()) sp.set("q", params.q.trim());
  if (params.overdue) sp.set("overdue", "true");
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const openServerlessService = {
  listTasks(params: TaskListParams = {}): Promise<ApiResult<TaskListResponse>> {
    return apiFetch<TaskListResponse>(`${BASE}${toQuery(params)}`);
  },
  createTask(input: TaskInput): Promise<ApiResult<Task>> {
    return apiFetch<Task>(BASE, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateTask(id: string, input: Partial<TaskInput>): Promise<ApiResult<Task>> {
    return apiFetch<Task>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },
  deleteTask(id: string): Promise<ApiResult<{ id: string }>> {
    return apiFetch<{ id: string }>(`${BASE}/${id}`, {
      method: "DELETE",
    });
  },
};