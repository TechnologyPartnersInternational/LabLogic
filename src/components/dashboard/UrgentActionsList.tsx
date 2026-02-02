import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Beaker,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

interface UrgentItem {
  id: string;
  type: 'overdue_sample' | 'pending_review' | 'validation_error' | 'qa_approval';
  title: string;
  subtitle: string;
  link: string;
  urgency: 'high' | 'medium' | 'low';
  daysOld?: number;
}

export function UrgentActionsList() {
  const { data: urgentItems = [], isLoading } = useQuery({
    queryKey: ['urgent-actions'],
    queryFn: async () => {
      const items: UrgentItem[] = [];
      const now = new Date();

      // 1. Overdue samples (pending for more than 5 days)
      const { data: overdueSamples } = await supabase
        .from('samples')
        .select(`
          id,
          sample_id,
          created_at,
          project:projects(code)
        `)
        .in('status', ['received', 'in_progress'])
        .order('created_at', { ascending: true })
        .limit(5);

      (overdueSamples || []).forEach((sample: any) => {
        const daysOld = differenceInDays(now, new Date(sample.created_at));
        if (daysOld >= 5) {
          items.push({
            id: `sample-${sample.id}`,
            type: 'overdue_sample',
            title: `Sample ${sample.sample_id} overdue`,
            subtitle: `${sample.project?.code} • ${daysOld} days pending`,
            link: `/results?sample=${sample.id}`,
            urgency: daysOld >= 10 ? 'high' : 'medium',
            daysOld,
          });
        }
      });

      // 2. Results pending review for more than 2 days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const { data: pendingReview } = await supabase
        .from('results')
        .select(`
          id,
          updated_at,
          sample:samples(sample_id, project:projects(code))
        `)
        .eq('status', 'pending_review')
        .lt('updated_at', twoDaysAgo.toISOString())
        .limit(5);

      (pendingReview || []).forEach((result: any) => {
        const daysOld = differenceInDays(now, new Date(result.updated_at));
        items.push({
          id: `review-${result.id}`,
          type: 'pending_review',
          title: `Review pending: ${result.sample?.sample_id}`,
          subtitle: `${result.sample?.project?.code} • Waiting ${daysOld} days`,
          link: `/review`,
          urgency: daysOld >= 5 ? 'high' : 'medium',
          daysOld,
        });
      });

      // 3. Unresolved validation errors
      const { data: validationErrors } = await supabase
        .from('validation_errors')
        .select(`
          id,
          error_code,
          message,
          severity,
          result:results(sample:samples(sample_id))
        `)
        .eq('resolved', false)
        .eq('severity', 'error')
        .limit(3);

      (validationErrors || []).forEach((error: any) => {
        items.push({
          id: `error-${error.id}`,
          type: 'validation_error',
          title: error.error_code,
          subtitle: `${error.result?.sample?.sample_id} • ${error.message.slice(0, 40)}...`,
          link: '/validation',
          urgency: 'high',
        });
      });

      // 4. Results awaiting QA approval
      const { data: qaApprovals, count: qaCount } = await supabase
        .from('results')
        .select('id', { count: 'exact' })
        .eq('status', 'reviewed')
        .limit(1);

      if (qaCount && qaCount > 0) {
        items.push({
          id: 'qa-approvals',
          type: 'qa_approval',
          title: `${qaCount} results awaiting QA approval`,
          subtitle: 'Ready for final review and approval',
          link: '/review',
          urgency: qaCount >= 10 ? 'medium' : 'low',
        });
      }

      // Sort by urgency
      return items.sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }).slice(0, 6);
    }
  });

  const getIcon = (type: UrgentItem['type']) => {
    switch (type) {
      case 'overdue_sample':
        return <Clock className="w-4 h-4" />;
      case 'pending_review':
        return <FileCheck className="w-4 h-4" />;
      case 'validation_error':
        return <AlertCircle className="w-4 h-4" />;
      case 'qa_approval':
        return <Beaker className="w-4 h-4" />;
    }
  };

  const getUrgencyStyles = (urgency: UrgentItem['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'border-l-destructive bg-destructive/5';
      case 'medium':
        return 'border-l-warning bg-warning/5';
      case 'low':
        return 'border-l-info bg-info/5';
    }
  };

  const getUrgencyBadge = (urgency: UrgentItem['urgency']) => {
    switch (urgency) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground text-xs">Action Needed</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }
  };

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h2 className="font-semibold text-foreground">Requires Attention</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {urgentItems.length} items
        </span>
      </div>
      
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : urgentItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Beaker className="w-10 h-10 mx-auto mb-2 text-success" />
            <p className="font-medium text-success">All Caught Up!</p>
            <p className="text-sm">No urgent items requiring attention</p>
          </div>
        ) : (
          urgentItems.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className={cn(
                "block p-4 border-l-4 hover:bg-muted/50 transition-colors",
                getUrgencyStyles(item.urgency)
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  item.urgency === 'high' ? 'bg-destructive/10 text-destructive' :
                  item.urgency === 'medium' ? 'bg-warning/10 text-warning' :
                  'bg-info/10 text-info'
                )}>
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground text-sm truncate">
                      {item.title}
                    </h4>
                    {getUrgencyBadge(item.urgency)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
