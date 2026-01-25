import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Loader2, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useResultsByProject, useUpdateResultsBatch } from '@/hooks/useResults';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SubmitForReviewButtonProps {
  projectId: string;
  labSection: string;
  labLabel: string;
}

export function SubmitForReviewButton({ projectId, labSection, labLabel }: SubmitForReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: results } = useResultsByProject(projectId);
  const updateResults = useUpdateResultsBatch();

  // Filter draft results for this lab section
  const draftResults = results?.filter((result) => {
    const resultLabSection = result.parameter_config?.parameter?.lab_section;
    return result.status === 'draft' && 
           result.entered_value !== null && 
           result.entered_value !== '' &&
           resultLabSection === labSection;
  }) || [];

  const handleSubmit = async () => {
    if (draftResults.length === 0) {
      toast.info('No draft results to submit');
      setOpen(false);
      return;
    }

    const updates = draftResults.map((result) => ({
      id: result.id,
      status: 'pending_review' as const,
    }));

    try {
      await updateResults.mutateAsync(updates);
      toast.success(`${updates.length} result(s) submitted for review`);
      setOpen(false);
    } catch (error) {
      console.error('Error submitting results:', error);
      toast.error('Failed to submit results for review');
    }
  };

  if (!projectId) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="default" 
          disabled={draftResults.length === 0}
          className="gap-2"
        >
          <SendHorizonal className="w-4 h-4" />
          Submit for Review
          {draftResults.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-foreground/20">
              {draftResults.length}
            </span>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Submit Results for Review
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to submit <strong>{draftResults.length}</strong> result(s) from 
              the <strong>{labLabel}</strong> section for supervisor review.
            </p>
            <p className="text-warning">
              Once submitted, you will not be able to edit these results unless they are rejected.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSubmit}
            disabled={updateResults.isPending}
          >
            {updateResults.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for Review'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
