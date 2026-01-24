import { useState, useMemo } from 'react';
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
import { ChemicalFormula } from '@/components/ui/chemical-formula';

interface ResultsEntryGridProps {
  category: 'physico_chemical' | 'cations_anions' | 'heavy_metals' | 'hydrocarbons' | 'microbiology';
}

// Maps UI tabs to database lab_section values
const categoryToLabSection: Record<string, string> = {
  physico_chemical: 'wet_chemistry',
  cations_anions: 'wet_chemistry',
  heavy_metals: 'instrumentation',
  hydrocarbons: 'instrumentation',
  microbiology: 'microbiology',
};

// Maps UI tabs to database analyte_group values
const categoryToAnalyteGroups: Record<string, string[]> = {
  physico_chemical: ['Physico-Chemical'],
  cations_anions: ['Anions', 'Cations'],
  heavy_metals: ['Heavy Metals'],
  hydrocarbons: ['Hydrocarbons'],
  microbiology: ['Microbiology'],
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

  // Get unique parameter_config_ids from the results for this category
  const relevantResultsMap = useMemo(() => {
    if (!allResults) return new Map();
    
    const labSection = categoryToLabSection[category];
    const analyteGroups = categoryToAnalyteGroups[category] || [];
    
    // Filter results that match this category
    const filtered = allResults.filter((result) => {
      const resultLabSection = result.parameter_config?.parameter?.lab_section;
      const resultAnalyteGroup = result.parameter_config?.parameter?.analyte_group;
      return resultLabSection === labSection && analyteGroups.includes(resultAnalyteGroup || '');
    });
    
    // Build map: sample_id -> parameter_config_id -> result
    const map = new Map<string, Map<string, typeof allResults[0]>>();
    filtered.forEach((result) => {
      if (!map.has(result.sample_id)) {
        map.set(result.sample_id, new Map());
      }
      map.get(result.sample_id)!.set(result.parameter_config_id, result);
    });
    
    return map;
  }, [allResults, category]);

  // Get unique parameter configs from the filtered results (preserves order and removes duplicates)
  const relevantConfigs = useMemo(() => {
    if (!allResults || !parameterConfigs) return [];
    
    const labSection = categoryToLabSection[category];
    const analyteGroups = categoryToAnalyteGroups[category] || [];
    
    // Get all unique parameter_config_ids from filtered results
    const configIds = new Set<string>();
    allResults.forEach((result) => {
      const resultLabSection = result.parameter_config?.parameter?.lab_section;
      const resultAnalyteGroup = result.parameter_config?.parameter?.analyte_group;
      if (resultLabSection === labSection && analyteGroups.includes(resultAnalyteGroup || '')) {
        configIds.add(result.parameter_config_id);
      }
    });
    
    // Return the full config objects in order
    return parameterConfigs.filter(config => configIds.has(config.id));
  }, [allResults, parameterConfigs, category]);

  // Samples that have results for this category
  const samplesWithResults = useMemo(() => {
    if (!samples) return [];
    return samples.filter(sample => relevantResultsMap.has(sample.id));
  }, [samples, relevantResultsMap]);
  
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
    const result = relevantResultsMap.get(sampleId)?.get(configId);
    return result?.entered_value || '';
  };

  const isBelowMdl = (sampleId: string, configId: string) => {
    const result = relevantResultsMap.get(sampleId)?.get(configId);
    return result?.is_below_mdl || false;
  };

  const getResultId = (sampleId: string, configId: string) => {
    const result = relevantResultsMap.get(sampleId)?.get(configId);
    return result?.id;
  };

  const getResultConfig = (sampleId: string, configId: string) => {
    const result = relevantResultsMap.get(sampleId)?.get(configId);
    return result?.parameter_config;
  };

  const handleSaveAll = async () => {
    const updates: Array<{ id: string; entered_value: string; entered_by: string; entered_at: string; canonical_value: number | null; is_below_mdl: boolean }> = [];

    Object.entries(editedCells).forEach(([sampleId, paramEdits]) => {
      Object.entries(paramEdits).forEach(([configId, value]) => {
        const resultId = getResultId(sampleId, configId);
        const config = getResultConfig(sampleId, configId);
        
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

  const hasChanges = Object.keys(editedCells).some(sampleId => 
    Object.keys(editedCells[sampleId]).length > 0
  );
  const isLoading = projectsLoading || (selectedProjectId && (samplesLoading || resultsLoading));

  // Count stats
  const belowMdlCount = useMemo(() => {
    let count = 0;
    samplesWithResults.forEach(sample => {
      relevantResultsMap.get(sample.id)?.forEach((result) => {
        if (result.is_below_mdl) count++;
      });
    });
    return count;
  }, [samplesWithResults, relevantResultsMap]);

  // Group configs by parameter name for display (different matrices may have same parameter)
  const configColumns = useMemo(() => {
    // Get unique parameter names and their abbreviations from the configs
    const uniqueParams = new Map<string, { abbreviation: string; configs: Map<string, typeof relevantConfigs[0]> }>();
    
    relevantConfigs.forEach(config => {
      const paramId = config.parameter_id;
      const paramName = config.parameter?.name || '';
      const paramAbbr = config.parameter?.abbreviation || '';
      
      if (!uniqueParams.has(paramId)) {
        uniqueParams.set(paramId, {
          abbreviation: paramAbbr,
          configs: new Map(),
        });
      }
      uniqueParams.get(paramId)!.configs.set(config.matrix, config);
    });
    
    return Array.from(uniqueParams.entries()).map(([paramId, data]) => ({
      paramId,
      abbreviation: data.abbreviation,
      configsByMatrix: data.configs,
    }));
  }, [relevantConfigs]);

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
                {samplesWithResults.length} samples
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Info className="w-3 h-3 text-info" />
                {configColumns.length} parameters
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
        ) : samplesWithResults.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No samples with results for this section</p>
            <p className="text-sm">Register samples with parameters assigned to this lab section first</p>
          </div>
        ) : configColumns.length === 0 ? (
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
                  <th className="min-w-[80px]">Matrix</th>
                  {configColumns.map(col => (
                    <th key={col.paramId} className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <ChemicalFormula formula={col.abbreviation} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {samplesWithResults.map(sample => {
                  const sampleMatrix = sample.matrix;
                  const sampleResultsMap = relevantResultsMap.get(sample.id);
                  
                  return (
                    <tr key={sample.id}>
                      <td className="sticky left-0 z-10 bg-card font-medium">
                        {sample.sample_id}
                      </td>
                      <td className="text-center text-xs text-muted-foreground capitalize">
                        {sampleMatrix}
                      </td>
                      {configColumns.map(col => {
                        // Find the config for this sample's matrix
                        const config = col.configsByMatrix.get(sampleMatrix);
                        if (!config) {
                          return (
                            <td key={col.paramId} className="p-1">
                              <div className="h-8 flex items-center justify-center text-xs text-muted-foreground">
                                —
                              </div>
                            </td>
                          );
                        }
                        
                        const result = sampleResultsMap?.get(config.id);
                        if (!result) {
                          return (
                            <td key={col.paramId} className="p-1">
                              <div className="h-8 flex items-center justify-center text-xs text-muted-foreground">
                                —
                              </div>
                            </td>
                          );
                        }
                        
                        const value = getCellValue(sample.id, config.id);
                        const belowMdl = isBelowMdl(sample.id, config.id);
                        
                        return (
                          <td key={col.paramId} className="p-1">
                            <div className="flex flex-col gap-0.5">
                              <Input
                                value={value}
                                onChange={(e) => handleCellChange(sample.id, config.id, e.target.value)}
                                className={cn(
                                  'h-8 text-center scientific-value',
                                  belowMdl && 'bg-info/10 text-info border-info/30',
                                )}
                                placeholder={`< ${config.mdl}`}
                              />
                              <span className="text-[10px] text-center text-muted-foreground">
                                {config.canonical_unit}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      {selectedProjectId && samplesWithResults.length > 0 && (
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
