import { cn } from "@/lib/utils";
import { CalendarDays, FolderKanban, Pencil } from "lucide-react";
import type { Task } from "@/types/task";
import { PriorityBadge, StatusBadge } from "./Badges";
import { TouchButton } from "@/components/ui/TouchButton";
import { ArrowRightCircle, CheckCircle2, Trash2, RotateCcw } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onAdvance?: (task: Task) => void;
  onReset?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onOpen?: (task: Task) => void;
}

function nextStatusLabel(status: Task["status"]): string {
  if (status === "todo") return "Start";
  if (status === "in_progress") return "Complete";
  return "Done";
}

export function TaskCard({ task, onAdvance, onReset, onEdit, onDelete, onOpen }: TaskCardProps) {
  return (
    <article className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        <span className="ml-auto inline-flex items-center gap-1 truncate rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{task.category}</span>
        </span>
      </div>

      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(task)}
          aria-label={`Open details for ${task.title}`}
          className="group -mx-1 -my-0.5 flex flex-col gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="text-base font-semibold leading-snug break-words group-hover:underline sm:text-lg">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground break-words line-clamp-3">
              {task.description}
            </p>
          )}
        </button>
      ) : (
        <>
          <h3 className="text-base font-semibold leading-snug break-words sm:text-lg">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground break-words line-clamp-3">
              {task.description}
            </p>
          )}
        </>
      )}

      <p className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">Due {task.dueDate || "—"}</span>
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {task.status !== "completed" ? (
          <TouchButton
            variant="outline"
            label={nextStatusLabel(task.status)}
            onClick={() => onAdvance?.(task)}
          >
            <ArrowRightCircle className="h-4 w-4" aria-hidden="true" />
            <span>{nextStatusLabel(task.status)}</span>
          </TouchButton>
        ) : (
          <TouchButton
            variant="ghost"
            label="Reopen task"
            onClick={() => onReset?.(task)}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reopen</span>
          </TouchButton>
        )}
        {task.status === "completed" && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400",
            )}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Completed
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {onEdit && (
            <TouchButton
              variant="ghost"
              label="Edit task"
              onClick={() => onEdit?.(task)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Edit</span>
            </TouchButton>
          )}
          <TouchButton
            variant="destructive"
            label="Delete task"
            onClick={() => onDelete?.(task)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Delete</span>
          </TouchButton>
        </div>
      </div>
    </article>
  );
}