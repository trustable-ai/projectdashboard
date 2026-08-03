// TodoWrite gateway — the high-level task-operation manager.
//
// The app routes create/update/delete/status changes through this gateway so
// task operations are managed in one place. It delegates to the OpenServerless
// tasks API (openServerlessService), which uses MongoDB as the primary store
// and Redis for caching/fallback.

import { openServerlessService } from "./openServerlessService";
import type { Task, TaskInput, TaskStatus } from "@/types/task";

export interface TodoWriteResult {
  ok: boolean;
  error?: string;
  task?: Task;
  id?: string;
}

export const todoWriteService = {
  async create(input: TaskInput): Promise<TodoWriteResult> {
    const r = await openServerlessService.createTask(input);
    return r.ok && r.data
      ? { ok: true, task: r.data }
      : { ok: false, error: r.error };
  },

  async update(id: string, input: Partial<TaskInput>): Promise<TodoWriteResult> {
    const r = await openServerlessService.updateTask(id, input);
    return r.ok && r.data
      ? { ok: true, task: r.data }
      : { ok: false, error: r.error };
  },

  async remove(id: string): Promise<TodoWriteResult> {
    const r = await openServerlessService.deleteTask(id);
    return r.ok ? { ok: true, id } : { ok: false, error: r.error };
  },

  async setStatus(id: string, status: TaskStatus): Promise<TodoWriteResult> {
    return this.update(id, { status });
  },
};