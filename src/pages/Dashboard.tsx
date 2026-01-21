import { 
  FolderKanban, 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { ValidationAlerts } from '@/components/dashboard/ValidationAlerts';
import { PendingSamples } from '@/components/dashboard/PendingSamples';
import { LabActivityChart } from '@/components/dashboard/LabActivityChart';
import { dashboardStats } from '@/data/mockData';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Dashboard() {
  return (
    <MainLayout title="Dashboard" subtitle="Laboratory Information Management System">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Projects"
            value={dashboardStats.activeProjects}
            description="Currently in progress"
            icon={FolderKanban}
            variant="accent"
          />
          <StatsCard
            title="Pending Samples"
            value={dashboardStats.pendingSamples}
            description="Awaiting analysis"
            icon={FlaskConical}
            variant="default"
          />
          <StatsCard
            title="Validation Errors"
            value={dashboardStats.validationErrors}
            description="Require attention"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="Pending Approvals"
            value={dashboardStats.pendingApprovals}
            description="Ready for QA review"
            icon={CheckCircle2}
            variant="success"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatsCard
            title="Samples This Week"
            value={dashboardStats.samplesThisWeek}
            icon={TrendingUp}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Completed This Month"
            value={dashboardStats.completedThisMonth}
            icon={Calendar}
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Projects & Activity */}
          <div className="lg:col-span-2 space-y-6">
            <RecentProjects />
            <LabActivityChart />
          </div>

          {/* Right Column - Alerts */}
          <div className="space-y-6">
            <ValidationAlerts />
          </div>
        </div>

        {/* Pending Samples Table */}
        <PendingSamples />
      </div>
    </MainLayout>
  );
}
