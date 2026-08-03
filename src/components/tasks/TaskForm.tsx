import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/types/task";
import type { TaskInput, TaskPriority, TaskStatus } from "@/types/task";

interface TaskFormProps {
  initial?: Partial<TaskInput>;
  onSubmit: (input: TaskInput) => Promise<unknown> | void;
  onCancel?: () => void;
  submitLabel?: string;
}

const empty: TaskInput = {
  title: "",
  description: "",
  category: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
};

export function TaskForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Add task",
}: TaskFormProps) {
  const [form, setForm] = useState<TaskInput>({ ...empty, ...initial });
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        category: form.category.trim() || "General",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          name="title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Implement global search"
          autoComplete="off"
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="task-description">Description</Label>
        <textarea
          id="task-description"
          name="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Optional details"
          rows={3}
          disabled={submitting}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="task-category">
          <Input
            id="task-category"
            name="category"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="e.g. Frontend"
            autoComplete="off"
            list="task-category-list"
            disabled={submitting}
          />
          <datalist id="task-category-list">
            {["Frontend", "Backend", "Design", "Documentation", "QA", "Discovery"].map(
              (c) => (
                <option key={c} value={c} />
              ),
            )}
          </datalist>
        </Field>
        <Field label="Due date" htmlFor="task-due">
          <Input
            id="task-due"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
            disabled={submitting}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="task-status">
          <Select
            id="task-status"
            value={form.status}
            onChange={(v) => update("status", v as TaskStatus)}
            disabled={submitting}
            options={TASK_STATUS_VALUES.map((v) => ({
              value: v,
              label: TASK_STATUS_LABELS[v],
            }))}
          />
        </Field>
        <Field label="Priority" htmlFor="task-priority">
          <Select
            id="task-priority"
            value={form.priority}
            onChange={(v) => update("priority", v as TaskPriority)}
            disabled={submitting}
            options={TASK_PRIORITY_VALUES.map((v) => ({
              value: v,
              label: TASK_PRIORITY_LABELS[v],
            }))}
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] w-full sm:w-auto"
        >
          {submitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      name={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}