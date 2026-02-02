import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  FolderKanban, 
  FlaskConical, 
  FileCheck, 
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  link?: string;
  subtext?: string;
}

export function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['quick-dashboard-stats'],
    queryFn: async () => {
      // Parallel fetches for better performance
      const [
        projectsRes,
        samplesRes,
        resultsRes,
        validationRes
      ] = await Promise.all([
        supabase.from('projects').select('status'),
        supabase.from('samples').select('status'),
        supabase.from('results').select('status'),
        supabase.from('validation_errors').select('id').eq('resolved', false)
      ]);

      const projects = projectsRes.data || [];
      const samples = samplesRes.data || [];
      const results = resultsRes.data || [];
      const errors = validationRes.data || [];

      // Calculate statistics
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      
      const pendingSamples = samples.filter(s => 
        s.status === 'received' || s.status === 'in_progress'
      ).length;
      const completedSamples = samples.filter(s => s.status === 'completed').length;
      const releasedSamples = samples.filter(s => s.status === 'released').length;

      const draftResults = results.filter(r => r.status === 'draft').length;
      const pendingReview = results.filter(r => r.status === 'pending_review').length;
      const awaitingQA = results.filter(r => r.status === 'reviewed').length;
      const approvedResults = results.filter(r => r.status === 'approved').length;

      return {
        activeProjects,
        completedProjects,
        pendingSamples,
        completedSamples,
        releasedSamples,
        draftResults,
        pendingReview,
        awaitingQA,
        approvedResults,
        totalResults: results.length,
        validationErrors: errors.length,
      };
    }
  });

  const statItems: StatItem[] = [
    {
      label: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: <FolderKanban className="w-5 h-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/projects',
      subtext: 'In progress'
    },
    {
      label: 'Pending Samples',
      value: stats?.pendingSamples || 0,
      icon: <FlaskConical className="w-5 h-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      link: '/samples',
      subtext: 'Awaiting analysis'
    },
    {
      label: 'Pending Review',
      value: stats?.pendingReview || 0,
      icon: <FileCheck className="w-5 h-5" />,
      color: 'text-info',
      bgColor: 'bg-info/10',
      link: '/review',
      subtext: 'Supervisor review'
    },
    {
      label: 'QA Approval Queue',
      value: stats?.awaitingQA || 0,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/review',
      subtext: 'Ready for QA'
    },
    {
      label: 'Ready to Release',
      value: stats?.completedSamples || 0,
      icon: <Send className="w-5 h-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/reports',
      subtext: 'Client delivery'
    },
    {
      label: 'Validation Errors',
      value: stats?.validationErrors || 0,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: stats?.validationErrors && stats.validationErrors > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: stats?.validationErrors && stats.validationErrors > 0 ? 'bg-destructive/10' : 'bg-muted',
      link: '/validation',
      subtext: 'Require attention'
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat) => {
        const content = (
          <div className={cn(
            "lab-section-card p-4 transition-all",
            stat.link && "hover:shadow-md hover:border-accent/30 cursor-pointer"
          )}>
            <div className="flex items-start justify-between">
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </div>
            <div className="mt-3">
              <p className={cn("text-2xl font-bold", stat.color)}>
                {stat.value}
              </p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {stat.label}
              </p>
              {stat.subtext && (
                <p className="text-xs text-muted-foreground">
                  {stat.subtext}
                </p>
              )}
            </div>
          </div>
        );

        if (stat.link) {
          return (
            <Link key={stat.label} to={stat.link}>
              {content}
            </Link>
          );
        }

        return <div key={stat.label}>{content}</div>;
      })}
    </div>
  );
}
