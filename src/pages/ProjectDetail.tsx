import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProject, useProjectSamples } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Building2, 
  Beaker,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const statusStyles = {
  active: 'status-pending',
  completed: 'status-approved',
  archived: 'status-draft',
};

const sampleStatusStyles: Record<string, string> = {
  received: 'status-draft',
  in_progress: 'status-pending',
  completed: 'status-approved',
  on_hold: 'status-rejected',
};

const sampleStatusIcons: Record<string, React.ElementType> = {
  received: FileEdit,
  in_progress: Clock,
  completed: CheckCircle,
  on_hold: XCircle,
};

const matrixLabels: Record<string, string> = {
  water: 'Water',
  wastewater: 'Wastewater',
  sediment: 'Sediment',
  soil: 'Soil',
  air: 'Air',
  sludge: 'Sludge',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading, error } = useProject(id || '');
  const { data: samples, isLoading: samplesLoading } = useProjectSamples(id || '');

  if (projectLoading) {
    return (
      <MainLayout title="Loading..." subtitle="">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !project) {
    return (
      <MainLayout title="Project Not Found" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">The requested project could not be found.</p>
          <Button asChild>
            <Link to="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={project.code} 
      subtitle={project.title}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>

        {/* Project Info Card */}
        <div className="lab-section-card">
          <div className="lab-section-header">
            <h2 className="font-semibold text-foreground">Project Details</h2>
            <Badge 
              variant="outline" 
              className={cn('status-badge', statusStyles[project.status as keyof typeof statusStyles])}
            >
              {project.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {project.client?.name || 'N/A'}
                </p>
              </div>
              
              {project.location && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {project.location}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {project.sample_collection_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Sample Collection Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(project.sample_collection_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {project.sample_receipt_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Sample Receipt Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(project.sample_receipt_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Samples</p>
                <p className="font-medium flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-muted-foreground" />
                  {samples?.length || 0}
                </p>
              </div>
              
              {project.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {project.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Samples Table */}
        <div className="lab-section-card">
          <div className="lab-section-header">
            <h2 className="font-semibold text-foreground">
              Project Samples ({samples?.length || 0})
            </h2>
          </div>
          
          {samplesLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : samples && samples.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample ID</TableHead>
                  <TableHead>Field ID</TableHead>
                  <TableHead>Matrix</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Collection Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.map((sample) => {
                  const StatusIcon = sampleStatusIcons[sample.status] || FileEdit;
                  
                  return (
                    <TableRow key={sample.id}>
                      <TableCell>
                        <span className="flex items-center gap-2 font-medium">
                          <Beaker className="w-4 h-4 text-muted-foreground" />
                          {sample.sample_id}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sample.field_id || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {matrixLabels[sample.matrix] || sample.matrix}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sample.location || '-'}
                        {sample.depth && (
                          <span className="block text-xs">{sample.depth}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(sample.collection_date).toLocaleDateString()}
                        {sample.collection_time && (
                          <span className="text-muted-foreground ml-1">
                            {sample.collection_time}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn('status-badge gap-1', sampleStatusStyles[sample.status])}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {sample.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No samples found for this project.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
