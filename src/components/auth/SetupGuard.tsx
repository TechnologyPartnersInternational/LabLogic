import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLabSettings } from '@/hooks/useLabSettings';
import { Loader2, FlaskConical } from 'lucide-react';

interface SetupGuardProps {
  children: ReactNode;
}

export function SetupGuard({ children }: SetupGuardProps) {
  const { isAdmin, loading: authLoading, organizationId } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useLabSettings();

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // If user has no organization, redirect to register
  if (!organizationId) {
    if (isAdmin) {
      return <Navigate to="/register-lab" replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <FlaskConical className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-3">No Organization</h1>
          <p className="text-muted-foreground">
            Your account is not linked to any laboratory organization.
            Please contact your administrator for an invitation link.
          </p>
        </div>
      </div>
    );
  }

  const hasLabType = settings?.lab_type && settings.lab_type.length > 0;

  if (!hasLabType) {
    if (isAdmin) {
      return <Navigate to="/setup" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <FlaskConical className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Workspace Not Configured</h1>
          <p className="text-muted-foreground">
            Your administrator has not configured the laboratory workspace yet. 
            Please contact your admin to complete the initial setup.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
