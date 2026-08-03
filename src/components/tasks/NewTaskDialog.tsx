import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";
import type { TaskInput } from "@/types/task";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: TaskInput) => Promise<{ ok: boolean; error?: string }>;
}

export function NewTaskDialog({
  open,
  onOpenChange,
  onCreate,
}: NewTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Add a task to the board. It is saved through the tasks API.
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          onSubmit={(input) => onCreate(input).then(() => onOpenChange(false))}
          onCancel={() => onOpenChange(false)}
          submitLabel="Create task"
        />
      </DialogContent>
    </Dialog>
  );
}