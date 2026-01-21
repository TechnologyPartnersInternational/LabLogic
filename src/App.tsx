import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Samples from "./pages/Samples";
import ResultsEntry from "./pages/ResultsEntry";
import ParameterConfig from "./pages/ParameterConfig";
import ReviewQueue from "./pages/ReviewQueue";
import UserManagement from "./pages/UserManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/samples" element={
              <ProtectedRoute>
                <Samples />
              </ProtectedRoute>
            } />
            <Route path="/results" element={
              <ProtectedRoute>
                <ResultsEntry />
              </ProtectedRoute>
            } />
            <Route path="/results/wet-chemistry" element={
              <ProtectedRoute>
                <ResultsEntry />
              </ProtectedRoute>
            } />
            <Route path="/results/instrumentation" element={
              <ProtectedRoute>
                <ResultsEntry />
              </ProtectedRoute>
            } />
            <Route path="/results/microbiology" element={
              <ProtectedRoute>
                <ResultsEntry />
              </ProtectedRoute>
            } />
            <Route path="/review" element={
              <ProtectedRoute requireSupervisor>
                <ReviewQueue />
              </ProtectedRoute>
            } />
            <Route path="/config/parameters" element={
              <ProtectedRoute>
                <ParameterConfig />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
