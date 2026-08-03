import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTasks } from "@/hooks/useTasks";
import { DashboardPage } from "@/pages/DashboardPage";
import { TasksPage } from "@/pages/TasksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const tasks = useTasks();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage tasks={tasks} />} />
              <Route path="/tasks" element={<TasksPage tasks={tasks} />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;