import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AlertTriangle, ChevronDown, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { Result } from '@/hooks/useResults';

interface RejectedResultsAlertProps {
  results: Result[];
  samples: Array<{ id: string; sample_id: string }>;
}

export function RejectedResultsAlert({ results, samples }: RejectedResultsAlertProps) {
  // Filter for results that have been rejected (status is draft but has rejection_reason)
  const rejectedResults = useMemo(() => {
    return results.filter(r => r.status === 'draft' && r.rejection_reason);
  }, [results]);

  // Group by sample
  const rejectedBySample = useMemo(() => {
    const grouped = new Map<string, { sampleLabId: string; results: typeof rejectedResults }>();
    
    rejectedResults.forEach(result => {
      const sample = samples.find(s => s.id === result.sample_id);
      const sampleLabId = sample?.sample_id || 'Unknown';
      
      if (!grouped.has(result.sample_id)) {
        grouped.set(result.sample_id, { sampleLabId, results: [] });
      }
      grouped.get(result.sample_id)!.results.push(result);
    });
    
    return Array.from(grouped.entries());
  }, [rejectedResults, samples]);

  if (rejectedResults.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Results Returned for Revision
        <Badge variant="destructive">{rejectedResults.length}</Badge>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm mb-3">
          The following results have been returned by the reviewer. Please address the comments and resubmit.
        </p>
        
        <div className="space-y-2">
          {rejectedBySample.map(([sampleId, { sampleLabId, results: sampleResults }]) => (
            <Collapsible key={sampleId} defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 rounded bg-background/50 hover:bg-background/80 transition-colors">
                <ChevronDown className="w-4 h-4" />
                <span className="font-medium">{sampleLabId}</span>
                <Badge variant="outline" className="ml-auto">
                  {sampleResults.length} issue{sampleResults.length > 1 ? 's' : ''}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 ml-6 space-y-1">
                {sampleResults.map(result => (
                  <div 
                    key={result.id} 
                    className="p-2 rounded bg-background/50 border border-border/50 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">
                        {result.parameter_config?.parameter?.abbreviation || 'Unknown'}
                      </span>
                      <span className="text-muted-foreground">
                        (Value: {result.entered_value} {result.parameter_config?.canonical_unit})
                      </span>
                      {result.rejected_at && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(result.rejected_at), 'MMM d, HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap pl-5">
                      {result.rejection_reason}
                    </p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
