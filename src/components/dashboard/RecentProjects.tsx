import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentProjects() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: clients = [], isLoading: clientsLoading } = useClients();

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);

  const statusStyles: Record<string, string> = {
    active: 'status-pending',
    completed: 'status-approved',
    archived: 'status-draft',
  };

  const isLoading = projectsLoading || clientsLoading;

  // Sort by created_at descending and take first 5
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="lab-section-card">
      <div className="lab-section-header">
        <h2 className="font-semibold text-foreground">Active Projects</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects">
            View All <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No projects yet</p>
            <Button variant="link" asChild className="mt-2">
              <Link to="/projects/new">Create your first project</Link>
            </Button>
          </div>
        ) : (
          recentProjects.map((project) => {
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
                      <Badge variant="outline" className={cn('status-badge', statusStyles[project.status] || 'status-draft')}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {project.title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {client?.name || 'Unknown Client'}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      {project.sample_receipt_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(project.sample_receipt_date).toLocaleDateString()}
                        </span>
                      )}
                      {project.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {project.location}
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
