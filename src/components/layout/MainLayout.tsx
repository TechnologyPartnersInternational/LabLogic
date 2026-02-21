import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { WelcomeTour } from '@/components/tour/WelcomeTour';

export function MainLayout() {
  const [forceRunTour, setForceRunTour] = useState(false);

  const handleReplayTour = () => {
    setForceRunTour(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <WelcomeTour forceRun={forceRunTour} onFinish={() => setForceRunTour(false)} />
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader onReplayTour={handleReplayTour} />
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
