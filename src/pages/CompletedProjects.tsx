import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { COAExportDialog } from '@/components/reports/COAExportDialog';
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
  Search,
  Archive,
  Loader2,
  Calendar,
  Building2,
  Eye,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';

export default function CompletedProjects() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch completed/released projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['completed-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, code, title, status, location,
          sample_collection_date, sample_receipt_date, results_issued_date,
          client:clients(name)
        `)
        .eq('status', 'completed')
        .order('results_issued_date', { ascending: false });

      if (error) throw error;

      // Get sample counts for each project
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project) => {
          const { count } = await supabase
            .from('samples')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          return {
            ...project,
            sampleCount: count || 0,
          };
        })
      );

      return projectsWithCounts;
    },
  });

  const filteredProjects = projects?.filter(p =>
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.client as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout 
      title="Completed Projects" 
      subtitle="Archive of released projects and final reports"
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="lab-section-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Archive className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projects?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Completed & Released Projects</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search completed projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Projects Table */}
        <div className="lab-section-card">
          <div className="lab-section-header">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Released Projects
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
                  <TableHead>Released Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link 
                        to={`/projects/${project.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {project.code}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{project.title}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        {(project.client as any)?.name || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>{project.sampleCount}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {project.results_issued_date 
                          ? new Date(project.results_issued_date).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/projects/${project.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <COAExportDialog
                          projectId={project.id}
                          projectCode={project.code}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No completed projects</p>
              <p className="text-sm">
                Projects will appear here after they have been released to clients
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
