import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { samples, projects, testPackages } from '@/data/mockData';
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
import { Search, Filter, Beaker, Clock, CheckCircle, XCircle, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Samples() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getProject = (projectId: string) => projects.find(p => p.id === projectId);
  const getTestPackage = (pkgId: string) => testPackages.find(t => t.id === pkgId);

  const statusStyles = {
    draft: 'status-draft',
    pending_review: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
  };

  const statusIcons = {
    draft: FileEdit,
    pending_review: Clock,
    approved: CheckCircle,
    rejected: XCircle,
  };

  const matrixLabels = {
    water: 'Water',
    wastewater: 'Wastewater',
    sediment: 'Sediment',
    soil: 'Soil',
    air: 'Air',
    sludge: 'Sludge',
  };

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = 
      sample.sampleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.fieldId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sample.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout title="Samples" subtitle="View and manage all laboratory samples">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by sample ID..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">Total Samples</p>
            <p className="text-2xl font-semibold mt-1">{samples.length}</p>
          </div>
          <div className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-semibold mt-1 text-warning">
              {samples.filter(s => s.status === 'pending_review').length}
            </p>
          </div>
          <div className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-semibold mt-1 text-success">
              {samples.filter(s => s.status === 'approved').length}
            </p>
          </div>
          <div className="lab-section-card p-4">
            <p className="text-sm text-muted-foreground">Draft</p>
            <p className="text-2xl font-semibold mt-1 text-muted-foreground">
              {samples.filter(s => s.status === 'draft').length}
            </p>
          </div>
        </div>

        {/* Samples Table */}
        <div className="lab-section-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Matrix</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Collection Date</TableHead>
                <TableHead>Test Packages</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSamples.map((sample) => {
                const project = getProject(sample.projectId);
                const StatusIcon = statusIcons[sample.status];
                
                return (
                  <TableRow key={sample.id}>
                    <TableCell>
                      <Link 
                        to={`/samples/${sample.id}`}
                        className="flex items-center gap-2 font-medium text-primary hover:underline"
                      >
                        <Beaker className="w-4 h-4" />
                        {sample.sampleId}
                      </Link>
                      {sample.fieldId && (
                        <span className="text-xs text-muted-foreground block">
                          Field: {sample.fieldId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/projects/${project?.id}`}
                        className="font-mono text-sm hover:underline"
                      >
                        {project?.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{matrixLabels[sample.matrix]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sample.location}
                      {sample.depth && (
                        <span className="block text-xs">{sample.depth}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(sample.collectionDate).toLocaleDateString()}
                      {sample.collectionTime && (
                        <span className="text-muted-foreground ml-1">
                          {sample.collectionTime}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sample.assignedTests.slice(0, 2).map(pkgId => {
                          const pkg = getTestPackage(pkgId);
                          return (
                            <Badge key={pkgId} variant="secondary" className="text-xs">
                              {pkg?.name.replace(' Panel', '').replace('Physico-Chemical ', '')}
                            </Badge>
                          );
                        })}
                        {sample.assignedTests.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{sample.assignedTests.length - 2}
                          </Badge>
                        )}
                      </div>
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
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
