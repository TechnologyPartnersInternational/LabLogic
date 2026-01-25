import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjectReportData } from '@/hooks/useReportData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReleaseProjectDialogProps {
  projectId: string;
  projectCode: string;
  isReadyForRelease: boolean;
}

export function ReleaseProjectDialog({ 
  projectId, 
  projectCode, 
  isReadyForRelease 
}: ReleaseProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reportData, isLoading } = useProjectReportData(projectId);

  const releaseMutation = useMutation({
    mutationFn: async () => {
      // 1. Update all samples to 'released' status
      const { error: samplesError } = await supabase
        .from('samples')
        .update({ status: 'released' })
        .eq('project_id', projectId);

      if (samplesError) throw samplesError;

      // 2. Update project with results_issued_date
      // Note: The project update triggers audit logging automatically via the log_audit_change trigger
      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          results_issued_date: new Date().toISOString().split('T')[0],
          status: 'completed',
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      queryClient.invalidateQueries({ queryKey: ['releasable-projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-report', projectId] });
      toast.success(`Project ${projectCode} has been released to client`);
      setOpen(false);
      setReleaseNotes('');
    },
    onError: (error) => {
      console.error('Release error:', error);
      toast.error('Failed to release project: ' + error.message);
    },
  });

  const handleRelease = () => {
    releaseMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="gap-2"
          disabled={!isReadyForRelease}
        >
          <Send className="w-4 h-4" />
          Release to Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Release Project to Client
          </DialogTitle>
          <DialogDescription>
            This will mark project {projectCode} as released and record the results issued date.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Status Check */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">All Results Approved</span>
                {reportData.summary.allApproved ? (
                  <Badge className="gap-1 bg-emerald-500">
                    <CheckCircle className="w-3 h-3" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    No ({reportData.summary.pendingResults} pending)
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Samples</span>
                <span className="font-medium">{reportData.summary.totalSamples}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Results</span>
                <span className="font-medium">{reportData.summary.approvedResults}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Client</span>
                <span className="font-medium">{reportData.client?.name || 'N/A'}</span>
              </div>
            </div>

            {!reportData.summary.allApproved && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Not all results are approved. Please complete the approval process before releasing.
              </div>
            )}

            {/* Release Notes */}
            <div>
              <Label htmlFor="releaseNotes">Release Notes (optional)</Label>
              <Textarea
                id="releaseNotes"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Any notes about this release..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Warning */}
            <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Mark all samples as "Released"</li>
                <li>Set project status to "Completed"</li>
                <li>Record today as the results issued date</li>
                <li>Lock all data from further modifications</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRelease}
                disabled={!reportData.summary.allApproved || releaseMutation.isPending}
                className="gap-2"
              >
                {releaseMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Confirm Release
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
