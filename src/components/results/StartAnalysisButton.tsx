import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUpdateSample, useSamplesByProject } from '@/hooks/useSamples';
import { toast } from 'sonner';

interface StartAnalysisButtonProps {
  projectId: string;
  labSection: string;
  labLabel: string;
}

export function StartAnalysisButton({ projectId, labSection, labLabel }: StartAnalysisButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: samples, isLoading } = useSamplesByProject(projectId);
  const updateSample = useUpdateSample();

  // Filter samples that are in 'received' status
  const receivedSamples = samples?.filter(s => s.status === 'received') || [];

  const handleStartAnalysis = async () => {
    if (receivedSamples.length === 0) {
      toast.info('No samples in "Received" status to start');
      return;
    }

    try {
      // Update all received samples to in_progress
      await Promise.all(
        receivedSamples.map(sample =>
          updateSample.mutateAsync({
            id: sample.id,
            status: 'in_progress',
          })
        )
      );

      toast.success(`Started analysis for ${receivedSamples.length} sample(s) in ${labLabel}`);
      setOpen(false);
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast.error('Failed to start analysis');
    }
  };

  const inProgressCount = samples?.filter(s => s.status === 'in_progress').length || 0;
  const completedCount = samples?.filter(s => s.status === 'completed').length || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!projectId}>
          <PlayCircle className="w-4 h-4" />
          Start Analysis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Analysis - {labLabel}</DialogTitle>
          <DialogDescription>
            Mark samples as "In Progress" to begin analysis for this lab section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-semibold text-warning">{receivedSamples.length}</p>
              <p className="text-sm text-muted-foreground">Received</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-semibold text-info">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-semibold text-success">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>

          {receivedSamples.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Samples to start:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {receivedSamples.map(sample => (
                  <div key={sample.id} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                    <Badge variant="outline" className="status-badge status-draft">
                      Received
                    </Badge>
                    <span className="font-mono text-sm">{sample.sample_id}</span>
                    {sample.field_id && (
                      <span className="text-xs text-muted-foreground">({sample.field_id})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 text-success">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">All samples started</p>
                <p className="text-sm opacity-80">No samples in "Received" status</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartAnalysis} 
            disabled={receivedSamples.length === 0 || updateSample.isPending}
          >
            {updateSample.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            Start {receivedSamples.length} Sample(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
