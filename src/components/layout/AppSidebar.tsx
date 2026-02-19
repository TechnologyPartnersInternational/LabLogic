import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, FolderKanban, ClipboardList, Settings,
  Database, FileText, CheckCircle2, Beaker, Microscope, Activity, Users,
  ShieldCheck, Archive, Send, ChevronLeft, ChevronRight, LayoutGrid,
  Package, Gauge, Pill, Wheat, Eye, Fuel, Droplets, Droplet, Flame, Mountain, Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useDepartments } from '@/hooks/useDepartments';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import appLogo from '@/assets/lablogic-logo.png';

const iconMap: Record<string, React.ElementType> = {
  beaker: Beaker, 'flask-conical': FlaskConical, activity: Activity,
  microscope: Microscope, package: Package, gauge: Gauge, pill: Pill,
  wheat: Wheat, eye: Eye, fuel: Fuel, droplets: Droplets, droplet: Droplet,
  flame: Flame, mountain: Mountain, settings: Settings, leaf: Leaf,
};

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin, isQaOfficer, isLabSupervisor } = useAuth();
  const { organization } = useOrganization();
  const { data: departments } = useDepartments();
  const [collapsed, setCollapsed] = useState(false);

  const resultsChildren = (departments || []).map(dept => ({
    name: dept.name, href: `/results/${dept.slug}`, icon: iconMap[dept.icon] || FlaskConical,
  }));

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Samples', href: '/samples', icon: ClipboardList },
    { name: 'Results Entry', href: resultsChildren.length > 0 ? resultsChildren[0].href : '/results', icon: FlaskConical, children: resultsChildren.length > 0 ? resultsChildren : undefined },
    { name: 'Review & Approval', href: '/review', icon: CheckCircle2, supervisorOnly: true },
    { name: 'Validation Dashboard', href: '/validations', icon: ShieldCheck, qaOnly: true },
    { name: 'Reports', href: '/reports', icon: FileText, supervisorOnly: true, children: [
      { name: 'Reports & Release', href: '/reports', icon: Send },
      { name: 'Completed Projects', href: '/completed', icon: Archive },
    ]},
    { name: 'Configuration', href: '/config/parameters', icon: Settings, adminOnly: true, children: [
      { name: 'Departments', href: '/config/departments', icon: LayoutGrid },
      { name: 'Parameter Library', href: '/config/parameters', icon: Database },
      { name: 'Methods Library', href: '/config/methods', icon: FlaskConical },
      { name: 'Validation Rules', href: '/config/validations', icon: ShieldCheck },
    ]},
    { name: 'User Management', href: '/admin/users', icon: Users, adminOnly: true },
  ];

  const filteredNavigation = navigation.filter(item => {
    if ((item as any).adminOnly && !isAdmin) return false;
    if ((item as any).qaOnly && !isQaOfficer && !isAdmin) return false;
    if ((item as any).supervisorOnly && !isLabSupervisor && !isQaOfficer && !isAdmin) return false;
    return true;
  });

  const displayLogo = organization?.logo_url || appLogo;
  const displayName = organization?.name || 'LabLogic';

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col h-dvh min-h-dvh sticky top-0 overflow-y-auto transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo & Collapse Toggle */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border",
          collapsed ? "h-16 justify-center px-2" : "h-20 justify-between px-4"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={displayLogo} alt={displayName} className="h-10 w-10 object-contain rounded flex-shrink-0" />
              <span className="text-sm font-semibold truncate">{displayName}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || (item.children && item.children.some(c => location.pathname === c.href));
            const linkContent = (
              <Link to={item.href} className={cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
            return (
              <div key={item.name}>
                {collapsed ? (
                  <Tooltip><TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">{item.name}</TooltipContent>
                  </Tooltip>
                ) : linkContent}
                {item.children && isActive && !collapsed && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map(child => (
                      <Link key={child.name} to={child.href} className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                        location.pathname === child.href ? 'text-sidebar-primary bg-sidebar-accent/50' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                      )}>
                        <child.icon className="w-4 h-4" />{child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!collapsed && organization?.accreditation && (
          <div className="p-4 border-t border-sidebar-border">
            <p className="px-3 py-2 text-xs text-sidebar-foreground/50">{organization.accreditation}</p>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
