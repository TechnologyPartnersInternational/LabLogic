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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import tpiLogo from '@/assets/tpi-logo.png';

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
  { name: 'Review & Approval', href: '/review', icon: CheckCircle2 },
  { name: 'Reports', href: '/reports', icon: FileText },
  {
    name: 'Configuration',
    href: '/config/parameters',
    icon: Settings,
    children: [
      { name: 'Parameter Library', href: '/config/parameters', icon: Database },
      { name: 'Methods Library', href: '/config/methods', icon: FlaskConical },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      {/* Logo */}
      <div className="h-20 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={tpiLogo} alt="TPI Logo" className="h-10 w-auto" />
          <div>
            <h1 className="font-semibold text-white text-lg tracking-tight">LabFlow</h1>
            <p className="text-xs text-sidebar-foreground/60">by TPI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
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
          <p>Technology Partners Int'l</p>
          <p>ISO 17025:2017 Accredited</p>
        </div>
      </div>
    </aside>
  );
}
