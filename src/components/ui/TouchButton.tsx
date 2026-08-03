import { cn } from "@/lib/utils";

// Icon-button + label touch target that meets the 44x44px minimum on mobile.
// Used for compact task actions (advance status, delete).
export function TouchButton({
  label,
  onClick,
  children,
  variant = "ghost",
  className,
  type = "button",
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "ghost" | "outline" | "destructive";
  className?: string;
  type?: "button" | "submit";
}) {
  const variants: Record<string, string> = {
    ghost:
      "text-muted-foreground hover:bg-accent/10 hover:text-accent",
    outline:
      "border border-input bg-background text-foreground hover:bg-muted",
    destructive:
      "text-destructive hover:bg-destructive/10",
  };
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}