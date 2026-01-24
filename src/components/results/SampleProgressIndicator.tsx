import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SampleProgress, LabProgress } from '@/hooks/useSampleProgress';

interface SampleProgressIndicatorProps {
  progress: SampleProgress;
  compact?: boolean;
}

export function SampleProgressIndicator({ progress, compact = false }: SampleProgressIndicatorProps) {
  const getStatusColor = (percent: number) => {
    if (percent === 100) return 'text-success';
    if (percent > 0) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getProgressColor = (percent: number) => {
    if (percent === 100) return 'bg-success';
    if (percent > 50) return 'bg-warning';
    return 'bg-info';
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Progress 
              value={progress.overallPercent} 
              className="w-16 h-2"
            />
            <span className={cn('text-xs font-medium', getStatusColor(progress.overallPercent))}>
              {progress.overallPercent}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{progress.sampleLabId} Progress</p>
            <div className="text-xs space-y-1">
              <p>Entered: {progress.enteredResults}/{progress.totalResults}</p>
              <p>Reviewed: {progress.reviewedResults}/{progress.totalResults}</p>
              <p>Approved: {progress.approvedResults}/{progress.totalResults}</p>
            </div>
            {progress.labProgress.length > 1 && (
              <div className="pt-2 border-t border-border space-y-1">
                {progress.labProgress.map(lab => (
                  <div key={lab.labSection} className="flex justify-between text-xs">
                    <span>{lab.labLabel}:</span>
                    <span className={getStatusColor(lab.percentComplete)}>{lab.percentComplete}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="font-medium">{progress.sampleLabId}</span>
        <Badge 
          variant="outline" 
          className={cn(
            'gap-1',
            progress.isComplete ? 'text-success border-success' : 'text-warning border-warning'
          )}
        >
          {progress.isComplete ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {progress.overallPercent}% Complete
        </Badge>
      </div>

      {/* Overall progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{progress.approvedResults}/{progress.totalResults} approved</span>
        </div>
        <Progress value={progress.overallPercent} className="h-2" />
      </div>

      {/* Per-lab breakdown */}
      {progress.labProgress.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          {progress.labProgress.map(lab => (
            <LabProgressRow key={lab.labSection} lab={lab} />
          ))}
        </div>
      )}
    </div>
  );
}

function LabProgressRow({ lab }: { lab: LabProgress }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{lab.labLabel}</span>
      <Progress value={lab.percentComplete} className="flex-1 h-1.5" />
      <span className={cn(
        'text-xs font-medium w-10 text-right',
        lab.percentComplete === 100 ? 'text-success' : 'text-muted-foreground'
      )}>
        {lab.percentComplete}%
      </span>
    </div>
  );
}

interface ProjectProgressSummaryProps {
  samplesProgress: SampleProgress[];
}

export function ProjectProgressSummary({ samplesProgress }: ProjectProgressSummaryProps) {
  const totalSamples = samplesProgress.length;
  const completedSamples = samplesProgress.filter(s => s.isComplete).length;
  const totalResults = samplesProgress.reduce((sum, s) => sum + s.totalResults, 0);
  const approvedResults = samplesProgress.reduce((sum, s) => sum + s.approvedResults, 0);
  
  const overallPercent = totalResults > 0 ? Math.round((approvedResults / totalResults) * 100) : 0;

  // Aggregate lab progress
  const labTotals: Record<string, { entered: number; reviewed: number; approved: number; total: number }> = {};
  
  samplesProgress.forEach(sample => {
    sample.labProgress.forEach(lab => {
      if (!labTotals[lab.labSection]) {
        labTotals[lab.labSection] = { entered: 0, reviewed: 0, approved: 0, total: 0 };
      }
      labTotals[lab.labSection].entered += lab.enteredResults;
      labTotals[lab.labSection].reviewed += lab.reviewedResults;
      labTotals[lab.labSection].approved += lab.approvedResults;
      labTotals[lab.labSection].total += lab.totalResults;
    });
  });

  const LAB_LABELS: Record<string, string> = {
    wet_chemistry: 'Wet Chemistry',
    instrumentation: 'Instrumentation',
    microbiology: 'Microbiology',
  };

  return (
    <div className="space-y-4 p-4 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="font-medium">Project Progress</span>
        <Badge 
          variant="outline" 
          className={cn(
            'gap-1',
            overallPercent === 100 ? 'text-success border-success' : 'text-info border-info'
          )}
        >
          {completedSamples}/{totalSamples} samples complete
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Results Approved</span>
          <span>{approvedResults}/{totalResults}</span>
        </div>
        <Progress value={overallPercent} className="h-3" />
        <p className="text-center text-sm font-medium">{overallPercent}%</p>
      </div>

      {/* Lab breakdown */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <p className="text-xs font-medium text-muted-foreground">By Lab Section:</p>
        {Object.entries(labTotals).map(([labSection, counts]) => {
          const percent = counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0;
          return (
            <div key={labSection} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-28 shrink-0">
                {LAB_LABELS[labSection] || labSection}
              </span>
              <Progress value={percent} className="flex-1 h-1.5" />
              <span className={cn(
                'text-xs font-medium w-12 text-right',
                percent === 100 ? 'text-success' : 'text-muted-foreground'
              )}>
                {counts.approved}/{counts.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
