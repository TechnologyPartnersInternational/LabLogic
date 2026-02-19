import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useLabSettings } from '@/hooks/useLabSettings';
import { Loader2, FlaskConical } from 'lucide-react';

interface SetupGuardProps {
  children: ReactNode;
}

export function SetupGuard({ children }: SetupGuardProps) {
  const { isAdmin, loading: authLoading, profile } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();
  const { data: settings, isLoading: settingsLoading } = useLabSettings();

  if (authLoading || orgLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const orgId = (profile as any)?.organization_id;

  // No organization linked — redirect admin to register, block others
  if (!orgId || !organization) {
    if (isAdmin) {
      return <Navigate to="/register-lab" replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <FlaskConical className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Workspace Not Configured</h1>
          <p className="text-muted-foreground">
            Your laboratory has not been set up yet. Please contact your administrator to complete the initial setup or register a new lab.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
