import { useEffect } from 'react';
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
import { useUpdateParameter } from '@/hooks/useParameters';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ChemicalFormula } from '@/components/ui/chemical-formula';
import { Database } from '@/integrations/supabase/types';

type Parameter = Database['public']['Tables']['parameters']['Row'];

const parameterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  abbreviation: z.string().min(1, 'Abbreviation is required').max(20),
  lab_section: z.enum(['wet_chemistry', 'instrumentation', 'microbiology']),
  analyte_group: z.string().min(1, 'Analyte group is required').max(50),
  result_type: z.enum(['numeric', 'presence_absence', 'mpn', 'cfu', 'text']),
  cas_number: z.string().max(50).optional(),
});

type ParameterFormData = z.infer<typeof parameterSchema>;

interface EditParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameter: Parameter | null;
}

export function EditParameterDialog({ open, onOpenChange, parameter }: EditParameterDialogProps) {
  const updateParameter = useUpdateParameter();
  
  const form = useForm<ParameterFormData>({
    resolver: zodResolver(parameterSchema),
    defaultValues: {
      name: '',
      abbreviation: '',
      lab_section: 'wet_chemistry',
      analyte_group: '',
      result_type: 'numeric',
      cas_number: '',
    },
  });

  // Reset form with parameter data when parameter changes
  useEffect(() => {
    if (parameter) {
      form.reset({
        name: parameter.name,
        abbreviation: parameter.abbreviation,
        lab_section: parameter.lab_section as 'wet_chemistry' | 'instrumentation' | 'microbiology',
        analyte_group: parameter.analyte_group,
        result_type: parameter.result_type as 'numeric' | 'presence_absence' | 'mpn' | 'cfu' | 'text',
        cas_number: parameter.cas_number || '',
      });
    }
  }, [parameter, form]);

  const onSubmit = async (data: ParameterFormData) => {
    if (!parameter) return;
    
    try {
      await updateParameter.mutateAsync({
        id: parameter.id,
        name: data.name,
        abbreviation: data.abbreviation,
        lab_section: data.lab_section,
        analyte_group: data.analyte_group,
        result_type: data.result_type,
        cas_number: data.cas_number || null,
      });
      toast.success('Parameter updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update parameter');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Parameter</DialogTitle>
          <DialogDescription>
            Modify the analytical parameter details.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parameter Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Total Nitrogen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abbreviation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., NH3, SO4, PO4^3-" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Preview: <ChemicalFormula formula={field.value || 'NH3'} className="font-medium" />
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lab_section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Section</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wet_chemistry">Wet Chemistry</SelectItem>
                        <SelectItem value="instrumentation">Instrumentation</SelectItem>
                        <SelectItem value="microbiology">Microbiology</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="analyte_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analyte Group</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Nutrients" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="result_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="numeric">Numeric</SelectItem>
                        <SelectItem value="presence_absence">Presence/Absence</SelectItem>
                        <SelectItem value="mpn">MPN</SelectItem>
                        <SelectItem value="cfu">CFU</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cas_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CAS Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 7727-37-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateParameter.isPending}>
                {updateParameter.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
