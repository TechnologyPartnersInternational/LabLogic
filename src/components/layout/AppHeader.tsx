import { User, HelpCircle, LogOut, Settings, ChevronLeft } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlobalSearchBar } from './GlobalSearchBar';
import { NotificationDropdown } from './NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

// Route configuration for titles
const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard' },
  '/projects': { title: 'Projects' },
  '/projects/new': { title: 'Projects', subtitle: 'Create New Project' },
  '/samples': { title: 'Samples' },
  '/results': { title: 'Results Entry' },
  '/results/wet-chemistry': { title: 'Results Entry', subtitle: 'Wet Chemistry' },
  '/results/instrumentation': { title: 'Results Entry', subtitle: 'Instrumentation' },
  '/results/microbiology': { title: 'Results Entry', subtitle: 'Microbiology' },
  '/completed': { title: 'Completed Projects' },
  '/review': { title: 'Review Queue' },
  '/reports': { title: 'Reports' },
  '/validations': { title: 'Validation Dashboard' },
  '/config/parameters': { title: 'Configuration', subtitle: 'Parameter Library' },
  '/config/methods': { title: 'Configuration', subtitle: 'Methods Library' },
  '/config/validations': { title: 'Configuration', subtitle: 'Validation Rules' },
  '/admin/users': { title: 'Administration', subtitle: 'User Management' },
  '/settings/profile': { title: 'Settings', subtitle: 'Profile' },
};

export function AppHeader() {
  const { profile, roles, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get route info, handling dynamic routes like /projects/:id
  const getRouteInfo = () => {
    const path = location.pathname;
    
    // Check for exact match first
    if (routeTitles[path]) {
      return routeTitles[path];
    }
    
    // Handle dynamic project detail route
    if (path.match(/^\/projects\/[^/]+$/)) {
      return { title: 'Projects', subtitle: 'Project Details' };
    }
    
    // Default fallback
    return { title: 'EnviroLabs Nexus' };
  };

  const routeInfo = getRouteInfo();
  const canGoBack = location.pathname !== '/';

  const handleBack = () => {
    navigate(-1);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrator';
    if (roles.some(r => r.role === 'qa_officer')) return 'QA Officer';
    if (roles.some(r => r.role === 'lab_supervisor')) return 'Lab Supervisor';
    if (roles.some(r => r.role.includes('analyst'))) return 'Lab Analyst';
    return 'Staff';
  };

  const getInitials = (name: string | null | undefined, email: string | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {/* Back Button */}
        {canGoBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">{routeInfo.title}</h1>
          {routeInfo.subtitle && (
            <p className="text-sm text-muted-foreground">{routeInfo.subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search */}
        <GlobalSearchBar />

        {/* Notifications */}
        <NotificationDropdown />

        {/* Help */}
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(profile?.full_name, profile?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">{profile?.full_name || profile?.email}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/profile" className="flex items-center cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                <User className="w-4 h-4 mr-2" />
                User Management
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
