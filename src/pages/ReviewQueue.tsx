import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useSamplesByProject } from '@/hooks/useSamples';

import { ReviewGrid } from '@/components/review/ReviewGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileCheck,
  Loader2,
  Filter,
  CheckCircle,
  XCircle,
  MessageSquare
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
  const [comments, setComments] = useState<Map<string, string>>(new Map());
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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

  // Clear comments when project changes
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setComments(new Map());
  };

  const handleCommentChange = (resultId: string, comment: string) => {
    setComments(prev => {
      const next = new Map(prev);
      if (comment.trim()) {
        next.set(resultId, comment);
      } else {
        next.delete(resultId);
      }
      return next;
    });
  };

  // Get comment count
  const commentCount = useMemo(() => {
    return Array.from(comments.values()).filter(c => c.trim()).length;
  }, [comments]);

  // Build comments summary for rejection
  const buildCommentsSummary = () => {
    const commentsList: string[] = [];
    comments.forEach((comment, resultId) => {
      if (comment.trim()) {
        const result = results?.find(r => r.id === resultId);
        if (result) {
          const sampleId = samples?.find(s => s.id === result.sample_id)?.sample_id || 'Unknown';
          const paramName = result.parameter_config?.parameter?.abbreviation || 'Unknown';
          commentsList.push(`• ${sampleId} / ${paramName}: ${comment}`);
        }
      }
    });
    return commentsList.join('\n');
  };

  const approveAllMutation = useMutation({
    mutationFn: async () => {
      if (!results || results.length === 0) return;

      const newStatus: ResultStatus = isLabSupervisor ? 'reviewed' : 'approved';
      const resultIds = results.map(r => r.id);
      
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
      return resultIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['sample-progress'] });
      queryClient.invalidateQueries({ queryKey: ['project-samples-progress'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast.success(`${count} results ${isLabSupervisor ? 'reviewed' : 'approved'}`);
      setComments(new Map());
    },
    onError: (error) => {
      toast.error('Failed to approve results: ' + error.message);
    },
  });

  const rejectAllMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!results || results.length === 0) return;

      const resultIds = results.map(r => r.id);
      
      // Build individual rejection reasons with comments
      const updates = results.map(result => {
        const individualComment = comments.get(result.id);
        const rejectionReason = individualComment 
          ? `${reason}\n\nSpecific issue: ${individualComment}`
          : reason;
        
        return {
          id: result.id,
          status: 'draft' as ResultStatus,
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        };
      });

      // Update each result with its specific rejection reason
      for (const update of updates) {
        const { error } = await supabase
          .from('results')
          .update({
            status: update.status,
            rejected_by: update.rejected_by,
            rejected_at: update.rejected_at,
            rejection_reason: update.rejection_reason,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      return resultIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast.success(`${count} results sent back to analyst for revision`);
      setComments(new Map());
      setShowRejectDialog(false);
      setRejectReason('');
    },
    onError: (error) => {
      toast.error('Failed to reject results: ' + error.message);
    },
  });

  const handleApproveAll = () => {
    if (commentCount > 0) {
      toast.error('Please resolve or clear comments before approving');
      return;
    }
    approveAllMutation.mutate();
  };

  const handleRejectAll = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectAllMutation.mutate(rejectReason);
  };

  const isPending = approveAllMutation.isPending || rejectAllMutation.isPending;

  return (
    <>
      <div className="space-y-6">
        {/* Project Filter */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">Project:</label>
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
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

          {/* Action Buttons */}
          {selectedProjectId && results && results.length > 0 && (
            <div className="flex items-center gap-2">
              {commentCount > 0 && (
                <Badge variant="secondary" className="gap-1 mr-2">
                  <MessageSquare className="w-3 h-3" />
                  {commentCount} comments
                </Badge>
              )}
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject All
              </Button>
              <Button
                onClick={handleApproveAll}
                disabled={isPending || commentCount > 0}
              >
                {approveAllMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isLabSupervisor ? 'Approve All for QA' : 'Final Approve All'}
              </Button>
            </div>
          )}
        </div>

        {/* Role-based tabs */}
        {isLabSupervisor && selectedProjectId && (
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as typeof activeTab);
            setComments(new Map());
          }}>
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
            comments={comments}
            onCommentChange={handleCommentChange}
          />
        )}

        {/* Reject Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Reject All Results
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will send all {results?.length || 0} results back to the analyst for revision.
                {commentCount > 0 && (
                  <span className="block mt-2 text-warning">
                    Your {commentCount} individual comments will be included with each affected result.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">General Rejection Reason:</label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide overall reason for rejection..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {commentCount > 0 && (
                <div className="p-3 rounded bg-muted text-sm">
                  <p className="font-medium mb-2">Individual comments ({commentCount}):</p>
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                    {buildCommentsSummary()}
                  </pre>
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRejectAll}
                disabled={!rejectReason.trim() || rejectAllMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {rejectAllMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject All Results
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
