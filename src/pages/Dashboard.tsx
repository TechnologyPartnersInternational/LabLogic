import { 
  FolderKanban, 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Send,
  Package
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { CompletedProjectsList } from '@/components/dashboard/CompletedProjectsList';
import { ValidationAlerts } from '@/components/dashboard/ValidationAlerts';
import { PendingSamples } from '@/components/dashboard/PendingSamples';
import { LabActivityChart } from '@/components/dashboard/LabActivityChart';
import { WorkflowFunnel } from '@/components/dashboard/WorkflowFunnel';
import { TurnaroundMetrics } from '@/components/dashboard/TurnaroundMetrics';
import { SampleStatusSyncManager } from '@/components/reports/SampleStatusSyncManager';
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
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const pendingSamples = samples.filter(s => 
    s.status === 'received' || s.status === 'in_progress'
  ).length;
  const completedSamples = samples.filter(s => s.status === 'completed').length;
  const releasedSamples = samples.filter(s => s.status === 'released').length;
  
  // This week's samples (samples created in the last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const samplesThisWeek = samples.filter(s => 
    new Date(s.created_at) >= oneWeekAgo
  ).length;

  const isLoading = projectsLoading || samplesLoading;

  return (
    <>
      {/* Auto-sync sample statuses when results are approved */}
      <SampleStatusSyncManager />
      
      <div className="space-y-6">
        {/* Primary Stats Grid - Key Workflow Metrics */}
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
                title="Ready for Release"
                value={completedSamples}
                description="Awaiting client release"
                icon={Package}
                variant="success"
              />
              <StatsCard
                title="Pending QA Approval"
                value={pendingApprovals.length}
                description="Results ready for final review"
                icon={CheckCircle2}
                variant="warning"
              />
            </>
          )}
        </div>

        {/* Secondary Stats - Completion & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <StatsCard
                title="Completed Projects"
                value={completedProjects}
                description="Successfully released"
                icon={CheckCircle2}
                variant="success"
              />
              <StatsCard
                title="Released Samples"
                value={releasedSamples}
                description="Delivered to clients"
                icon={Send}
              />
              <StatsCard
                title="Validation Errors"
                value={validationErrors.length}
                description="Require attention"
                icon={AlertTriangle}
                variant={validationErrors.length > 0 ? 'warning' : 'default'}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Projects & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Views - Active and Completed */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <RecentProjects />
              <CompletedProjectsList />
            </div>
            
            {/* Lab Activity Chart */}
            <LabActivityChart />
          </div>

          {/* Right Column - Workflow & Metrics */}
          <div className="space-y-6">
            <WorkflowFunnel />
            <TurnaroundMetrics />
            <ValidationAlerts />
          </div>
        </div>

        {/* Pending Samples Table */}
        <PendingSamples />
      </div>
    </>
  );
}
