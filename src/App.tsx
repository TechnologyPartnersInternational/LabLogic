import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { SetupGuard } from "@/components/auth/SetupGuard";
import Dashboard from "./pages/Dashboard";
import LabSetupWizard from "./pages/LabSetupWizard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import CreateProject from "./pages/CreateProject";
import Samples from "./pages/Samples";
import ResultsEntry from "./pages/ResultsEntry";
import ParameterConfig from "./pages/ParameterConfig";
import MethodsConfig from "./pages/MethodsConfig";
import ValidationConfig from "./pages/ValidationConfig";
import CalculationsConfig from "./pages/CalculationsConfig";
import MatrixConfig from "./pages/MatrixConfig";
import ValidationDashboard from "./pages/ValidationDashboard";
import ReviewQueue from "./pages/ReviewQueue";
import Reports from "./pages/Reports";
import CompletedProjects from "./pages/CompletedProjects";
import UserManagement from "./pages/UserManagement";
import DepartmentManagement from "./pages/DepartmentManagement";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ProfileSettings from "./pages/ProfileSettings";
import RegisterLab from "./pages/RegisterLab";
import JoinOrganization from "./pages/JoinOrganization";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/register-lab" element={<RegisterLab />} />
              <Route path="/join/:orgSlug" element={<JoinOrganization />} />
              
              {/* Setup wizard (auth required, no layout) */}
              <Route path="/setup" element={<ProtectedRoute><LabSetupWizard /></ProtectedRoute>} />

              {/* Protected routes with shared layout */}
              <Route element={<ProtectedRoute><SetupGuard><MainLayout /></SetupGuard></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/projects/new" element={<CreateProject />} />
                <Route path="/samples" element={<Samples />} />
                <Route path="/results" element={<ResultsEntry />} />
                <Route path="/results/:departmentSlug" element={<ResultsEntry />} />
                <Route path="/completed" element={<CompletedProjects />} />
                <Route path="/settings/profile" element={<ProfileSettings />} />
              </Route>

              {/* Supervisor routes with shared layout */}
              <Route element={<ProtectedRoute requireSupervisor><SetupGuard><MainLayout /></SetupGuard></ProtectedRoute>}>
                <Route path="/review" element={<ReviewQueue />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              {/* QA Officer routes with shared layout */}
              <Route element={<ProtectedRoute requireQaOfficer><SetupGuard><MainLayout /></SetupGuard></ProtectedRoute>}>
                <Route path="/validations" element={<ValidationDashboard />} />
              </Route>

              {/* Admin routes with shared layout */}
              <Route element={<ProtectedRoute requireAdmin><SetupGuard><MainLayout /></SetupGuard></ProtectedRoute>}>
                <Route path="/config/parameters" element={<ParameterConfig />} />
                <Route path="/config/methods" element={<MethodsConfig />} />
                <Route path="/config/validations" element={<ValidationConfig />} />
                <Route path="/config/calculations" element={<CalculationsConfig />} />
                <Route path="/config/matrices" element={<MatrixConfig />} />
                <Route path="/config/departments" element={<DepartmentManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />
              </Route>

              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
