import { useState } from 'react';
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
import { Plus, Trash2, Loader2, Package } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useCreateSamplesBatch } from '@/hooks/useSamples';
import { useParameterConfigs } from '@/hooks/useParameterConfigs';
import { useCreateResultsBatch } from '@/hooks/useResults';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { Checkbox } from '@/components/ui/checkbox';

type MatrixType = Database['public']['Enums']['matrix_type'];

const matrices: { value: MatrixType; label: string }[] = [
  { value: 'water', label: 'Water' },
  { value: 'wastewater', label: 'Wastewater' },
  { value: 'sediment', label: 'Sediment' },
  { value: 'soil', label: 'Soil' },
  { value: 'air', label: 'Air' },
  { value: 'sludge', label: 'Sludge' },
];

const sampleSchema = z.object({
  sample_id: z.string().min(1, 'Sample ID is required'),
  field_id: z.string().optional(),
  matrix: z.enum(['water', 'wastewater', 'sediment', 'soil', 'air', 'sludge']),
  location: z.string().optional(),
  depth: z.string().optional(),
  collection_date: z.string().min(1, 'Collection date is required'),
  collection_time: z.string().optional(),
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
      samples: [
        {
          sample_id: '',
          field_id: '',
          matrix: 'water',
          location: '',
          depth: '',
          collection_date: new Date().toISOString().split('T')[0],
          collection_time: '',
        },
      ],
      selected_parameters: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'samples',
  });

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
      // Create samples
      const samplesData = values.samples.map((sample) => ({
        sample_id: sample.sample_id,
        field_id: sample.field_id || null,
        project_id: values.project_id,
        matrix: sample.matrix as MatrixType,
        location: sample.location || null,
        depth: sample.depth || null,
        collection_date: sample.collection_date,
        collection_time: sample.collection_time || null,
        sample_type: 'grab',
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

  const addSample = () => {
    const lastSample = fields[fields.length - 1];
    append({
      sample_id: '',
      field_id: '',
      matrix: lastSample?.matrix || 'water',
      location: lastSample?.location || '',
      depth: '',
      collection_date: lastSample?.collection_date || new Date().toISOString().split('T')[0],
      collection_time: '',
    });
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
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Samples</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSample}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Sample
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-7 gap-2 p-3 border rounded-lg bg-muted/30"
                  >
                    <FormField
                      control={form.control}
                      name={`samples.${index}.sample_id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Sample ID *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., SW-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`samples.${index}.field_id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Field ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional" {...field} />
                          </FormControl>
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
                          <FormLabel className="text-xs">Collection Date *</FormLabel>
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

                    <div className="flex items-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                  No parameter configurations found for {selectedMatrix}. Please add parameters in Configuration first.
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
