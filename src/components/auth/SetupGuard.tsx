import { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useLabSettings } from '@/hooks/useLabSettings';
import { Loader2, FlaskConical, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SetupGuardProps {
  children: ReactNode;
}

export function SetupGuard({ children }: SetupGuardProps) {
  const { isAdmin, loading: authLoading, profile, signOut } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();
  const { data: settings, isLoading: settingsLoading } = useLabSettings();

  console.log("SetupGuard Load States:", { authLoading, orgLoading, settingsLoading });

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

  if (!orgId || !organization) {
    if (isAdmin) {
      return <Navigate to="/register-lab" replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <FlaskConical className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Workspace Not Configured</h1>
          <p className="text-muted-foreground mb-6">
            Your laboratory has not been set up yet. Please contact your administrator for an invitation, or register a new lab.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/register-lab">Register a New Lab</Link>
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
