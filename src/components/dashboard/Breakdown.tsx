import { cn } from "@/lib/utils";

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
  /** Optional accent color class for the bar + dot. */
  accent?: string;
  onClick?: () => void;
}

interface BreakdownProps {
  title: string;
  description?: string;
  items: BreakdownItem[];
  total: number;
  emptyMessage?: string;
}

export function Breakdown({
  title,
  description,
  items,
  total,
  emptyMessage = "No data yet.",
}: BreakdownProps) {
  const max = Math.max(1, ...items.map((i) => i.count), total);
  return (
    <section
      aria-label={title}
      className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        )}
      </div>

      {items.length === 0 || total === 0 ? (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex w-full flex-col gap-2.5">
          {items.map((item) => {
            const pct = Math.round((item.count / max) * 100);
            const Tag = item.onClick ? "button" : "div";
            return (
              <li key={item.key} className="w-full">
                <Tag
                  type={item.onClick ? "button" : undefined}
                  onClick={item.onClick}
                  aria-label={
                    item.onClick
                      ? `View ${item.label} tasks`
                      : undefined
                  }
                  className={cn(
                    "flex w-full flex-col gap-1.5 rounded-lg p-2 text-left transition-colors sm:flex-row sm:items-center sm:gap-3",
                    item.onClick &&
                      "cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {item.accent && (
                      <span
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          item.accent,
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate text-sm font-medium">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:max-w-[60%]">
                    <div className="h-2.5 min-w-[3rem] flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full bg-primary/70",
                          item.accent,
                        )}
                        style={{ width: `${pct}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">
                      {item.count}
                    </span>
                  </div>
                </Tag>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}