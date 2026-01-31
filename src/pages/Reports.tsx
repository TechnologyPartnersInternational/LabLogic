import { useState } from 'react';

import { useReleasableProjects } from '@/hooks/useReportData';
import { COAExportDialog } from '@/components/reports/COAExportDialog';
import { ReleaseProjectDialog } from '@/components/reports/ReleaseProjectDialog';
import { SampleStatusSyncManager } from '@/components/reports/SampleStatusSyncManager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  CheckCircle,
  Clock,
  Send,
  Archive,
  Loader2,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'pending'>('all');
  const { data: projects, isLoading } = useReleasableProjects();

  // Filter projects based on tab and search
  const filteredProjects = projects?.filter(p => {
    const matchesSearch = 
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.client as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ready') {
      return matchesSearch && p.isReadyForRelease && !p.isFullyReleased;
    }
    if (statusFilter === 'pending') {
      return matchesSearch && !p.isReadyForRelease && !p.isFullyReleased;
    }
    return matchesSearch && !p.isFullyReleased;
  });

  const readyCount = projects?.filter(p => p.isReadyForRelease && !p.isFullyReleased).length || 0;
  const pendingCount = projects?.filter(p => !p.isReadyForRelease && !p.isFullyReleased).length || 0;

  return (
    <>
      {/* Auto-sync sample statuses when results are approved */}
      <SampleStatusSyncManager />
      
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="lab-section-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{readyCount}</p>
                <p className="text-sm text-muted-foreground">Ready for Release</p>
              </div>
            </div>
          </div>

          <div className="lab-section-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </div>

          <div className="lab-section-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Active</SelectItem>
              <SelectItem value="ready">Ready for Release</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Table */}
        <div className="lab-section-card">
          <div className="lab-section-header">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <FolderKanban className="w-5 h-5" />
              Projects
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.code}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{project.title}</TableCell>
                    <TableCell>{(project.client as any)?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {project.completedSamples}/{project.totalSamples} completed
                      </span>
                    </TableCell>
                    <TableCell>
                      {project.isReadyForRelease ? (
                        <Badge className="gap-1 bg-emerald-500">
                          <CheckCircle className="w-3 h-3" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <COAExportDialog
                          projectId={project.id}
                          projectCode={project.code}
                        />
                        <ReleaseProjectDialog
                          projectId={project.id}
                          projectCode={project.code}
                          isReadyForRelease={project.isReadyForRelease}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No projects found</p>
              <p className="text-sm">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Projects with approved results will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
