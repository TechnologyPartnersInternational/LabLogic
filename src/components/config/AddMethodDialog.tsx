import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateMethod } from '@/hooks/useMethods';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const methodSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  organization: z.enum(['APHA', 'ASTM', 'EPA', 'ISO', 'Internal']),
  description: z.string().max(500).optional(),
});

type MethodFormData = z.infer<typeof methodSchema>;

interface AddMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMethodDialog({ open, onOpenChange }: AddMethodDialogProps) {
  const createMethod = useCreateMethod();
  
  const form = useForm<MethodFormData>({
    resolver: zodResolver(methodSchema),
    defaultValues: {
      code: '',
      name: '',
      organization: 'APHA',
      description: '',
    },
  });

  const onSubmit = async (data: MethodFormData) => {
    try {
      await createMethod.mutateAsync({
        code: data.code,
        name: data.name,
        organization: data.organization,
        description: data.description || null,
      });
      toast.success('Method created successfully');
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create method');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Method</DialogTitle>
          <DialogDescription>
            Define a standard analytical method from APHA, EPA, ASTM, ISO, or an internal method.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., APHA-4500-H+" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., pH Value - Electrometric Method" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="APHA">APHA (American Public Health Association)</SelectItem>
                      <SelectItem value="EPA">EPA (Environmental Protection Agency)</SelectItem>
                      <SelectItem value="ASTM">ASTM International</SelectItem>
                      <SelectItem value="ISO">ISO (International Organization)</SelectItem>
                      <SelectItem value="Internal">Internal Method</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the method..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMethod.isPending}>
                {createMethod.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Method
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
