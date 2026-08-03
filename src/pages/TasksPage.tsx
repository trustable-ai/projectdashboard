import { useState } from "react";
import {
  Plus,
  Loader2,
  AlertTriangle,
  Database,
  Zap,
} from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { Button } from "@/components/ui/button";
import type { Task, TaskInput } from "@/types/task";

interface TasksPageProps {
  tasks: ReturnType<typeof useTasks>;
}

export function TasksPage({ tasks }: TasksPageProps) {
  const {
    tasks: list,
    filters,
    setFilters,
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
  } = tasks;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  function advance(task: Task) {
    const next = task.status === "todo" ? "in_progress" : "completed";
    setStatus(task.id, next);
  }
  function reopen(task: Task) {
    setStatus(task.id, "todo");
  }
  function openEdit(task: Task) {
    setEditTarget(task);
    setFormError(undefined);
    setEditOpen(true);
  }
  async function handleCreate(input: TaskInput): Promise<{ ok: boolean; error?: string }> {
    setFormError(undefined);
    const r = await createTask(input);
    if (!r.ok) setFormError(r.error);
    return r;
  }
  async function handleUpdate(id: string, input: TaskInput): Promise<{ ok: boolean; error?: string }> {
    setFormError(undefined);
    const r = await updateTask(id, input);
    if (!r.ok) setFormError(r.error);
    return r;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${list.length} task${list.length === 1 ? "" : "s"} shown`}
          </p>
        </div>
        <Button
          onClick={() => {
            setFormError(undefined);
            setDialogOpen(true);
          }}
          className="min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New task
        </Button>
      </div>

      <section
        aria-label="Search and filters"
        className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4"
      >
        <TaskFilters
          filters={filters}
          categories={categories}
          onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
          onReset={resetFilters}
        />
      </section>

      {meta.backend && (
        <p className="inline-flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            {meta.cached ? "served from cache" : `via ${meta.backend}`}
          </span>
          {meta.cached && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              fast Redis cache
            </span>
          )}
        </p>
      )}

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="break-words">{formError}</p>
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-start"
        >
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-medium">Couldn’t load tasks</p>
              <p className="break-words">{error}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={reload}
            className="min-h-[44px] w-full border-destructive/40 text-destructive hover:bg-destructive/10 sm:ml-auto sm:w-auto"
          >
            Try again
          </Button>
        </div>
      )}

      {loading && list.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading tasks…
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tasks match the current search or filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setFormError(undefined);
              setDialogOpen(true);
            }}
            className="min-h-[44px]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add a task
          </Button>
        </div>
      ) : (
        <section
          aria-label="Task list"
          aria-live="polite"
          aria-busy={loading}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3"
        >
          {list.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onAdvance={advance}
              onReset={reopen}
              onEdit={openEdit}
              onDelete={(t) => deleteTask(t.id)}
            />
          ))}
        </section>
      )}

      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
      <EditTaskDialog
        task={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdate={handleUpdate}
      />
    </div>
  );
}