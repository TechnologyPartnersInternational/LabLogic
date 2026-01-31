import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  FolderKanban,
  ClipboardList,
  Settings,
  Database,
  FileText,
  CheckCircle2,
  Beaker,
  Microscope,
  Activity,
  Users,
  ShieldCheck,
  Archive,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLabSettings } from '@/hooks/useLabSettings';
import appLogo from '@/assets/envirolab-logo.png';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Samples', href: '/samples', icon: ClipboardList },
  {
    name: 'Results Entry',
    href: '/results',
    icon: FlaskConical,
    children: [
      { name: 'Wet Chemistry', href: '/results/wet-chemistry', icon: Beaker },
      { name: 'Instrumentation', href: '/results/instrumentation', icon: Activity },
      { name: 'Microbiology', href: '/results/microbiology', icon: Microscope },
    ],
  },
  { name: 'Review & Approval', href: '/review', icon: CheckCircle2, supervisorOnly: true },
  { name: 'Validation Dashboard', href: '/validations', icon: ShieldCheck, qaOnly: true },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    supervisorOnly: true,
    children: [
      { name: 'Reports & Release', href: '/reports', icon: Send },
      { name: 'Completed Projects', href: '/completed', icon: Archive },
    ],
  },
  {
    name: 'Configuration',
    href: '/config/parameters',
    icon: Settings,
    children: [
      { name: 'Parameter Library', href: '/config/parameters', icon: Database },
      { name: 'Methods Library', href: '/config/methods', icon: FlaskConical },
      { name: 'Validation Rules', href: '/config/validations', icon: ShieldCheck },
    ],
    adminOnly: true,
  },
  { 
    name: 'User Management', 
    href: '/admin/users', 
    icon: Users,
    adminOnly: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin, isQaOfficer, isLabSupervisor } = useAuth();
  const { data: labSettings } = useLabSettings();

  // Filter navigation items based on role
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.qaOnly && !isQaOfficer && !isAdmin) return false;
    if (item.supervisorOnly && !isLabSupervisor && !isQaOfficer && !isAdmin) return false;
    return true;
  });

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-dvh min-h-dvh sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="h-24 flex items-center justify-center px-3 border-b border-sidebar-border">
        <img src={appLogo} alt="EnviroLab Logo" className="h-16 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.children && item.children.some(child => location.pathname === child.href));
          
          return (
            <div key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
              
              {/* Children */}
              {item.children && isActive && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      to={child.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                        location.pathname === child.href
                          ? 'text-sidebar-primary bg-sidebar-accent/50'
                          : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                      )}
                    >
                      <child.icon className="w-4 h-4" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-3 py-2 text-xs text-sidebar-foreground/50">
          <p>{labSettings?.lab_short_name || 'Lab'}</p>
          <p>{labSettings?.lab_accreditation || ''}</p>
        </div>
      </div>
    </aside>
  );
}
