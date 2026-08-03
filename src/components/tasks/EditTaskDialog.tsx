import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";
import type { Task, TaskInput } from "@/types/task";

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    id: string,
    input: TaskInput,
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onUpdate,
}: EditTaskDialogProps) {
  // Compute initial values synchronously from the task so the form pre-fills
  // correctly. The `key` on TaskForm remounts it per task.
  const initial: Partial<TaskInput> = task
    ? {
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
      }
    : {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Update the task details. Changes are saved through the tasks API.
          </DialogDescription>
        </DialogHeader>
        {task && (
          <TaskForm
            key={task.id}
            initial={initial}
            submitLabel="Save changes"
            onCancel={() => onOpenChange(false)}
            onSubmit={(input) =>
              onUpdate(task.id, input).then(() => onOpenChange(false))
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}