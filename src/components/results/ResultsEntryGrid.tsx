import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useSamplesByProject } from '@/hooks/useSamples';
import { useResultsByProject, useUpdateResultsBatch } from '@/hooks/useResults';
import { useParameterConfigs } from '@/hooks/useParameterConfigs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ResultsEntryGridProps {
  category: 'physico_chemical' | 'cations_anions' | 'heavy_metals' | 'hydrocarbons' | 'microbiology';
}

const categoryToLabSection: Record<string, string[]> = {
  physico_chemical: ['wet_chemistry'],
  cations_anions: ['wet_chemistry'],
  heavy_metals: ['instrumentation'],
  hydrocarbons: ['instrumentation'],
  microbiology: ['microbiology'],
};

const categoryToAnalyteGroups: Record<string, string[]> = {
  physico_chemical: ['Physical', 'Oxygen Demand', 'Solids'],
  cations_anions: ['Nutrients', 'Anions', 'Cations'],
  heavy_metals: ['Heavy Metals'],
  hydrocarbons: ['Hydrocarbons'],
  microbiology: ['Bacteria', 'Fungi'],
};

export function ResultsEntryGrid({ category }: ResultsEntryGridProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [editedCells, setEditedCells] = useState<Record<string, Record<string, string>>>({});
  
  const { user } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: samples, isLoading: samplesLoading } = useSamplesByProject(selectedProjectId);
  const { data: allResults, isLoading: resultsLoading } = useResultsByProject(selectedProjectId);
  const { data: parameterConfigs } = useParameterConfigs();
  const updateResults = useUpdateResultsBatch();

  // Filter parameter configs relevant to this category
  const relevantConfigs = useMemo(() => {
    if (!parameterConfigs) return [];
    
    const labSections = categoryToLabSection[category] || [];
    const analyteGroups = categoryToAnalyteGroups[category] || [];
    
    return parameterConfigs.filter((config) => {
      const labSection = config.parameter?.lab_section;
      const analyteGroup = config.parameter?.analyte_group;
      return labSections.includes(labSection || '') && analyteGroups.includes(analyteGroup || '');
    });
  }, [parameterConfigs, category]);

  // Build a map of sample_id -> parameter_config_id -> result
  const resultsMap = useMemo(() => {
    const map: Record<string, Record<string, typeof allResults extends (infer T)[] ? T : never>> = {};
    
    allResults?.forEach((result) => {
      if (!map[result.sample_id]) {
        map[result.sample_id] = {};
      }
      map[result.sample_id][result.parameter_config_id] = result;
    });
    
    return map;
  }, [allResults]);
  
  const handleCellChange = (sampleId: string, configId: string, value: string) => {
    setEditedCells(prev => ({
      ...prev,
      [sampleId]: {
        ...prev[sampleId],
        [configId]: value,
      },
    }));
  };

  const getCellValue = (sampleId: string, configId: string) => {
    // Check if edited
    if (editedCells[sampleId]?.[configId] !== undefined) {
      return editedCells[sampleId][configId];
    }
    // Get from DB data
    const result = resultsMap[sampleId]?.[configId];
    return result?.entered_value || '';
  };

  const isBelowMdl = (sampleId: string, configId: string) => {
    const result = resultsMap[sampleId]?.[configId];
    return result?.is_below_mdl || false;
  };

  const getResultId = (sampleId: string, configId: string) => {
    const result = resultsMap[sampleId]?.[configId];
    return result?.id;
  };

  const handleSaveAll = async () => {
    const updates: Array<{ id: string; entered_value: string; entered_by: string; entered_at: string; canonical_value: number | null; is_below_mdl: boolean }> = [];

    Object.entries(editedCells).forEach(([sampleId, paramEdits]) => {
      Object.entries(paramEdits).forEach(([configId, value]) => {
        const resultId = getResultId(sampleId, configId);
        const config = relevantConfigs.find(c => c.id === configId);
        
        if (resultId && value !== '') {
          const numValue = parseFloat(value);
          const isBelowMdlFlag = !isNaN(numValue) && config && numValue < config.mdl;
          
          updates.push({
            id: resultId,
            entered_value: value,
            entered_by: user?.id || '',
            entered_at: new Date().toISOString(),
            canonical_value: isNaN(numValue) ? null : numValue,
            is_below_mdl: isBelowMdlFlag,
          });
        }
      });
    });

    if (updates.length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      await updateResults.mutateAsync(updates);
      toast.success(`${updates.length} result(s) saved`);
      setEditedCells({});
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save results');
    }
  };

  const hasChanges = Object.keys(editedCells).length > 0;
  const isLoading = projectsLoading || (selectedProjectId && (samplesLoading || resultsLoading));

  // Count stats
  const belowMdlCount = useMemo(() => {
    let count = 0;
    samples?.forEach(sample => {
      relevantConfigs.forEach(config => {
        if (isBelowMdl(sample.id, config.id)) count++;
      });
    });
    return count;
  }, [samples, relevantConfigs, resultsMap]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[350px]">
              <SelectValue placeholder="Select Project to enter results" />
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
        
        <div className="flex items-center gap-2">
          {selectedProjectId && samples && (
            <>
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3 text-success" />
                {samples.length} samples
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Info className="w-3 h-3 text-info" />
                {relevantConfigs.length} parameters
              </Badge>
            </>
          )}
          <Button onClick={handleSaveAll} disabled={!hasChanges || updateResults.isPending}>
            {updateResults.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save All
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-info/20 border border-info/40"></span>
          Below MDL
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-warning/20 border border-warning/40"></span>
          Validation Warning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40"></span>
          Out of Range
        </span>
      </div>

      {/* Data Grid */}
      <div className="lab-section-card overflow-hidden">
        {!selectedProjectId ? (
          <div className="p-12 text-center text-muted-foreground">
            <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Select a project to begin</p>
            <p className="text-sm">Choose a project from the dropdown above to view and enter results</p>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !samples || samples.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No samples registered</p>
            <p className="text-sm">Register samples for this project first via the Samples page</p>
          </div>
        ) : relevantConfigs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No parameters for this category</p>
            <p className="text-sm">Ensure samples have parameters assigned for this lab section</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-grid">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[hsl(var(--table-header))] min-w-[140px]">
                    Sample ID
                  </th>
                  {relevantConfigs.map(config => (
                    <th key={config.id} className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span>{config.parameter?.abbreviation}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {config.canonical_unit}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          MDL: {config.mdl}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {samples.map(sample => (
                  <tr key={sample.id}>
                    <td className="sticky left-0 z-10 bg-card font-medium">
                      {sample.sample_id}
                    </td>
                    {relevantConfigs.map(config => {
                      const resultExists = !!resultsMap[sample.id]?.[config.id];
                      const value = getCellValue(sample.id, config.id);
                      const belowMdl = isBelowMdl(sample.id, config.id);
                      
                      if (!resultExists) {
                        return (
                          <td key={config.id} className="p-1">
                            <div className="h-8 flex items-center justify-center text-xs text-muted-foreground">
                              —
                            </div>
                          </td>
                        );
                      }
                      
                      return (
                        <td key={config.id} className="p-1">
                          <Input
                            value={value}
                            onChange={(e) => handleCellChange(sample.id, config.id, e.target.value)}
                            className={cn(
                              'h-8 text-center scientific-value',
                              belowMdl && 'bg-info/10 text-info border-info/30',
                            )}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      {selectedProjectId && samples && samples.length > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <div>
            <p className="text-sm font-medium">Validation Summary</p>
            <p className="text-sm text-muted-foreground">
              {belowMdlCount} results below MDL • {hasChanges ? 'Unsaved changes' : 'All changes saved'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
