import { CalendarDays, FolderKanban, Clock, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "./Badges";
import type { Task } from "@/types/task";

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: Task) => void;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onEdit,
}: TaskDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto p-4 sm:p-6">
        {task && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
              <DialogTitle className="break-words pt-1 text-left text-lg leading-snug">
                {task.title}
              </DialogTitle>
            </DialogHeader>

            {task.description ? (
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {task.description}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No description.
              </p>
            )}

            <dl className="grid grid-cols-1 gap-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FolderKanban className="h-4 w-4 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Category</dt>
                <dd className="break-words">{task.category}</dd>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Due date</dt>
                <dd className="break-words">Due {task.dueDate || "—"}</dd>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Created</dt>
                <dd className="break-words">
                  Created {task.createdAt ? task.createdAt.slice(0, 10) : "—"}
                </dd>
              </div>
            </dl>

            {onEdit && (
              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(task);
                  }}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit task
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
