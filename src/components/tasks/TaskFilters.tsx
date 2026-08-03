import { Search, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { TaskFilters as Filters } from "@/hooks/useTasks";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/types/task";
import type { TaskPriority, TaskStatus } from "@/types/task";

interface TaskFiltersProps {
  filters: Filters;
  categories: string[];
  onChange: (next: Partial<Filters>) => void;
  onReset: () => void;
}

export function TaskFilters({
  filters,
  categories,
  onChange,
  onReset,
}: TaskFiltersProps) {
  const hasActive =
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.category !== "all" ||
    filters.q.trim() !== "" ||
    filters.overdue;

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Global search bar — real-time, debounced in the hook. */}
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id="global-search"
          name="q"
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search tasks by title, description or category…"
          aria-label="Search tasks"
          className="flex min-h-[44px] w-full rounded-md border border-input bg-background py-2 pl-11 pr-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
        />
      </div>

      {/* Filter selects */}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FilterSelect
          id="filter-status"
          label="Status"
          value={filters.status}
          onChange={(v) => onChange({ status: v as Filters["status"] })}
          options={[
            { value: "all", label: "All statuses" },
            ...(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((v) => ({
              value: v,
              label: TASK_STATUS_LABELS[v],
            })),
            { value: "pending", label: "Pending (not completed)" },
          ]}
        />
        <FilterSelect
          id="filter-priority"
          label="Priority"
          value={filters.priority}
          onChange={(v) => onChange({ priority: v as TaskPriority | "all" })}
          options={[
            { value: "all", label: "All priorities" },
            ...(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((v) => ({
              value: v,
              label: TASK_PRIORITY_LABELS[v],
            })),
          ]}
        />
        <FilterSelect
          id="filter-category"
          label="Category"
          value={filters.category}
          onChange={(v) => onChange({ category: v })}
          options={categories.map((c) => ({
            value: c,
            label: c === "all" ? "All categories" : c,
          }))}
        />
      </div>

      {/* Overdue toggle */}
      <label
        htmlFor="filter-overdue"
        className="inline-flex min-h-[44px] w-fit cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      >
        <input
          id="filter-overdue"
          type="checkbox"
          checked={filters.overdue}
          onChange={(e) => onChange({ overdue: e.target.checked })}
          className="h-4 w-4 rounded border-input accent-rose-600"
        />
        <AlertTriangle
          className="h-4 w-4 text-rose-600"
          aria-hidden="true"
        />
        <span>Overdue only</span>
      </label>

      {hasActive && (
        <div>
          <button
            type="button"
            onClick={onReset}
            className="min-h-[44px] rounded-md px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear search & filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}