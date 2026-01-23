import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParameters } from '@/hooks/useParameters';
import { useMethods } from '@/hooks/useMethods';
import { useCreateParameterConfig } from '@/hooks/useParameterConfigs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type MatrixType = Database['public']['Enums']['matrix_type'];

const configSchema = z.object({
  parameter_id: z.string().uuid('Please select a parameter'),
  method_id: z.string().uuid('Please select a method'),
  matrix: z.enum(['water', 'wastewater', 'sediment', 'soil', 'air', 'sludge']),
  canonical_unit: z.string().min(1, 'Unit is required'),
  mdl: z.coerce.number().min(0, 'MDL must be positive'),
  loq: z.coerce.number().min(0, 'LOQ must be positive'),
  min_value: z.coerce.number().optional(),
  max_value: z.coerce.number().optional(),
  decimal_places: z.coerce.number().int().min(0).max(10).default(2),
  report_below_mdl_as: z.enum(['<MDL', 'ND', 'value']).default('<MDL'),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface AddParameterConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedParameterId?: string;
}

export function AddParameterConfigDialog({ 
  open, 
  onOpenChange,
  preselectedParameterId,
}: AddParameterConfigDialogProps) {
  const { data: parameters = [] } = useParameters();
  const { data: methods = [] } = useMethods();
  const createConfig = useCreateParameterConfig();
  
  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      parameter_id: preselectedParameterId || '',
      method_id: '',
      matrix: 'water',
      canonical_unit: 'mg/L',
      mdl: 0.01,
      loq: 0.05,
      min_value: undefined,
      max_value: undefined,
      decimal_places: 2,
      report_below_mdl_as: '<MDL',
    },
  });

  const onSubmit = async (data: ConfigFormData) => {
    try {
      if (data.loq < data.mdl) {
        toast.error('LOQ must be greater than or equal to MDL');
        return;
      }

      await createConfig.mutateAsync({
        parameter_id: data.parameter_id,
        method_id: data.method_id,
        matrix: data.matrix as MatrixType,
        canonical_unit: data.canonical_unit,
        mdl: data.mdl,
        loq: data.loq,
        min_value: data.min_value ?? null,
        max_value: data.max_value ?? null,
        decimal_places: data.decimal_places,
        report_below_mdl_as: data.report_below_mdl_as,
      });
      toast.success('Configuration created successfully');
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create configuration');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Parameter Configuration</DialogTitle>
          <DialogDescription>
            Configure MDL, LOQ, units, and validation rules for a parameter-method-matrix combination.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parameter_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parameter</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parameter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parameters.map((param) => (
                          <SelectItem key={param.id} value={param.id}>
                            {param.name} ({param.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {methods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.code} - {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="matrix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrix</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select matrix" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="wastewater">Wastewater</SelectItem>
                        <SelectItem value="sediment">Sediment</SelectItem>
                        <SelectItem value="soil">Soil</SelectItem>
                        <SelectItem value="air">Air</SelectItem>
                        <SelectItem value="sludge">Sludge</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="canonical_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., mg/L" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="mdl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MDL</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Method Detection Limit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LOQ</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Limit of Quantification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="decimal_places"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decimal Places</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="min_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Value (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      e.g., 0 for pH
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Value (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      e.g., 14 for pH
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="report_below_mdl_as"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Below MDL Display</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="<MDL">&lt;MDL</SelectItem>
                        <SelectItem value="ND">ND (Not Detected)</SelectItem>
                        <SelectItem value="value">Show Value</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createConfig.isPending}>
                {createConfig.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Configuration
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
