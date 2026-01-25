import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, differenceInHours } from 'date-fns';

export function TurnaroundMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['turnaround-metrics'],
    queryFn: async () => {
      // Get completed samples with their dates
      const { data: samples, error } = await supabase
        .from('samples')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          project:projects!inner(
            sample_receipt_date,
            results_issued_date
          )
        `)
        .eq('status', 'completed');

      if (error) throw error;

      // Calculate average turnaround time
      let totalDays = 0;
      let sampleCount = 0;
      
      (samples || []).forEach((sample: any) => {
        const startDate = sample.project?.sample_receipt_date 
          ? new Date(sample.project.sample_receipt_date)
          : new Date(sample.created_at);
        const endDate = new Date(sample.updated_at);
        
        const days = differenceInDays(endDate, startDate);
        if (days >= 0 && days < 365) { // Sanity check
          totalDays += days;
          sampleCount++;
        }
      });

      const avgTurnaround = sampleCount > 0 ? Math.round(totalDays / sampleCount) : 0;

      // Get samples in progress to calculate pending time
      const { data: pendingSamples } = await supabase
        .from('samples')
        .select('created_at')
        .in('status', ['received', 'in_progress']);

      let avgPendingDays = 0;
      if (pendingSamples && pendingSamples.length > 0) {
        const now = new Date();
        const totalPendingDays = pendingSamples.reduce((sum, s) => {
          return sum + differenceInDays(now, new Date(s.created_at));
        }, 0);
        avgPendingDays = Math.round(totalPendingDays / pendingSamples.length);
      }

      // Get released projects this month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const { data: releasedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('status', 'completed')
        .gte('results_issued_date', oneMonthAgo.toISOString().split('T')[0]);

      return {
        avgTurnaround,
        samplesCompleted: sampleCount,
        avgPendingDays,
        pendingSampleCount: pendingSamples?.length || 0,
        releasedThisMonth: releasedProjects?.length || 0,
      };
    }
  });

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">Turnaround Metrics</h2>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : (
          <>
            {/* Average Turnaround Time */}
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg. Turnaround Time
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-accent">
                      {metrics?.avgTurnaround || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Based on {metrics?.samplesCompleted || 0} completed samples
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
              </div>
            </div>

            {/* Pending Samples Age */}
            <div className={cn(
              "p-4 rounded-lg border",
              metrics?.avgPendingDays && metrics.avgPendingDays > 7 
                ? "bg-warning/5 border-warning/20" 
                : "bg-muted/50 border-border"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg. Pending Age
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={cn(
                      "text-3xl font-bold",
                      metrics?.avgPendingDays && metrics.avgPendingDays > 7 
                        ? "text-warning" 
                        : "text-foreground"
                    )}>
                      {metrics?.avgPendingDays || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {metrics?.pendingSampleCount || 0} samples awaiting completion
                  </p>
                </div>
                <div className={cn(
                  "p-2 rounded-lg",
                  metrics?.avgPendingDays && metrics.avgPendingDays > 7 
                    ? "bg-warning/10" 
                    : "bg-muted"
                )}>
                  {metrics?.avgPendingDays && metrics.avgPendingDays > 7 ? (
                    <TrendingDown className="w-5 h-5 text-warning" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Released This Month */}
            <div className="p-4 rounded-lg bg-success/5 border border-success/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Released This Month
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-success">
                      {metrics?.releasedThisMonth || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">projects</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
