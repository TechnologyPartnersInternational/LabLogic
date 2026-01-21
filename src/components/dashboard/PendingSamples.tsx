import { Link } from 'react-router-dom';
import { samples, projects } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Beaker, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PendingSamples() {
  const pendingSamples = samples.filter(s => s.status === 'pending_review' || s.status === 'draft');
  
  const getProject = (projectId: string) => projects.find(p => p.id === projectId);

  const statusStyles = {
    draft: 'status-draft',
    pending_review: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
  };

  const matrixLabels = {
    water: 'Water',
    wastewater: 'Wastewater',
    sediment: 'Sediment',
    soil: 'Soil',
    air: 'Air',
    sludge: 'Sludge',
  };

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
        <table className="data-grid">
          <thead>
            <tr>
              <th>Sample ID</th>
              <th>Project</th>
              <th>Matrix</th>
              <th>Tests</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pendingSamples.slice(0, 10).map((sample) => {
              const project = getProject(sample.projectId);
              
              return (
                <tr key={sample.id}>
                  <td>
                    <Link 
                      to={`/samples/${sample.id}`}
                      className="font-medium text-primary hover:underline flex items-center gap-2"
                    >
                      <Beaker className="w-4 h-4" />
                      {sample.sampleId}
                    </Link>
                    {sample.fieldId && (
                      <span className="text-xs text-muted-foreground block">
                        Field: {sample.fieldId}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-sm">{project?.code}</span>
                  </td>
                  <td>
                    <Badge variant="outline">{matrixLabels[sample.matrix]}</Badge>
                  </td>
                  <td>
                    <span className="text-sm">{sample.assignedTests.length} packages</span>
                  </td>
                  <td>
                    <Badge variant="outline" className={cn('status-badge', statusStyles[sample.status])}>
                      <Clock className="w-3 h-3 mr-1" />
                      {sample.status.replace('_', ' ')}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
