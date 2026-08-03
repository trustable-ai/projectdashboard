import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tasks",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const title = pageTitles[location.pathname] ?? "Project Dashboard";

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-4">
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Tablet+ collapse toggle */}
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">
            {title}
          </h1>
        </header>

        {/* Main content */}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 focus:outline-none",
          )}
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}