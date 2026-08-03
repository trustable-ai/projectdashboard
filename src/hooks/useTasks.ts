import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openServerlessService } from "@/services/openServerlessService";
import { todoWriteService } from "@/services/todoWriteService";
import type { Task, TaskInput, TaskPriority, TaskStatus, TaskStatusFilter } from "@/types/task";

export interface TaskFilters {
  status: TaskStatusFilter;
  priority: TaskPriority | "all";
  category: string;
  q: string;
  overdue: boolean;
}

export const defaultFilters: TaskFilters = {
  status: "all",
  priority: "all",
  category: "all",
  q: "",
  overdue: false,
};

export interface TaskListMeta {
  backend?: "mongo" | "redis" | "cache";
  cached?: boolean;
}

export function useTasks() {
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [meta, setMeta] = useState<TaskListMeta>({});
  const [reloadSeq, setReloadSeq] = useState(0);
  const seqRef = useRef(0);

  // Fetch the filtered task list (display). Search (q) is debounced so the
  // global search bar updates in real time without spamming the API.
  useEffect(() => {
    const mine = ++seqRef.current;
    const delay = filters.q ? 220 : 0;
    const handle = setTimeout(() => {
      setLoading(true);
      openServerlessService
        .listTasks(filters)
        .then((r) => {
          if (mine !== seqRef.current) return; // a newer request superseded this
          if (r.ok && r.data) {
            setTasks(r.data.tasks ?? []);
            setMeta({
              backend: r.data.backend,
              cached: r.data.cached,
            });
            setError(undefined);
          } else {
            setError(r.error || "Failed to load tasks");
            setTasks([]);
          }
        })
        .finally(() => {
          if (mine === seqRef.current) setLoading(false);
        });
    }, delay);
    return () => clearTimeout(handle);
  }, [filters, reloadSeq]);

  // Fetch the unfiltered list once (and after mutations) to populate the
  // category dropdown. Redis caching makes this cheap.
  const refreshAll = useCallback(() => {
    openServerlessService.listTasks({}).then((r) => {
      if (r.ok && r.data) setAllTasks(r.data.tasks ?? []);
    });
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll, reloadSeq]);

  const categories = useMemo(() => {
    const set = new Set(allTasks.map((t) => t.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [allTasks]);

  const bump = useCallback(() => setReloadSeq((n) => n + 1), []);
  const reload = useCallback(() => bump(), [bump]);

  const createTask = useCallback(
    async (input: TaskInput): Promise<{ ok: boolean; error?: string }> => {
      const r = await todoWriteService.create(input);
      if (r.ok) bump();
      return { ok: r.ok, error: r.error };
    },
    [bump],
  );

  const updateTask = useCallback(
    async (
      id: string,
      input: Partial<TaskInput>,
    ): Promise<{ ok: boolean; error?: string }> => {
      const r = await todoWriteService.update(id, input);
      if (r.ok) bump();
      return { ok: r.ok, error: r.error };
    },
    [bump],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      const r = await todoWriteService.remove(id);
      if (r.ok) bump();
      return { ok: r.ok, error: r.error };
    },
    [bump],
  );

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => updateTask(id, { status }),
    [updateTask],
  );

  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  /** Reset filters then apply a partial — used by dashboard cards to focus a
   * subset and navigate to the Tasks page. */
  const focusFilter = useCallback(
    (partial: Partial<TaskFilters>) => setFilters({ ...defaultFilters, ...partial }),
    [],
  );

  return {
    tasks,
    allTasks,
    filters,
    setFilters,
    focusFilter,
    categories,
    loading,
    error,
    meta,
    createTask,
    updateTask,
    deleteTask,
    setStatus,
    resetFilters,
    reload,
  };
}