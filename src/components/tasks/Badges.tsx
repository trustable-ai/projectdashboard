import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types/task";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/types/task";

const statusStyles: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
        className,
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        priorityStyles[priority],
        className,
      )}
    >
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}