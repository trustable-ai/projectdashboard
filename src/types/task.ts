// Shared task domain types for the Project Dashboard Task app.

export type TaskStatus = "todo" | "in_progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO date string (yyyy-mm-dd)
  createdAt: string; // ISO date string
}

export interface TaskInput {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const TASK_STATUS_VALUES: TaskStatus[] = ["todo", "in_progress", "completed"];
export const TASK_PRIORITY_VALUES: TaskPriority[] = ["low", "medium", "high"];

/** A task is overdue when it has a due date in the past and is not completed. */
export function isTaskOverdue(task: Task, today = new Date().toISOString().slice(0, 10)): boolean {
  const due = (task.dueDate || "").trim();
  return due !== "" && due < today && task.status !== "completed";
}

export type TaskStatusFilter = TaskStatus | "all" | "pending";