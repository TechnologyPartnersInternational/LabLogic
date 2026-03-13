import { Link } from 'react-router-dom';
import { matrixLabels } from '@/constants/matrices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, Beaker, Clock, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSamples } from '@/hooks/useSamples';
import { useProjects } from '@/hooks/useProjects';
import { useResultsBySample } from '@/hooks/useResults';
import { Skeleton } from '@/components/ui/skeleton';

export function PendingSamples() {
  const { data: samples = [], isLoading: samplesLoading } = useSamples();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const pendingSamples = samples.filter(s => 
    s.status === 'received' || s.status === 'in_progress'
  );
  
  const getProject = (projectId: string) => projects.find(p => p.id === projectId);

  const statusStyles: Record<string, string> = {
    received: 'status-draft',
    in_progress: 'status-pending',
    completed: 'status-approved',
    disposed: 'status-rejected',
  };

  const { matrixLabels } = await import('@/constants/matrices');

  const isLoading = samplesLoading || projectsLoading;

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <h2 className="font-semibold text-foreground">Pending Samples</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/samples">
            View All <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : pendingSamples.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium">No Pending Samples</p>
            <p className="text-sm">All samples have been processed</p>
          </div>
        ) : (
          <table className="data-grid">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Project</th>
                <th>Matrix</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingSamples.slice(0, 10).map((sample) => {
                const project = getProject(sample.project_id);
                
                return (
                  <PendingSampleRow 
                    key={sample.id}
                    sample={sample}
                    projectCode={project?.code}
                    statusStyles={statusStyles}
                    matrixLabels={matrixLabels}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface PendingSampleRowProps {
  sample: {
    id: string;
    sample_id: string;
    field_id: string | null;
    matrix: string;
    status: string;
  };
  projectCode?: string;
  statusStyles: Record<string, string>;
  matrixLabels: Record<string, string>;
}

function PendingSampleRow({ sample, projectCode, statusStyles, matrixLabels }: PendingSampleRowProps) {
  const { data: results } = useResultsBySample(sample.id);
  
  const totalResults = results?.length || 0;
  const approvedResults = results?.filter(r => r.status === 'approved').length || 0;
  const enteredResults = results?.filter(r => r.entered_value !== null && r.entered_value !== '').length || 0;
  const progressPercent = totalResults > 0 ? Math.round((approvedResults / totalResults) * 100) : 0;

  return (
    <tr>
      <td>
        <Link 
          to={`/results?sample=${sample.id}`}
          className="font-medium text-primary hover:underline flex items-center gap-2"
        >
          <Beaker className="w-4 h-4" />
          {sample.sample_id}
        </Link>
        {sample.field_id && (
          <span className="text-xs text-muted-foreground block">
            Field: {sample.field_id}
          </span>
        )}
      </td>
      <td>
        <span className="font-mono text-sm">{projectCode || 'Unknown'}</span>
      </td>
      <td>
        <Badge variant="outline">{matrixLabels[sample.matrix] || sample.matrix}</Badge>
      </td>
      <td>
        {totalResults > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Progress value={progressPercent} className="w-16 h-2" />
                <span className={cn(
                  'text-xs font-medium',
                  progressPercent === 100 ? 'text-success' : 'text-muted-foreground'
                )}>
                  {progressPercent}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p>Entered: {enteredResults}/{totalResults}</p>
                <p>Approved: {approvedResults}/{totalResults}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td>
        <Badge variant="outline" className={cn('status-badge', statusStyles[sample.status] || 'status-draft')}>
          <Clock className="w-3 h-3 mr-1" />
          {sample.status.replace('_', ' ')}
        </Badge>
      </td>
    </tr>
  );
}
