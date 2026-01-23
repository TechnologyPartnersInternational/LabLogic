import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Calendar, MapPin, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function Projects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: projects, isLoading, error } = useProjects();

  const statusStyles: Record<string, string> = {
    active: 'status-pending',
    completed: 'status-approved',
    archived: 'status-draft',
  };

  const filteredProjects = projects?.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (error) {
    return (
      <MainLayout title="Projects" subtitle="Manage laboratory projects and sample batches">
        <div className="p-8 text-center text-destructive">
          Error loading projects. Please try again.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Projects" subtitle="Manage laboratory projects and sample batches">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Button onClick={() => navigate('/projects/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects Table */}
        <div className="lab-section-card">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Receipt Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No projects match your search.' : 'No projects found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Link 
                          to={`/projects/${project.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {project.code}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{project.title}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{project.client?.name || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        {project.location && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {project.location}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.sample_receipt_date && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.sample_receipt_date).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn('status-badge', statusStyles[project.status])}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/projects/${project.id}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
