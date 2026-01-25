import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { Result } from '@/hooks/useResults';

interface RejectedResultsAlertProps {
  results: Result[];
  samples: Array<{ id: string; sample_id: string }>;
}

// Extract general rejection reason (the part before "Specific issue:")
function extractGeneralReason(rejection_reason: string | null): string {
  if (!rejection_reason) return '';
  const parts = rejection_reason.split('\n\nSpecific issue:');
  return parts[0]?.trim() || rejection_reason;
}

// Extract specific comment (the part after "Specific issue:")
export function extractSpecificComment(rejection_reason: string | null): string | null {
  if (!rejection_reason) return null;
  const match = rejection_reason.match(/Specific issue:\s*(.+)/s);
  return match ? match[1].trim() : null;
}

export function RejectedResultsAlert({ results, samples }: RejectedResultsAlertProps) {
  // Filter for results that have been rejected (status is draft but has rejection_reason)
  const rejectedResults = useMemo(() => {
    return results.filter(r => r.status === 'draft' && r.rejection_reason);
  }, [results]);

  // Get unique general reasons (usually there's just one per rejection batch)
  const generalReasons = useMemo(() => {
    const reasons = new Set<string>();
    rejectedResults.forEach(r => {
      const general = extractGeneralReason(r.rejection_reason);
      if (general) reasons.add(general);
    });
    return Array.from(reasons);
  }, [rejectedResults]);

  // Count how many have specific comments
  const specificCommentCount = useMemo(() => {
    return rejectedResults.filter(r => extractSpecificComment(r.rejection_reason)).length;
  }, [rejectedResults]);

  // Get unique sample IDs affected
  const affectedSamples = useMemo(() => {
    const sampleIds = new Set<string>();
    rejectedResults.forEach(r => {
      const sample = samples.find(s => s.id === r.sample_id);
      if (sample) sampleIds.add(sample.sample_id);
    });
    return Array.from(sampleIds);
  }, [rejectedResults, samples]);

  if (rejectedResults.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Results Returned for Revision
        <Badge variant="destructive">{rejectedResults.length}</Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        {generalReasons.length > 0 && (
          <div className="p-3 rounded bg-background/50 border border-border/50">
            <p className="text-sm font-medium mb-1">Reviewer Comment:</p>
            {generalReasons.map((reason, i) => (
              <p key={i} className="text-sm text-foreground whitespace-pre-wrap">
                {reason}
              </p>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Affected samples: 
          </span>
          {affectedSamples.slice(0, 5).map(sampleId => (
            <Badge key={sampleId} variant="outline" className="text-xs">
              {sampleId}
            </Badge>
          ))}
          {affectedSamples.length > 5 && (
            <span className="text-muted-foreground">
              +{affectedSamples.length - 5} more
            </span>
          )}
        </div>

        {specificCommentCount > 0 && (
          <p className="text-xs text-muted-foreground">
            💬 {specificCommentCount} result{specificCommentCount > 1 ? 's have' : ' has'} specific comments. 
            Click on highlighted cells in the grid to view and respond.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
