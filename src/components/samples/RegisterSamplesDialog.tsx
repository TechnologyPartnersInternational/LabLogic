import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Trash2, Loader2, Package, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjects } from '@/hooks/useProjects';
import { useCreateSamplesBatch, useSampleCountByProject } from '@/hooks/useSamples';
import { useParameterConfigs } from '@/hooks/useParameterConfigs';
import { useCreateResultsBatch } from '@/hooks/useResults';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { Checkbox } from '@/components/ui/checkbox';
import { SampleIdGenerator } from './SampleIdGenerator';
import { ControlSampleButton } from './ControlSampleButton';

type MatrixType = Database['public']['Enums']['matrix_type'];

const matrices: { value: MatrixType; label: string }[] = [
  { value: 'water', label: 'Water' },
  { value: 'wastewater', label: 'Wastewater' },
  { value: 'sediment', label: 'Sediment' },
  { value: 'soil', label: 'Soil' },
  { value: 'air', label: 'Air' },
  { value: 'sludge', label: 'Sludge' },
];

const preservationTypes = [
  { value: 'none', label: 'None' },
  { value: 'ice', label: 'Ice (4°C)' },
  { value: 'hno3', label: 'HNO₃' },
  { value: 'h2so4', label: 'H₂SO₄' },
  { value: 'hcl', label: 'HCl' },
  { value: 'naoh', label: 'NaOH' },
  { value: 'na2s2o3', label: 'Na₂S₂O₃' },
  { value: 'zn_acetate', label: 'Zinc Acetate' },
];

const containerTypes = [
  { value: 'plastic', label: 'Plastic' },
  { value: 'glass', label: 'Glass' },
  { value: 'amber', label: 'Amber' },
  { value: 'hdpe', label: 'HDPE' },
  { value: 'sterile', label: 'Sterile' },
];

const sampleConditions = [
  { value: 'intact', label: 'Intact' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'leaking', label: 'Leaking' },
  { value: 'seal_broken', label: 'Seal Broken' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'warm', label: 'Warm (>6°C)' },
];

const sampleSchema = z.object({
  lab_id: z.string().optional(), // Auto-generated
  field_id: z.string().min(1, 'Field ID is required'),
  sample_type: z.enum(['normal', 'qc']).default('normal'),
  qc_type: z.string().optional(),
  matrix: z.enum(['water', 'wastewater', 'sediment', 'soil', 'air', 'sludge']),
  location: z.string().optional(),
  depth: z.string().optional(),
  collection_date: z.string().min(1, 'Collection date is required'),
  collection_time: z.string().optional(),
  preservation_types: z.array(z.string()).optional(),
  container_types: z.array(z.string()).optional(),
  sample_condition: z.string().optional(),
  container_count: z.number().min(1).optional(),
});

const formSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  samples: z.array(sampleSchema).min(1, 'At least one sample is required'),
  selected_parameters: z.array(z.string()).min(1, 'Select at least one parameter'),
});

type FormValues = z.infer<typeof formSchema>;

interface RegisterSamplesDialogProps {
  children: React.ReactNode;
}

