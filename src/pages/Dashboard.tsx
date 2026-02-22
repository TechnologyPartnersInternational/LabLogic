import { QuickStats } from '@/components/dashboard/QuickStats';
import { TodaySummary } from '@/components/dashboard/TodaySummary';
import { UrgentActionsList } from '@/components/dashboard/UrgentActionsList';
import { LabSectionPerformance } from '@/components/dashboard/LabSectionPerformance';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { WorkflowFunnel } from '@/components/dashboard/WorkflowFunnel';
import { TurnaroundMetrics } from '@/components/dashboard/TurnaroundMetrics';
import { LabActivityChart } from '@/components/dashboard/LabActivityChart';
import { PendingSamples } from '@/components/dashboard/PendingSamples';
import { SampleStatusSyncManager } from '@/components/reports/SampleStatusSyncManager';
import { CompletedProjectsList } from '@/components/dashboard/CompletedProjectsList';
import { ValidationAlerts } from '@/components/dashboard/ValidationAlerts';

export default function Dashboard() {
  return (
    <>
      {/* Auto-sync sample statuses when results are approved */}
      <SampleStatusSyncManager />
      
      <div className="space-y-6">
        {/* Quick Stats Bar - Overview of key workflow stages */}
        <QuickStats />

        {/* Today's Activity Summary */}
        <TodaySummary />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Urgent Actions & Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Urgent Items Requiring Attention */}
            <UrgentActionsList />
            
            {/* Lab Activity Chart */}
            <LabActivityChart />
            
            {/* Active Projects */}
            <RecentProjects />

            {/* Recently Completed Projects */}
            <CompletedProjectsList />
          </div>

          {/* Right Column - Performance & Metrics */}
          <div className="space-y-6">
            {/* Validation Alerts */}
            <ValidationAlerts />

            {/* Lab Section Performance */}
            <LabSectionPerformance />
            
            {/* Approval Pipeline */}
            <WorkflowFunnel />
            
            {/* Turnaround Metrics */}
            <TurnaroundMetrics />
          </div>
        </div>

        {/* Pending Samples Table - Full Width */}
        <PendingSamples />
      </div>
    </>
  );
}
