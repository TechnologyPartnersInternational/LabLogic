import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { FileEdit, Clock, CheckCircle, Award, Send } from 'lucide-react';

interface FunnelStage {
  status: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function WorkflowFunnel() {
  const { data: statusCounts, isLoading } = useQuery({
    queryKey: ['result-status-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select('status');
      
      if (error) throw error;
      
      const counts = {
        draft: 0,
        pending_review: 0,
        reviewed: 0,
        approved: 0,
        rejected: 0,
      };
      
      (data || []).forEach((result) => {
        if (result.status in counts) {
          counts[result.status as keyof typeof counts]++;
        }
      });
      
      return counts;
    }
  });

  const stages: FunnelStage[] = [
    {
      status: 'draft',
      label: 'Draft',
      count: statusCounts?.draft || 0,
      icon: <FileEdit className="w-4 h-4" />,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
    {
      status: 'pending_review',
      label: 'Pending Review',
      count: statusCounts?.pending_review || 0,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      status: 'reviewed',
      label: 'Reviewed',
      count: statusCounts?.reviewed || 0,
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      status: 'approved',
      label: 'Approved',
      count: statusCounts?.approved || 0,
      icon: <Award className="w-4 h-4" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const totalResults = stages.reduce((sum, stage) => sum + stage.count, 0);
  const rejectedCount = statusCounts?.rejected || 0;

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <h2 className="font-semibold text-foreground">Approval Pipeline</h2>
        <span className="text-sm text-muted-foreground">
          {totalResults} total results
        </span>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : totalResults === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No results in the pipeline</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const percentage = totalResults > 0 
                ? Math.round((stage.count / totalResults) * 100) 
                : 0;
              
              return (
                <div key={stage.status} className="relative">
                  {/* Connector line */}
                  {index < stages.length - 1 && (
                    <div className="absolute left-5 top-12 w-0.5 h-3 bg-border" />
                  )}
                  
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    stage.bgColor
                  )}>
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full bg-background border-2",
                      stage.count > 0 ? 'border-current' : 'border-border',
                      stage.color
                    )}>
                      {stage.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn("font-medium", stage.color)}>
                          {stage.label}
                        </span>
                        <span className={cn("text-lg font-semibold", stage.color)}>
                          {stage.count}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            stage.status === 'draft' && 'bg-muted-foreground',
                            stage.status === 'pending_review' && 'bg-warning',
                            stage.status === 'reviewed' && 'bg-info',
                            stage.status === 'approved' && 'bg-success',
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        {percentage}% of pipeline
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Rejected count if any */}
            {rejectedCount > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-destructive">
                    Rejected / Needs Revision
                  </span>
                  <span className="text-lg font-semibold text-destructive">
                    {rejectedCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
