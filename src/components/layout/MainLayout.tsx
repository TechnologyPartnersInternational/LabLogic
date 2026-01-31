import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface MainLayoutProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function MainLayout({ title, subtitle, children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
