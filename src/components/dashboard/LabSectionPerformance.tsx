import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { FlaskConical, Cpu, Bug, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabSectionStats {
  section: 'wet_chemistry' | 'instrumentation' | 'microbiology';
  label: string;
  icon: React.ReactNode;
  totalResults: number;
  approvedResults: number;
  pendingResults: number;
  rejectedResults: number;
  approvalRate: number;
  avgTurnaround: number;
}

export function LabSectionPerformance() {
  const { data: sectionStats = [], isLoading } = useQuery({
    queryKey: ['lab-section-performance'],
    queryFn: async () => {
      // Get results with their lab sections
      const { data: results, error } = await supabase
        .from('results')
        .select(`
          id,
          status,
          created_at,
          approved_at,
          parameter_config:parameter_configs!inner(
            parameter:parameters!inner(
              lab_section
            )
          )
        `);

      if (error) throw error;

      const sections: Record<string, { 
        total: number; 
        approved: number; 
        pending: number; 
        rejected: number;
        turnaroundDays: number[];
      }> = {
        wet_chemistry: { total: 0, approved: 0, pending: 0, rejected: 0, turnaroundDays: [] },
        instrumentation: { total: 0, approved: 0, pending: 0, rejected: 0, turnaroundDays: [] },
        microbiology: { total: 0, approved: 0, pending: 0, rejected: 0, turnaroundDays: [] },
      };

      (results || []).forEach((result: any) => {
        const section = result.parameter_config?.parameter?.lab_section;
        if (section && sections[section]) {
          sections[section].total++;
          
          if (result.status === 'approved') {
            sections[section].approved++;
            // Calculate turnaround
            if (result.approved_at && result.created_at) {
              const days = Math.ceil(
                (new Date(result.approved_at).getTime() - new Date(result.created_at).getTime()) 
                / (1000 * 60 * 60 * 24)
              );
              if (days >= 0 && days < 30) {
                sections[section].turnaroundDays.push(days);
              }
            }
          } else if (result.status === 'rejected' || result.status === 'revision_required') {
            sections[section].rejected++;
          } else if (result.status === 'pending_review' || result.status === 'reviewed') {
            sections[section].pending++;
          }
        }
      });

      const stats: LabSectionStats[] = [
        {
          section: 'wet_chemistry',
          label: 'Wet Chemistry',
          icon: <FlaskConical className="w-5 h-5" />,
          totalResults: sections.wet_chemistry.total,
          approvedResults: sections.wet_chemistry.approved,
          pendingResults: sections.wet_chemistry.pending,
          rejectedResults: sections.wet_chemistry.rejected,
          approvalRate: sections.wet_chemistry.total > 0 
            ? Math.round((sections.wet_chemistry.approved / sections.wet_chemistry.total) * 100)
            : 0,
          avgTurnaround: sections.wet_chemistry.turnaroundDays.length > 0
            ? Math.round(sections.wet_chemistry.turnaroundDays.reduce((a, b) => a + b, 0) / sections.wet_chemistry.turnaroundDays.length)
            : 0,
        },
        {
          section: 'instrumentation',
          label: 'Instrumentation',
          icon: <Cpu className="w-5 h-5" />,
          totalResults: sections.instrumentation.total,
          approvedResults: sections.instrumentation.approved,
          pendingResults: sections.instrumentation.pending,
          rejectedResults: sections.instrumentation.rejected,
          approvalRate: sections.instrumentation.total > 0 
            ? Math.round((sections.instrumentation.approved / sections.instrumentation.total) * 100)
            : 0,
          avgTurnaround: sections.instrumentation.turnaroundDays.length > 0
            ? Math.round(sections.instrumentation.turnaroundDays.reduce((a, b) => a + b, 0) / sections.instrumentation.turnaroundDays.length)
            : 0,
        },
        {
          section: 'microbiology',
          label: 'Microbiology',
          icon: <Bug className="w-5 h-5" />,
          totalResults: sections.microbiology.total,
          approvedResults: sections.microbiology.approved,
          pendingResults: sections.microbiology.pending,
          rejectedResults: sections.microbiology.rejected,
          approvalRate: sections.microbiology.total > 0 
            ? Math.round((sections.microbiology.approved / sections.microbiology.total) * 100)
            : 0,
          avgTurnaround: sections.microbiology.turnaroundDays.length > 0
            ? Math.round(sections.microbiology.turnaroundDays.reduce((a, b) => a + b, 0) / sections.microbiology.turnaroundDays.length)
            : 0,
        },
      ];

      return stats;
    }
  });

  const getTrendIcon = (rate: number) => {
    if (rate >= 90) return <TrendingUp className="w-4 h-4 text-success" />;
    if (rate >= 70) return <Minus className="w-4 h-4 text-warning" />;
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <h2 className="font-semibold text-foreground">Lab Section Performance</h2>
        <span className="text-sm text-muted-foreground">Approval rates & throughput</span>
      </div>
      
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : sectionStats.every(s => s.totalResults === 0) ? (
          <div className="py-8 text-center text-muted-foreground">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No results data available yet</p>
          </div>
        ) : (
          sectionStats.map((section) => (
            <div 
              key={section.section}
              className="p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{section.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {section.totalResults} total results
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(section.approvalRate)}
                  <span className={cn(
                    "text-lg font-bold",
                    section.approvalRate >= 90 ? 'text-success' :
                    section.approvalRate >= 70 ? 'text-warning' :
                    'text-destructive'
                  )}>
                    {section.approvalRate}%
                  </span>
                </div>
              </div>

              {/* Progress bar showing breakdown */}
              <div className="space-y-2">
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  {section.totalResults > 0 && (
                    <>
                      <div 
                        className="bg-success transition-all"
                        style={{ width: `${(section.approvedResults / section.totalResults) * 100}%` }}
                      />
                      <div 
                        className="bg-warning transition-all"
                        style={{ width: `${(section.pendingResults / section.totalResults) * 100}%` }}
                      />
                      <div 
                        className="bg-destructive transition-all"
                        style={{ width: `${(section.rejectedResults / section.totalResults) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      {section.approvedResults} approved
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      {section.pendingResults} pending
                    </span>
                    {section.rejectedResults > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        {section.rejectedResults} rejected
                      </span>
                    )}
                  </div>
                  {section.avgTurnaround > 0 && (
                    <span className="text-muted-foreground">
                      Avg. {section.avgTurnaround}d turnaround
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
