import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Samples from "./pages/Samples";
import ResultsEntry from "./pages/ResultsEntry";
import ParameterConfig from "./pages/ParameterConfig";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/samples" element={<Samples />} />
          <Route path="/results" element={<ResultsEntry />} />
          <Route path="/results/wet-chemistry" element={<ResultsEntry />} />
          <Route path="/results/instrumentation" element={<ResultsEntry />} />
          <Route path="/results/microbiology" element={<ResultsEntry />} />
          <Route path="/config/parameters" element={<ParameterConfig />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