export function RegisterSamplesDialog({ children }: RegisterSamplesDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: projects } = useProjects();
  const { data: parameterConfigs } = useParameterConfigs();
  const createSamples = useCreateSamplesBatch();
  const createResults = useCreateResultsBatch();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: '',
      samples: [],
      selected_parameters: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'samples',
  });

  // Reset form completely when dialog opens to give a clean slate
  useEffect(() => {
    if (open) {
      form.reset({
        project_id: '',
        samples: [],
        selected_parameters: [],
      });
    }
  }, [open, form]);

  // Watch project_id to get project code for Lab ID generation
  const watchedProjectId = form.watch('project_id');
  const selectedProject = projects?.find((p) => p.id === watchedProjectId);
  const projectCode = selectedProject?.code || 'LAB';

  // Fetch existing sample count for this project to avoid duplicate Lab IDs
  const { data: existingSampleCount = 0 } = useSampleCountByProject(watchedProjectId);

  // Calculate the starting counter based on existing samples
  const labIdCounter = existingSampleCount + 1;

  // Generate Lab ID based on project code and existing sample count
  const generateLabId = (index: number) => {
    return `${projectCode}-${(labIdCounter + index).toString().padStart(3, '0')}`;
  };

  // Update lab IDs when project changes or sample count is loaded
  useEffect(() => {
    if (watchedProjectId && existingSampleCount !== undefined) {
      const samples = form.getValues('samples');
      samples.forEach((_, index) => {
        form.setValue(`samples.${index}.lab_id`, generateLabId(index));
      });
    }
  }, [watchedProjectId, projectCode, existingSampleCount]);

  const selectedMatrix = form.watch('samples.0.matrix');
  
  // Get unique parameter configs for the selected matrix
  const availableConfigs = parameterConfigs?.filter(
    (config) => config.matrix === selectedMatrix
  ) || [];

  // Group by analyte_group
  const groupedConfigs = availableConfigs.reduce((acc, config) => {
    const group = config.parameter?.analyte_group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(config);
    return acc;
  }, {} as Record<string, typeof availableConfigs>);

  const onSubmit = async (values: FormValues) => {
    try {
      // Create samples - lab_id becomes sample_id in DB, field_id stays as field_id
      const samplesData = values.samples.map((sample, index) => ({
        sample_id: sample.lab_id || generateLabId(index), // Lab ID stored as sample_id
        field_id: sample.field_id || null,
        project_id: values.project_id,
        matrix: sample.matrix as MatrixType,
        location: sample.location || null,
        depth: sample.depth || null,
        collection_date: sample.collection_date,
        collection_time: sample.collection_time || null,
        sample_type: sample.sample_type === 'qc' ? (sample.qc_type || 'qc') : 'grab',
        preservation_type: sample.preservation_types?.length ? sample.preservation_types.join(',') : null,
        container_type: sample.container_types?.length ? sample.container_types : null,
        sample_condition: sample.sample_condition || 'intact',
        container_count: sample.container_count || 1,
      }));

      const createdSamples = await createSamples.mutateAsync(samplesData);

      // Create result placeholders for each sample + selected parameter config
      const resultsData = createdSamples.flatMap((sample) =>
        values.selected_parameters.map((configId) => ({
          sample_id: sample.id,
          parameter_config_id: configId,
          status: 'draft' as const,
        }))
      );

      if (resultsData.length > 0) {
        await createResults.mutateAsync(resultsData);
      }

      toast.success(`${createdSamples.length} sample(s) registered with ${values.selected_parameters.length} parameters each`);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error registering samples:', error);
      toast.error('Failed to register samples');
    }
  };

  const addSample = (fieldId?: string, isQc: boolean = false, qcType?: string) => {
    const lastSample = fields[fields.length - 1];
    const currentMatrix = lastSample?.matrix || 'water';
    const newIndex = fields.length;
    
    append({
      lab_id: generateLabId(newIndex),
      field_id: fieldId || '',
      sample_type: isQc ? 'qc' : 'normal',
      qc_type: qcType,
      matrix: currentMatrix,
      location: lastSample?.location || '',
      depth: '',
      collection_date: lastSample?.collection_date || new Date().toISOString().split('T')[0],
      collection_time: '',
      preservation_types: lastSample?.preservation_types || [],
      container_types: lastSample?.container_types || [],
      sample_condition: 'intact',
      container_count: 1,
    });
  };

  // Copy characteristics from previous sample
  const copyFromPrevious = (index: number) => {
    if (index === 0) return;
    const previousSample = form.getValues(`samples.${index - 1}`);
    const currentSample = form.getValues(`samples.${index}`);
    
    // Preserve current field_id and lab_id, copy everything else
    form.setValue(`samples.${index}`, {
      ...currentSample,
      matrix: previousSample.matrix,
      location: previousSample.location,
      depth: previousSample.depth,
      collection_date: previousSample.collection_date,
      collection_time: previousSample.collection_time,
      preservation_types: previousSample.preservation_types || [],
      container_types: previousSample.container_types || [],
      sample_condition: previousSample.sample_condition,
      container_count: previousSample.container_count,
    });
  };

  // Handle serial ID generation
  const handleGenerateSeries = (fieldIds: string[]) => {
    const currentMatrix = fields[0]?.matrix || 'water';
    const currentDate = fields[0]?.collection_date || new Date().toISOString().split('T')[0];
    const currentLocation = fields[0]?.location || '';
    const currentPreservations = fields[0]?.preservation_types || [];
    const currentContainers = fields[0]?.container_types || [];
    const currentCondition = fields[0]?.sample_condition || 'intact';
    const currentCount = fields[0]?.container_count || 1;
    const baseIndex = fields.length;
    
    // Build all samples at once and append them together
    const newSamples = fieldIds.map((fieldId, i) => ({
      lab_id: generateLabId(baseIndex + i),
      field_id: fieldId,
      sample_type: 'normal' as const,
      qc_type: undefined,
      matrix: currentMatrix as MatrixType,
      location: currentLocation,
      depth: '',
      collection_date: currentDate,
      collection_time: '',
      preservation_types: currentPreservations,
      container_types: currentContainers,
      sample_condition: currentCondition,
      container_count: currentCount,
    }));
    
    // Append all samples at once to avoid stale index issues
    newSamples.forEach(sample => append(sample));
  };

  // Handle control sample addition
  const handleAddControl = (controlType: string, fieldId: string) => {
    addSample(fieldId, true, controlType);
  };

  const toggleParameter = (configId: string) => {
    const current = form.getValues('selected_parameters');
    if (current.includes(configId)) {
      form.setValue('selected_parameters', current.filter(id => id !== configId));
    } else {
      form.setValue('selected_parameters', [...current, configId]);
    }
  };

  const toggleGroup = (configs: typeof availableConfigs) => {
    const current = form.getValues('selected_parameters');
    const groupIds = configs.map(c => c.id);
    const allSelected = groupIds.every(id => current.includes(id));
    
    if (allSelected) {
      form.setValue('selected_parameters', current.filter(id => !groupIds.includes(id)));
    } else {
      const newSelection = [...new Set([...current, ...groupIds])];
      form.setValue('selected_parameters', newSelection);
    }
  };

  const selectedParams = form.watch('selected_parameters');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Samples</DialogTitle>
          <DialogDescription>
            Register new samples upon receipt and assign parameters for analysis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Selection */}
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.code} - {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sample Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-base font-semibold">
                  Samples {fields.length > 0 && `(${fields.length})`}
                </Label>
                <div className="flex gap-2">
                  <SampleIdGenerator onGenerate={handleGenerateSeries} />
                  <ControlSampleButton 
                    matrix={selectedMatrix} 
                    onAddControl={handleAddControl} 
                  />
                </div>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <p className="text-muted-foreground text-sm mb-2">
                    No samples added yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use "Generate Series" to quickly add samples with sequential Field IDs, or "Add QC Sample" for control samples
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`p-3 border rounded-lg space-y-3 ${
                        field.sample_type === 'qc' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' : 'bg-muted/30'
                      }`}
                    >
                      {/* Row 1: Core sample info */}
                      <div className="grid grid-cols-7 gap-2">
                        {/* Lab ID (Auto-generated, read-only) */}
                        <FormField
                          control={form.control}
                          name={`samples.${index}.lab_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Lab ID</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  value={field.value || generateLabId(index)}
                                  readOnly 
                                  className="bg-muted text-muted-foreground"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Field ID (Client's ID) */}
                        <FormField
                          control={form.control}
                          name={`samples.${index}.field_id`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Field ID *
                                {fields[index]?.sample_type === 'qc' && (
                                  <span className="ml-1 text-amber-600">(QC)</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., SW-001" {...formField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`samples.${index}.matrix`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Matrix *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {matrices.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                      {m.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`samples.${index}.location`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Station 1" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`samples.${index}.collection_date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Date *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`samples.${index}.depth`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Depth</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 0-10cm" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end gap-1">
                          {index > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyFromPrevious(index)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy from previous sample</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Row 2: Preservation & Containers */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                        <FormField
                          control={form.control}
                          name={`samples.${index}.preservation_types`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Preservation</FormLabel>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {preservationTypes.map((preservation) => {
                                  const isChecked = field.value?.includes(preservation.value) || false;
                                  return (
                                    <div key={preservation.value} className="flex items-center space-x-1">
                                      <Checkbox
                                        id={`preservation-${index}-${preservation.value}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, preservation.value]);
                                          } else {
                                            field.onChange(current.filter((v: string) => v !== preservation.value));
                                          }
                                        }}
                                      />
                                      <Label
                                        htmlFor={`preservation-${index}-${preservation.value}`}
                                        className="text-xs cursor-pointer"
                                      >
                                        {preservation.label}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`samples.${index}.container_types`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Container Types</FormLabel>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {containerTypes.map((container) => {
                                  const isChecked = field.value?.includes(container.value) || false;
                                  return (
                                    <div key={container.value} className="flex items-center space-x-1">
                                      <Checkbox
                                        id={`container-${index}-${container.value}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, container.value]);
                                          } else {
                                            field.onChange(current.filter((v: string) => v !== container.value));
                                          }
                                        }}
                                      />
                                      <Label
                                        htmlFor={`container-${index}-${container.value}`}
                                        className="text-xs cursor-pointer"
                                      >
                                        {container.label}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 3: Condition & Container Count */}
                      <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border/50">
                        <FormField
                          control={form.control}
                          name={`samples.${index}.sample_condition`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Condition</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || 'intact'}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sampleConditions.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`samples.${index}.container_count`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs"># Containers</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1}
                                  placeholder="1"
                                  {...field}
                                  value={field.value || 1}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Parameter Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <Label className="text-base font-semibold">
                  Assign Parameters ({selectedParams.length} selected)
                </Label>
              </div>

              {Object.keys(groupedConfigs).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {selectedMatrix 
                    ? `No parameter configurations found for ${selectedMatrix}. Please add parameters in Configuration first.`
                    : 'Add a sample first to see available parameters for the selected matrix.'}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {Object.entries(groupedConfigs).map(([group, configs]) => {
                    const groupIds = configs.map(c => c.id);
                    const allSelected = groupIds.every(id => selectedParams.includes(id));
                    const someSelected = groupIds.some(id => selectedParams.includes(id)) && !allSelected;

                    return (
                      <div key={group} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group}`}
                            checked={allSelected}
                            ref={(ref) => {
                              if (ref) {
                                (ref as HTMLButtonElement).dataset.state = someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked';
                              }
                            }}
                            onCheckedChange={() => toggleGroup(configs)}
                          />
                          <Label
                            htmlFor={`group-${group}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {group}
                          </Label>
                        </div>
                        <div className="ml-6 space-y-1">
                          {configs.map((config) => (
                            <div key={config.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={config.id}
                                checked={selectedParams.includes(config.id)}
                                onCheckedChange={() => toggleParameter(config.id)}
                              />
                              <Label
                                htmlFor={config.id}
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
              )}
              <FormField
                control={form.control}
                name="selected_parameters"
                render={() => <FormMessage />}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSamples.isPending || createResults.isPending}
              >
                {(createSamples.isPending || createResults.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Register {fields.length} Sample(s)
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
