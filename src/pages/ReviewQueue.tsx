import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useSamplesByProject } from '@/hooks/useSamples';
import { MainLayout } from '@/components/layout/MainLayout';
import { ReviewGrid } from '@/components/review/ReviewGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck,
  Loader2,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ResultStatus = Database['public']['Enums']['result_status'];

interface ResultWithDetails {
  id: string;
  sample_id: string;
  entered_value: string | null;
  canonical_value: number | null;
  canonical_unit: string | null;
  is_below_mdl: boolean | null;
  status: ResultStatus;
  analyst_notes: string | null;
  parameter_config: {
    id: string;
    mdl: number;
    canonical_unit: string;
    parameter: {
      id: string;
      name: string;
      abbreviation: string;
      lab_section: string;
    };
  };
}

export default function ReviewQueue() {
  const { user, isLabSupervisor, isQaOfficer, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending_review' | 'reviewed'>('pending_review');

  const { data: projects } = useProjects();
  const { data: samples } = useSamplesByProject(selectedProjectId);

  // Determine which status to fetch based on role
  const targetStatus = isQaOfficer && !isLabSupervisor ? 'reviewed' : activeTab;

  // Fetch results for the selected project
  const { data: results, isLoading } = useQuery({
    queryKey: ['review-queue', selectedProjectId, targetStatus],
    queryFn: async () => {
      if (!selectedProjectId) return [];

      // Get sample IDs for this project
      const { data: projectSamples, error: samplesError } = await supabase
        .from('samples')
        .select('id')
        .eq('project_id', selectedProjectId);

      if (samplesError) throw samplesError;
      if (!projectSamples || projectSamples.length === 0) return [];

      const sampleIds = projectSamples.map(s => s.id);

      const { data, error } = await supabase
        .from('results')
        .select(`
          id,
          sample_id,
          entered_value,
          canonical_value,
          canonical_unit,
          is_below_mdl,
          status,
          analyst_notes,
          parameter_config:parameter_configs(
            id,
            mdl,
            canonical_unit,
            parameter:parameters(id, name, abbreviation, lab_section)
          )
        `)
        .in('sample_id', sampleIds)
        .eq('status', targetStatus)
        .order('sample_id');

      if (error) throw error;
      return data as unknown as ResultWithDetails[];
    },
    enabled: !!selectedProjectId,
  });

  // Count results by status for badges
  const statusCounts = useMemo(() => {
    if (!results) return { pending_review: 0, reviewed: 0 };
    return {
      pending_review: results.filter(r => r.status === 'pending_review').length,
      reviewed: results.filter(r => r.status === 'reviewed').length,
    };
  }, [results]);

  const approveMutation = useMutation({
    mutationFn: async ({ resultId, notes }: { resultId: string; notes: string }) => {
      const newStatus: ResultStatus = isLabSupervisor ? 'reviewed' : 'approved';
      
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      if (isLabSupervisor) {
        updateData.reviewed_by = user?.id;
        updateData.reviewed_at = new Date().toISOString();
        updateData.review_notes = notes;
      } else {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
        updateData.approval_notes = notes;
      }

      const { error } = await supabase
        .from('results')
        .update(updateData)
        .eq('id', resultId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['sample-progress'] });
      queryClient.invalidateQueries({ queryKey: ['project-samples-progress'] });
      toast.success(isLabSupervisor ? 'Result reviewed' : 'Result approved');
    },
    onError: (error) => {
      toast.error('Failed to process result: ' + error.message);
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (resultIds: string[]) => {
      const newStatus: ResultStatus = isLabSupervisor ? 'reviewed' : 'approved';
      
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      if (isLabSupervisor) {
        updateData.reviewed_by = user?.id;
        updateData.reviewed_at = new Date().toISOString();
      } else {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('results')
        .update(updateData)
        .in('id', resultIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['sample-progress'] });
      queryClient.invalidateQueries({ queryKey: ['project-samples-progress'] });
      toast.success(`${variables.length} results ${isLabSupervisor ? 'reviewed' : 'approved'}`);
    },
    onError: (error) => {
      toast.error('Failed to process results: ' + error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ resultId, reason }: { resultId: string; reason: string }) => {
      const { error } = await supabase
        .from('results')
        .update({
          status: 'draft' as ResultStatus,
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', resultId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast.success('Result sent back to analyst with comment');
    },
    onError: (error) => {
      toast.error('Failed to reject result: ' + error.message);
    },
  });

  const handleApprove = async (resultId: string, notes: string) => {
    await approveMutation.mutateAsync({ resultId, notes });
  };

  const handleReject = async (resultId: string, reason: string) => {
    await rejectMutation.mutateAsync({ resultId, reason });
  };

  const handleBulkApprove = async (resultIds: string[]) => {
    await bulkApproveMutation.mutateAsync(resultIds);
  };

  return (
    <MainLayout title="Review & Approval" subtitle="Review and validate analyst entries">
      <div className="space-y-6">
        {/* Project Filter */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">Project:</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="Select a project to review" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.code} - {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProjectId && results && results.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <FileCheck className="w-3 h-3" />
              {results.length} results pending
            </Badge>
          )}
        </div>

        {/* Role-based tabs */}
        {isLabSupervisor && selectedProjectId && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="pending_review" className="gap-2">
                Pending Review
              </TabsTrigger>
              <TabsTrigger value="reviewed" className="gap-2">
                Reviewed (QA Pending)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Review Grid */}
        {!selectedProjectId ? (
          <div className="lab-section-card p-12 text-center text-muted-foreground">
            <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a project to begin review</p>
            <p className="text-sm">Choose a project from the dropdown above to view results pending review</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ReviewGrid
            samples={samples || []}
            results={results || []}
            isLoading={isLoading}
            onApprove={handleApprove}
            onReject={handleReject}
            onBulkApprove={handleBulkApprove}
            isPending={approveMutation.isPending || bulkApproveMutation.isPending || rejectMutation.isPending}
          />
        )}
      </div>
    </MainLayout>
  );
}
