import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  FileCheck,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type ResultStatus = Database['public']['Enums']['result_status'];

interface ResultWithDetails {
  id: string;
  entered_value: string | null;
  canonical_value: number | null;
  canonical_unit: string | null;
  qualifier: string | null;
  is_below_mdl: boolean | null;
  status: ResultStatus;
  entered_at: string | null;
  analyst_notes: string | null;
  sample: {
    sample_id: string;
    project: {
      code: string;
      title: string;
    };
  };
  parameter_config: {
    mdl: number;
    loq: number;
    canonical_unit: string;
    parameter: {
      name: string;
      abbreviation: string;
    };
  };
  entered_by_profile: {
    full_name: string | null;
    email: string;
  } | null;
}

export default function ReviewQueue() {
  const { user, isLabSupervisor, isQaOfficer, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedResult, setSelectedResult] = useState<ResultWithDetails | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending_review' | 'reviewed'>('pending_review');

  // Fetch results based on user role
  const targetStatus = isQaOfficer && !isLabSupervisor ? 'reviewed' : activeTab;

  const { data: results, isLoading } = useQuery({
    queryKey: ['review-queue', targetStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`
          id,
          entered_value,
          canonical_value,
          canonical_unit,
          qualifier,
          is_below_mdl,
          status,
          entered_at,
          analyst_notes,
          sample:samples(
            sample_id,
            project:projects(code, title)
          ),
          parameter_config:parameter_configs(
            mdl,
            loq,
            canonical_unit,
            parameter:parameters(name, abbreviation)
          ),
          entered_by_profile:profiles!results_entered_by_fkey(full_name, email)
        `)
        .eq('status', targetStatus)
        .order('entered_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ResultWithDetails[];
    },
  });

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
      toast.success(isLabSupervisor ? 'Result reviewed successfully' : 'Result approved successfully');
      setSelectedResult(null);
      setReviewNotes('');
    },
    onError: (error) => {
      toast.error('Failed to process result: ' + error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ resultId, reason }: { resultId: string; reason: string }) => {
      const { error } = await supabase
        .from('results')
        .update({
          status: 'rejected' as ResultStatus,
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', resultId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      toast.success('Result rejected');
      setShowRejectDialog(false);
      setSelectedResult(null);
      setRejectReason('');
    },
    onError: (error) => {
      toast.error('Failed to reject result: ' + error.message);
    },
  });

  const getStatusBadge = (status: ResultStatus) => {
    const config = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      pending_review: { label: 'Pending Review', variant: 'outline' as const, icon: Clock },
      reviewed: { label: 'Reviewed', variant: 'secondary' as const, icon: FileCheck },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
      revision_required: { label: 'Revision Required', variant: 'outline' as const, icon: AlertTriangle },
    };
    
    const { label, variant, icon: Icon } = config[status] || config.draft;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Review Queue</h1>
          <p className="text-muted-foreground">
            {isQaOfficer ? 'Final approval of reviewed results' : 'Review and validate analyst entries'}
          </p>
        </div>

        {isLabSupervisor && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed (QA Pending)</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              {activeTab === 'pending_review' ? 'Results Awaiting Review' : 'Results Awaiting QA Approval'}
            </CardTitle>
            <CardDescription>
              {results?.length || 0} results in queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results && results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Analyst</TableHead>
                    <TableHead>Entered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {result.sample?.project?.code}
                      </TableCell>
                      <TableCell>{result.sample?.sample_id}</TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {result.parameter_config?.parameter?.abbreviation}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={result.is_below_mdl ? 'text-info' : ''}>
                          {result.qualifier || result.entered_value || '-'}{' '}
                          {result.canonical_unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {result.entered_by_profile?.full_name || result.entered_by_profile?.email}
                      </TableCell>
                      <TableCell>
                        {result.entered_at 
                          ? format(new Date(result.entered_at), 'MMM d, HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedResult(result)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedResult(result);
                              approveMutation.mutate({ resultId: result.id, notes: '' });
                            }}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedResult(result);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results pending review</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Detail Dialog */}
        <Dialog open={!!selectedResult && !showRejectDialog} onOpenChange={() => setSelectedResult(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Result</DialogTitle>
              <DialogDescription>
                {selectedResult?.sample?.project?.code} - {selectedResult?.sample?.sample_id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Parameter</p>
                  <p className="font-medium">{selectedResult?.parameter_config?.parameter?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-medium font-mono">
                    {selectedResult?.qualifier || selectedResult?.entered_value}{' '}
                    {selectedResult?.canonical_unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">MDL</p>
                  <p className="font-medium">{selectedResult?.parameter_config?.mdl}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">LOQ</p>
                  <p className="font-medium">{selectedResult?.parameter_config?.loq}</p>
                </div>
              </div>

              {selectedResult?.is_below_mdl && (
                <div className="p-3 rounded-lg bg-info/10 border border-info/20 text-info text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Value is below Method Detection Limit
                </div>
              )}

              {selectedResult?.analyst_notes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Analyst Notes</p>
                  <p className="text-sm p-2 bg-muted rounded">{selectedResult.analyst_notes}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-sm mb-1">Review Notes (optional)</p>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this result..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedResult(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                Reject
              </Button>
              <Button
                onClick={() => approveMutation.mutate({ 
                  resultId: selectedResult!.id, 
                  notes: reviewNotes 
                })}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isLabSupervisor ? 'Approve for QA' : 'Final Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Result</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection. This will be sent to the analyst.
              </DialogDescription>
            </DialogHeader>
            
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
              required
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate({ 
                  resultId: selectedResult!.id, 
                  reason: rejectReason 
                })}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject Result
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
