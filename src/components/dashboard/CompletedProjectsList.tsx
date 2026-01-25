import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export function CompletedProjectsList() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: clients = [], isLoading: clientsLoading } = useClients();

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);

  const isLoading = projectsLoading || clientsLoading;

  // Get recently completed projects (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const completedProjects = projects
    .filter(p => p.status === 'completed')
    .filter(p => new Date(p.updated_at) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <h2 className="font-semibold text-foreground">Recently Completed</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/completed">
            View All <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : completedProjects.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No completed projects in the last 30 days</p>
          </div>
        ) : (
          completedProjects.map((project) => {
            const client = getClient(project.client_id);
            
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">
                        {project.code}
                      </h3>
                      <Badge variant="outline" className="status-badge status-approved">
                        completed
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {project.title}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{client?.name || 'Unknown Client'}</span>
                      {project.results_issued_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Released {formatDistanceToNow(new Date(project.results_issued_date), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
