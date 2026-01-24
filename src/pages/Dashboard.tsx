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
import { MainLayout } from '@/components/layout/MainLayout';
import { useProjects } from '@/hooks/useProjects';
import { useSamples } from '@/hooks/useSamples';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: samples = [], isLoading: samplesLoading } = useSamples();
  
  // Fetch validation errors count
  const { data: validationErrors = [] } = useQuery({
    queryKey: ['validation-errors-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('validation_errors')
        .select('id')
        .eq('resolved', false);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch pending approvals (results in 'reviewed' status ready for QA)
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select('id')
        .eq('status', 'reviewed');
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const pendingSamples = samples.filter(s => 
    s.status === 'received' || s.status === 'in_progress'
  ).length;
  
  // This week's samples (samples created in the last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const samplesThisWeek = samples.filter(s => 
    new Date(s.created_at) >= oneWeekAgo
  ).length;

  // This month's completed samples
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const completedThisMonth = samples.filter(s => 
    s.status === 'completed' && new Date(s.updated_at) >= oneMonthAgo
  ).length;

  const isLoading = projectsLoading || samplesLoading;

  return (
    <MainLayout title="Dashboard" subtitle="Laboratory Information Management System">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Active Projects"
                value={activeProjects}
                description="Currently in progress"
                icon={FolderKanban}
                variant="accent"
              />
              <StatsCard
                title="Pending Samples"
                value={pendingSamples}
                description="Awaiting analysis"
                icon={FlaskConical}
                variant="default"
              />
              <StatsCard
                title="Validation Errors"
                value={validationErrors.length}
                description="Require attention"
                icon={AlertTriangle}
                variant="warning"
              />
              <StatsCard
                title="Pending Approvals"
                value={pendingApprovals.length}
                description="Ready for QA review"
                icon={CheckCircle2}
                variant="success"
              />
            </>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <StatsCard
                title="Samples This Week"
                value={samplesThisWeek}
                icon={TrendingUp}
              />
              <StatsCard
                title="Completed This Month"
                value={completedThisMonth}
                icon={Calendar}
              />
            </>
          )}
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
