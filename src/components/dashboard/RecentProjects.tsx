import { Link } from 'react-router-dom';
import { projects, clients } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RecentProjects() {
  const getClient = (clientId: string) => clients.find(c => c.id === clientId);

  const statusStyles = {
    active: 'status-pending',
    completed: 'status-approved',
    archived: 'status-draft',
  };

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
        {projects.slice(0, 5).map((project) => {
          const client = getClient(project.clientId);
          
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
                    <Badge variant="outline" className={cn('status-badge', statusStyles[project.status])}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {project.title}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {client?.name}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.sampleReceiptDate).toLocaleDateString()}
                    </span>
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
        })}
      </div>
    </div>
  );
}
