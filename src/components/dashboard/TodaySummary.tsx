import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  CheckCircle2, 
  FileEdit,
  Send,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';

export function TodaySummary() {
  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['today-summary'],
    queryFn: async () => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Get today's activities in parallel
      const [
        samplesReceived,
        resultsEntered,
        resultsApproved,
        projectsCreated
      ] = await Promise.all([
        supabase
          .from('samples')
          .select('id', { count: 'exact' })
          .gte('created_at', startOfToday)
          .lte('created_at', endOfToday),
        supabase
          .from('results')
          .select('id', { count: 'exact' })
          .gte('entered_at', startOfToday)
          .lte('entered_at', endOfToday)
          .not('entered_at', 'is', null),
        supabase
          .from('results')
          .select('id', { count: 'exact' })
          .gte('approved_at', startOfToday)
          .lte('approved_at', endOfToday)
          .not('approved_at', 'is', null),
        supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .gte('created_at', startOfToday)
          .lte('created_at', endOfToday),
      ]);

      return {
        samplesReceived: samplesReceived.count || 0,
        resultsEntered: resultsEntered.count || 0,
        resultsApproved: resultsApproved.count || 0,
        projectsCreated: projectsCreated.count || 0,
      };
    }
  });

  const summaryItems = [
    {
      label: 'Samples Received',
      value: todayStats?.samplesReceived || 0,
      icon: <Send className="w-4 h-4" />,
      color: 'text-accent',
    },
    {
      label: 'Results Entered',
      value: todayStats?.resultsEntered || 0,
      icon: <FileEdit className="w-4 h-4" />,
      color: 'text-info',
    },
    {
      label: 'Results Approved',
      value: todayStats?.resultsApproved || 0,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-success',
    },
    {
      label: 'Projects Created',
      value: todayStats?.projectsCreated || 0,
      icon: <Users className="w-4 h-4" />,
      color: 'text-primary',
    },
  ];

  const hasActivity = summaryItems.some(item => item.value > 0);

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">Today's Activity</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : !hasActivity ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No activity recorded yet today</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {summaryItems.map((item) => (
              <div key={item.label} className="text-center">
                <div className={cn(
                  "inline-flex items-center justify-center w-10 h-10 rounded-full mb-2",
                  item.value > 0 ? 'bg-accent/10' : 'bg-muted'
                )}>
                  <span className={item.value > 0 ? item.color : 'text-muted-foreground'}>
                    {item.icon}
                  </span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  item.value > 0 ? item.color : 'text-muted-foreground'
                )}>
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
