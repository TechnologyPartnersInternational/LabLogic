import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Beaker, Clock, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSamples } from '@/hooks/useSamples';
import { useProjects } from '@/hooks/useProjects';
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

  const matrixLabels: Record<string, string> = {
    water: 'Water',
    wastewater: 'Wastewater',
    sediment: 'Sediment',
    soil: 'Soil',
    air: 'Air',
    sludge: 'Sludge',
  };

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
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingSamples.slice(0, 10).map((sample) => {
                const project = getProject(sample.project_id);
                
                return (
                  <tr key={sample.id}>
                    <td>
                      <Link 
                        to={`/samples/${sample.id}`}
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
                      <span className="font-mono text-sm">{project?.code || 'Unknown'}</span>
                    </td>
                    <td>
                      <Badge variant="outline">{matrixLabels[sample.matrix] || sample.matrix}</Badge>
                    </td>
                    <td>
                      <span className="text-sm text-muted-foreground">
                        {sample.location || '-'}
                      </span>
                    </td>
                    <td>
                      <Badge variant="outline" className={cn('status-badge', statusStyles[sample.status] || 'status-draft')}>
                        <Clock className="w-3 h-3 mr-1" />
                        {sample.status.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
