import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  ListTodo,
  Loader2,
  AlertTriangle,
  Percent,
  CalendarClock,
} from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { StatCard } from "@/components/dashboard/StatCard";
import { Breakdown, type BreakdownItem } from "@/components/dashboard/Breakdown";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Task, TaskPriority } from "@/types/task";
import { isTaskOverdue, TASK_PRIORITY_LABELS } from "@/types/task";

interface DashboardPageProps {
  tasks: ReturnType<typeof useTasks>;
}

const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  low: "bg-gray-400",
  medium: "bg-amber-500",
  high: "bg-rose-500",
};

export function DashboardPage({ tasks }: DashboardPageProps) {
  const { allTasks, loading, error, meta, focusFilter, setStatus, deleteTask } =
    tasks;
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "completed").length;
    const pending = total - completed;
    const overdue = allTasks.filter((t) => isTaskOverdue(t)).length;
    const completion = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, overdue, completion };
  }, [allTasks]);

  const byPriority = useMemo(() => {
    const order: TaskPriority[] = ["high", "medium", "low"];
    return order
      .map((p) => ({
        key: p,
        label: TASK_PRIORITY_LABELS[p],
        count: allTasks.filter((t) => t.priority === p).length,
        accent: PRIORITY_ACCENT[p],
      }))
      .filter((x) => x.count > 0);
  }, [allTasks]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTasks) {
      const c = t.category || "General";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, label: key, count }))
      .sort((a, b) => b.count - a.count);
  }, [allTasks]);

  const upcoming = useMemo(
    () =>
      [...allTasks]
        .filter((t) => t.status !== "completed")
        .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
        .slice(0, 4),
    [allTasks],
  );

  function go(partial: Parameters<typeof focusFilter>[0]) {
    focusFilter(partial);
    navigate("/tasks");
  }

  function advance(task: Task) {
    const next = task.status === "todo" ? "in_progress" : "completed";
    setStatus(task.id, next);
  }
  function reopen(task: Task) {
    setStatus(task.id, "todo");
  }

  const priorityItems: BreakdownItem[] = byPriority.map((p) => ({
    ...p,
    onClick: () => go({ priority: p.key as TaskPriority }),
  }));
  const categoryItems: BreakdownItem[] = byCategory.map((c) => ({
    ...c,
    onClick: () => go({ category: c.key }),
  }));

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-medium">Couldn’t load dashboard data</p>
            <p className="break-words">{error}</p>
          </div>
        </div>
      )}

      {/* KPI stat cards — every card is clickable and navigates to Tasks
          with the matching filter applied and preserved. */}
      <section
        aria-label="Statistics"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5"
      >
        <StatCard
          label="Total"
          value={loading && allTasks.length === 0 ? "…" : stats.total}
          icon={<ListTodo className="h-5 w-5" />}
          accent="primary"
          onClick={() => go({})}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          hint={`${stats.completion}% done`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="emerald"
          onClick={() => go({ status: "completed" })}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          hint="Not completed"
          icon={<CircleDashed className="h-5 w-5" />}
          accent="blue"
          onClick={() => go({ status: "pending" })}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          hint="Past due date"
          icon={<CalendarClock className="h-5 w-5" />}
          accent="rose"
          onClick={() => go({ overdue: true })}
        />
        <StatCard
          label="Completion"
          value={`${stats.completion}%`}
          hint={`${stats.completed}/${stats.total} tasks`}
          icon={<Percent className="h-5 w-5" />}
          accent="amber"
          onClick={() => go({ status: "completed" })}
        />
      </section>

      {/* Grouped breakdowns — clickable bars navigate with the filter. */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Breakdown
          title="By priority"
          description="Click a priority to filter the Tasks page."
          items={priorityItems}
          total={stats.total}
          emptyMessage="No tasks yet."
        />
        <Breakdown
          title="By category"
          description="Click a category to filter the Tasks page."
          items={categoryItems}
          total={stats.total}
          emptyMessage="No tasks yet."
        />
      </div>

      {/* Upcoming tasks */}
      <section
        aria-label="Upcoming tasks"
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-lg">Upcoming</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Next tasks to focus on, sorted by due date.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {meta.backend && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {meta.cached ? "cached" : `via ${meta.backend}`}
              </span>
            )}
            <button
              type="button"
              onClick={() => go({ status: "pending" })}
              className="inline-flex min-h-[44px] items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Go to tasks
            </button>
          </div>
        </div>

        {loading && upcoming.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading tasks…
          </div>
        ) : upcoming.length === 0 ? (
          <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            No upcoming tasks. You’re all caught up!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {upcoming.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onAdvance={advance}
                onReset={reopen}
                onDelete={(t) => deleteTask(t.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}