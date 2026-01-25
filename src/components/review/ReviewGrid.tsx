import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  AlertTriangle, 
  Info, 
  MessageSquare,
  Save
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChemicalFormula } from '@/components/ui/chemical-formula';
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

interface Sample {
  id: string;
  sample_id: string;
  matrix: string;
}

export interface ReviewComment {
  resultId: string;
  sampleId: string;
  parameterName: string;
  comment: string;
}

interface ReviewGridProps {
  samples: Sample[];
  results: ResultWithDetails[];
  isLoading: boolean;
  comments: Map<string, string>;
  onCommentChange: (resultId: string, comment: string) => void;
}

export function ReviewGrid({ 
  samples, 
  results, 
  isLoading,
  comments,
  onCommentChange,
}: ReviewGridProps) {
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState('');

  // Build results map: sample_id -> parameter_config_id -> result
  const resultsMap = useMemo(() => {
    const map = new Map<string, Map<string, ResultWithDetails>>();
    results.forEach((result) => {
      if (!map.has(result.sample_id)) {
        map.set(result.sample_id, new Map());
      }
      map.get(result.sample_id)!.set(result.parameter_config.id, result);
    });
    return map;
  }, [results]);

  // Get unique parameter configs from results
  const parameterColumns = useMemo(() => {
    const uniqueParams = new Map<string, { 
      configId: string;
      paramId: string;
      abbreviation: string; 
      name: string;
      unit: string;
    }>();
    
    results.forEach(result => {
      const config = result.parameter_config;
      if (config && !uniqueParams.has(config.id)) {
        uniqueParams.set(config.id, {
          configId: config.id,
          paramId: config.parameter.id,
          abbreviation: config.parameter.abbreviation,
          name: config.parameter.name,
          unit: config.canonical_unit,
        });
      }
    });
    
    return Array.from(uniqueParams.values());
  }, [results]);

  // Filter samples that have results
  const samplesWithResults = useMemo(() => {
    return samples.filter(sample => resultsMap.has(sample.id));
  }, [samples, resultsMap]);

  const handleOpenPopover = (resultId: string) => {
    setActivePopover(resultId);
    setTempComment(comments.get(resultId) || '');
  };

  const handleSaveComment = (resultId: string) => {
    onCommentChange(resultId, tempComment);
    setActivePopover(null);
    if (tempComment.trim()) {
      toast.success('Comment saved');
    }
  };

  const handleClearComment = (resultId: string) => {
    setTempComment('');
    onCommentChange(resultId, '');
    setActivePopover(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (samplesWithResults.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">No results pending review</p>
        <p className="text-sm">Results submitted for review will appear here</p>
      </div>
    );
  }

  const commentCount = Array.from(comments.values()).filter(c => c.trim()).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Info className="w-3 h-3 text-info" />
          {samplesWithResults.length} samples
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Info className="w-3 h-3 text-info" />
          {results.length} results
        </Badge>
        {commentCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="w-3 h-3" />
            {commentCount} comments
          </Badge>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-info/20 border border-info/40"></span>
          Below MDL
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-warning/20 border border-warning/40"></span>
          Has Comment
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-muted-foreground" />
          Click cell to add comment
        </span>
      </div>

      {/* Data Grid */}
      <div className="lab-section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-grid">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[hsl(var(--table-header))] min-w-[140px]">
                  Sample ID
                </th>
                <th className="min-w-[80px]">Matrix</th>
                {parameterColumns.map(col => (
                  <th key={col.configId} className="text-center min-w-[100px]">
                    <div className="flex flex-col items-center">
                      <ChemicalFormula formula={col.abbreviation} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samplesWithResults.map(sample => {
                const sampleResultsMap = resultsMap.get(sample.id);
                
                return (
                  <tr key={sample.id}>
                    <td className="sticky left-0 z-10 bg-card font-medium">
                      {sample.sample_id}
                    </td>
                    <td className="text-center text-xs text-muted-foreground capitalize">
                      {sample.matrix}
                    </td>
                    {parameterColumns.map(col => {
                      const result = sampleResultsMap?.get(col.configId);
                      
                      if (!result) {
                        return (
                          <td key={col.configId} className="p-1">
                            <div className="h-8 flex items-center justify-center text-xs text-muted-foreground">
                              —
                            </div>
                          </td>
                        );
                      }
                      
                      const isBelowMdl = result.is_below_mdl;
                      const hasComment = !!comments.get(result.id)?.trim();
                      
                      return (
                        <td key={col.configId} className="p-1">
                          <Popover 
                            open={activePopover === result.id} 
                            onOpenChange={(open) => {
                              if (open) {
                                handleOpenPopover(result.id);
                              } else {
                                setActivePopover(null);
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  'w-full h-8 px-2 text-center text-sm rounded border transition-all',
                                  'hover:ring-2 hover:ring-primary/50 cursor-pointer',
                                  isBelowMdl && !hasComment && 'bg-info/10 text-info border-info/30',
                                  hasComment && 'bg-warning/10 border-warning/50 ring-1 ring-warning/30',
                                  !isBelowMdl && !hasComment && 'bg-card border-border',
                                  'relative'
                                )}
                              >
                                {result.entered_value || '-'}
                                {(result.analyst_notes || hasComment) && (
                                  <MessageSquare 
                                    className={cn(
                                      'w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2',
                                      hasComment ? 'text-warning' : 'text-muted-foreground'
                                    )} 
                                  />
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="center">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{col.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {sample.sample_id}
                                    </p>
                                  </div>
                                  <Badge variant={isBelowMdl ? 'secondary' : 'outline'}>
                                    {result.entered_value} {col.unit}
                                  </Badge>
                                </div>
                                
                                {result.analyst_notes && (
                                  <div className="p-2 rounded bg-muted text-sm">
                                    <p className="text-xs text-muted-foreground mb-1">Analyst Notes:</p>
                                    {result.analyst_notes}
                                  </div>
                                )}

                                {isBelowMdl && (
                                  <div className="flex items-center gap-2 text-sm text-info">
                                    <AlertTriangle className="w-4 h-4" />
                                    Below MDL ({result.parameter_config.mdl})
                                  </div>
                                )}

                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Review Comment:</p>
                                  <Textarea
                                    value={tempComment}
                                    onChange={(e) => setTempComment(e.target.value)}
                                    placeholder="Add a comment for the analyst..."
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1"
                                    size="sm"
                                    onClick={() => handleSaveComment(result.id)}
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    Save Comment
                                  </Button>
                                  {tempComment.trim() && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleClearComment(result.id)}
                                    >
                                      Clear
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
