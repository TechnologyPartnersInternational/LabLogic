import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSamples } from '@/hooks/useSamples';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Beaker, Clock, CheckCircle, XCircle, FileEdit, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { RegisterSamplesDialog } from '@/components/samples/RegisterSamplesDialog';

export default function Samples() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: samples, isLoading, error } = useSamples();

  const statusStyles: Record<string, string> = {
    received: 'status-draft',
    in_progress: 'status-pending',
    completed: 'status-approved',
    on_hold: 'status-rejected',
  };

  const statusIcons: Record<string, React.ElementType> = {
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

  const filteredSamples = samples?.filter(sample => {
    const matchesSearch = 
      sample.sample_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.field_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sample.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const sampleStats = {
    total: samples?.length || 0,
    received: samples?.filter(s => s.status === 'received').length || 0,
    inProgress: samples?.filter(s => s.status === 'in_progress').length || 0,
    completed: samples?.filter(s => s.status === 'completed').length || 0,
  };

  if (error) {
    return (
      <MainLayout title="Samples" subtitle="View and manage all laboratory samples">
        <div className="p-8 text-center text-destructive">
          Error loading samples. Please try again.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Samples" subtitle="View and manage all laboratory samples">
      <div className="space-y-6">
        {/* Header with Register Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by sample ID, field ID, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <RegisterSamplesDialog>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Register Samples
            </Button>
          </RegisterSamplesDialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">Total Samples</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-semibold mt-1">{sampleStats.total}</p>
            )}
          </div>
          <div className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">Received</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-semibold mt-1 text-muted-foreground">
                {sampleStats.received}
              </p>
            )}
          </div>
          <div className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-semibold mt-1 text-warning">
                {sampleStats.inProgress}
              </p>
            )}
          </div>
          <div className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-semibold mt-1 text-success">
                {sampleStats.completed}
              </p>
            )}
          </div>
        </div>

        {/* Samples Table */}
        <div className="lab-section-card">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Matrix</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Collection Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'No samples match your filters.' 
                        : 'No samples found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSamples.map((sample) => {
                    const StatusIcon = statusIcons[sample.status] || FileEdit;
                    
                    return (
                      <TableRow key={sample.id}>
                        <TableCell>
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <Beaker className="w-4 h-4 text-muted-foreground" />
                            {sample.sample_id}
                          </span>
                          {sample.field_id && (
                            <span className="text-xs text-muted-foreground block">
                              Field: {sample.field_id}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link 
                            to={`/projects/${sample.project?.id}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {sample.project?.code || 'Unknown'}
                          </Link>
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
                            className={cn('status-badge gap-1', statusStyles[sample.status])}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {sample.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
