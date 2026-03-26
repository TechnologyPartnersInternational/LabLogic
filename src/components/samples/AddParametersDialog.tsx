import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { useParameterConfigs, ParameterConfigWithRelations } from '@/hooks/useParameterConfigs';
import { useResultsByProject } from '@/hooks/useResults';
import { useCreateResultsBatch } from '@/hooks/useResults';
import { toast } from 'sonner';

interface Sample {
  id: string;
  sample_id: string;
  field_id: string | null;
  matrix: string;
  status: string;
}

interface AddParametersDialogProps {
  projectId: string;
  samples: Sample[];
  children: React.ReactNode;
}

export function AddParametersDialog({ projectId, samples, children }: AddParametersDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [step, setStep] = useState<'samples' | 'parameters'>('samples');

  const { data: parameterConfigs } = useParameterConfigs();
  const { data: existingResults } = useResultsByProject(projectId);
  const createResults = useCreateResultsBatch();

  // Build a set of existing sample+paramConfig pairs to avoid duplicates
  const existingPairs = useMemo(() => {
    const set = new Set<string>();
    existingResults?.forEach((r) => {
      set.add(`${r.sample_id}::${r.parameter_config_id}`);
    });
    return set;
  }, [existingResults]);

  // Get unique matrices from selected samples
  const selectedMatrices = useMemo(() => {
    const matrices = new Set<string>();
    samples
      .filter((s) => selectedSamples.includes(s.id))
      .forEach((s) => matrices.add(s.matrix));
    return matrices;
  }, [selectedSamples, samples]);

  // Filter configs by selected matrices
  const availableConfigs = useMemo(() => {
    if (selectedMatrices.size === 0) return [];
    return (parameterConfigs || []).filter((c) => selectedMatrices.has(c.matrix));
  }, [parameterConfigs, selectedMatrices]);

  // Group configs by analyte group
  const groupedConfigs = useMemo(() => {
    return availableConfigs.reduce((acc, config) => {
      const group = config.parameter?.analyte_group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(config);
      return acc;
    }, {} as Record<string, ParameterConfigWithRelations[]>);
  }, [availableConfigs]);

  // Count how many new results would be created (excluding duplicates)
  const newResultsCount = useMemo(() => {
    let count = 0;
    selectedSamples.forEach((sampleId) => {
      const sample = samples.find((s) => s.id === sampleId);
      if (!sample) return;
      selectedParams.forEach((configId) => {
        const config = parameterConfigs?.find((c) => c.id === configId);
        if (!config) return;
        // Only count if the config matrix matches the sample matrix
        if (config.matrix !== sample.matrix) return;
        const key = `${sampleId}::${configId}`;
        if (!existingPairs.has(key)) count++;
      });
    });
    return count;
  }, [selectedSamples, selectedParams, existingPairs, samples, parameterConfigs]);

  const toggleSample = (id: string) => {
    setSelectedSamples((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAllSamples = () => {
    if (selectedSamples.length === samples.length) {
      setSelectedSamples([]);
    } else {
      setSelectedSamples(samples.map((s) => s.id));
    }
  };

  const toggleParameter = (id: string) => {
    setSelectedParams((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleGroup = (configs: ParameterConfigWithRelations[]) => {
    const ids = configs.map((c) => c.id);
    const allSelected = ids.every((id) => selectedParams.includes(id));
    if (allSelected) {
      setSelectedParams((prev) => prev.filter((p) => !ids.includes(p)));
    } else {
      setSelectedParams((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSubmit = async () => {
    try {
      const resultsData: Array<{
        sample_id: string;
        parameter_config_id: string;
        status: 'draft';
      }> = [];

      selectedSamples.forEach((sampleId) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (!sample) return;

        selectedParams.forEach((configId) => {
          const config = parameterConfigs?.find((c) => c.id === configId);
          if (!config) return;
          if (config.matrix !== sample.matrix) return;
          
          const key = `${sampleId}::${configId}`;
          if (!existingPairs.has(key)) {
            resultsData.push({
              sample_id: sampleId,
              parameter_config_id: configId,
              status: 'draft',
            });
          }
        });
      });

      if (resultsData.length === 0) {
        toast.info('No new parameters to add. All selected parameters already exist for the chosen samples.');
        return;
      }

      await createResults.mutateAsync(resultsData);
      toast.success(`Added ${resultsData.length} new parameter assignment(s) across ${selectedSamples.length} sample(s)`);
      handleClose();
    } catch (error) {
      console.error('Error adding parameters:', error);
      toast.error('Failed to add parameters');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSamples([]);
    setSelectedParams([]);
    setStep('samples');
  };

  const skippedCount = useMemo(() => {
    let count = 0;
    selectedSamples.forEach((sampleId) => {
      const sample = samples.find((s) => s.id === sampleId);
      if (!sample) return;
      selectedParams.forEach((configId) => {
        const config = parameterConfigs?.find((c) => c.id === configId);
        if (!config || config.matrix !== sample.matrix) return;
        if (existingPairs.has(`${sampleId}::${configId}`)) count++;
      });
    });
    return count;
  }, [selectedSamples, selectedParams, existingPairs, samples, parameterConfigs]);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Parameters to Existing Samples
          </DialogTitle>
          <DialogDescription>
            {step === 'samples'
              ? 'Select the samples you want to add new parameters to.'
              : 'Select the parameters to assign to the chosen samples. Already-assigned parameters will be skipped automatically.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'samples' ? (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {selectedSamples.length} of {samples.length} samples selected
              </Label>
              <Button variant="ghost" size="sm" onClick={toggleAllSamples}>
                {selectedSamples.length === samples.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <ScrollArea className="flex-1 max-h-[400px] border rounded-lg">
              <div className="p-3 space-y-1">
                {samples.map((sample) => (
                  <label
                    key={sample.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSamples.includes(sample.id)}
                      onCheckedChange={() => toggleSample(sample.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{sample.sample_id}</span>
                      {sample.field_id && (
                        <span className="text-muted-foreground text-xs ml-2">
                          ({sample.field_id})
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {sample.matrix.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0 capitalize"
                    >
                      {sample.status.replace('_', ' ')}
                    </Badge>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {selectedParams.length} parameter(s) selected
              </Label>
              {selectedMatrices.size > 1 && (
                <p className="text-xs text-muted-foreground">
                  Showing parameters for: {[...selectedMatrices].join(', ')}
                </p>
              )}
            </div>

            {Object.keys(groupedConfigs).length === 0 ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground border rounded-lg">
                <AlertCircle className="h-4 w-4" />
                No parameter configurations found for the selected matrix(es).
              </div>
            ) : (
              <ScrollArea className="flex-1 max-h-[350px] border rounded-lg">
                <div className="p-4 grid grid-cols-2 gap-4">
                  {Object.entries(groupedConfigs).map(([group, configs]) => {
                    const groupIds = configs.map((c) => c.id);
                    const allSelected = groupIds.every((id) => selectedParams.includes(id));

                    return (
                      <div key={group} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-group-${group}`}
                            checked={allSelected}
                            onCheckedChange={() => toggleGroup(configs)}
                          />
                          <Label
                            htmlFor={`add-group-${group}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {group}
                          </Label>
                        </div>
                        <div className="ml-6 space-y-1">
                          {configs.map((config) => (
                            <div key={config.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`add-param-${config.id}`}
                                checked={selectedParams.includes(config.id)}
                                onCheckedChange={() => toggleParameter(config.id)}
                              />
                              <Label
                                htmlFor={`add-param-${config.id}`}
                                className="text-xs cursor-pointer text-muted-foreground"
                              >
                                {config.parameter?.abbreviation || config.parameter?.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {skippedCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {skippedCount} duplicate assignment(s) will be skipped automatically.
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'parameters' && (
            <Button variant="outline" onClick={() => setStep('samples')}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'samples' ? (
            <Button
              onClick={() => setStep('parameters')}
              disabled={selectedSamples.length === 0}
            >
              Next: Select Parameters
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={selectedParams.length === 0 || newResultsCount === 0 || createResults.isPending}
            >
              {createResults.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add {newResultsCount} Parameter(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
