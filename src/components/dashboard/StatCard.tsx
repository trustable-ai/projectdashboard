import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  accent?: "primary" | "emerald" | "amber" | "rose" | "slate" | "blue";
  onClick?: () => void;
  active?: boolean;
}

const accents: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "primary",
  onClick,
  active = false,
}: StatCardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `View ${label} on Tasks page` : undefined}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors sm:p-5",
        onClick &&
          "cursor-pointer hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "border-primary/60 ring-1 ring-primary/30" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
            {label}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accents[accent],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
        {hint && (
          <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
            {hint}
          </p>
        )}
      </div>
    </Tag>
  );
}