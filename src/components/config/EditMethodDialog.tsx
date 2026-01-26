import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useUpdateMethod } from '@/hooks/useMethods';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Method = Database['public']['Tables']['methods']['Row'];

const formSchema = z.object({
  code: z.string().trim().min(1, 'Method code is required').max(50, 'Code must be less than 50 characters'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200, 'Name must be less than 200 characters'),
  organization: z.enum(['APHA', 'EPA', 'ASTM', 'ISO', 'Internal']),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMethodDialogProps {
  method: Method | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMethodDialog({ method, open, onOpenChange }: EditMethodDialogProps) {
  const updateMethod = useUpdateMethod();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      organization: 'APHA',
      description: '',
    },
  });

  useEffect(() => {
    if (method && open) {
      form.reset({
        code: method.code,
        name: method.name,
        organization: method.organization as FormValues['organization'],
        description: method.description || '',
      });
    }
  }, [method, open, form]);

  const onSubmit = async (values: FormValues) => {
    if (!method) return;

    try {
      await updateMethod.mutateAsync({
        id: method.id,
        code: values.code,
        name: values.name,
        organization: values.organization,
        description: values.description || null,
      });
      toast.success('Method updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update method:', error);
      toast.error('Failed to update method');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Method</DialogTitle>
          <DialogDescription>
            Update the analytical method details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., APHA-4500" {...field} />
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
                        <SelectItem value="APHA">APHA</SelectItem>
                        <SelectItem value="EPA">EPA</SelectItem>
                        <SelectItem value="ASTM">ASTM</SelectItem>
                        <SelectItem value="ISO">ISO</SelectItem>
                        <SelectItem value="Internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Nitrogen (Nitrate)" {...field} />
                  </FormControl>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMethod.isPending}>
                {updateMethod.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
