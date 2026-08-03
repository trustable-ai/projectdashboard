import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, ListTodo, X } from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "Tasks", icon: ListTodo, end: false },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex h-full flex-col gap-1 p-3">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          activeClassName="bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ListTodo className="h-5 w-5" aria-hidden="true" />
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            Project Dashboard
          </p>
          <p className="truncate text-xs text-muted-foreground">Task board</p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside
        aria-label="Sidebar"
        className={cn(
          "hidden md:flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-in-out",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <Brand collapsed={collapsed} />
        <NavList />
        <div className="mt-auto p-3 text-[11px] leading-relaxed text-muted-foreground">
          {!collapsed && <p>v0.1 · Mobile-first</p>}
        </div>
      </aside>

      {/* Mobile slide-out drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Overlay */}
        <div
          onClick={onCloseMobile}
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Drawer panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute left-0 top-0 h-full w-64 max-w-[85vw] bg-sidebar border-r border-sidebar-border shadow-xl transition-transform duration-200 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex min-h-[44px] flex-1 items-center gap-2 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ListTodo className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  Project Dashboard
                </p>
                <p className="truncate text-xs text-muted-foreground">Task board</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={onCloseMobile}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md mr-2 text-muted-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <NavList onNavigate={onCloseMobile} />
        </div>
      </div>
    </>
  );
}