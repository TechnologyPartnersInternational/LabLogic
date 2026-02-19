import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useCreateProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Plus, Zap, ClipboardList } from 'lucide-react';

const quickProjectSchema = z.object({
  code: z.string().min(3, 'Project code must be at least 3 characters').max(50),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  client_id: z.string().uuid('Please select a client'),
  location: z.string().max(200).optional(),
});

const regulatoryPrograms = [
  { value: 'nuprc', label: 'NUPRC' },
  { value: 'nmdpra', label: 'NMDPRA' },
  { value: 'nosdra', label: 'NOSDRA' },
  { value: 'fmenv', label: 'FMEnv' },
  { value: 'ifc', label: 'IFC' },
];

const tatOptions = [
  { value: '24h', label: '24 Hours' },
  { value: '48h', label: '48 Hours' },
  { value: '72h', label: '72 Hours' },
  { value: '5d', label: '5 Days' },
  { value: '7d', label: '7 Days' },
  { value: '10d', label: '10 Days' },
  { value: '14d', label: '14 Days' },
  { value: '21d', label: '21 Days' },
  { value: '30d', label: '30 Days' },
];

const fullProjectSchema = quickProjectSchema.extend({
  sample_collection_date: z.string().optional(),
  sample_receipt_date: z.string().optional(),
  notes: z.string().max(1000).optional(),
  // COC Fields
  sampler_name: z.string().max(100).optional(),
  sampler_company: z.string().max(100).optional(),
  tat: z.string().optional(),
  regulatory_programs: z.array(z.string()).optional(),
  special_instructions: z.string().max(2000).optional(),
  receipt_discrepancies: z.string().max(2000).optional(),
  relinquished_by: z.string().max(100).optional(),
  received_by: z.string().max(100).optional(),
});

const newClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  contact_name: z.string().max(100).optional(),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

type QuickProjectFormData = z.infer<typeof quickProjectSchema>;
type FullProjectFormData = z.infer<typeof fullProjectSchema>;
type NewClientFormData = z.infer<typeof newClientSchema>;

export default function CreateProject() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [showNewClient, setShowNewClient] = useState(false);
  
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const createProject = useCreateProject();
  const createClient = useCreateClient();
  const { organizationId } = useAuth();

  const quickForm = useForm<QuickProjectFormData>({
    resolver: zodResolver(quickProjectSchema),
    defaultValues: {
      code: '',
      title: '',
      client_id: '',
      location: '',
    },
  });

  const fullForm = useForm<FullProjectFormData>({
    resolver: zodResolver(fullProjectSchema),
    defaultValues: {
      code: '',
      title: '',
      client_id: '',
      location: '',
      sample_collection_date: '',
      sample_receipt_date: '',
      notes: '',
      sampler_name: '',
      sampler_company: '',
      tat: '',
      regulatory_programs: [],
      special_instructions: '',
      receipt_discrepancies: '',
      relinquished_by: '',
      received_by: '',
    },
  });

  const clientForm = useForm<NewClientFormData>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const onSubmitQuick = async (data: QuickProjectFormData) => {
    try {
      const project = await createProject.mutateAsync({
        code: data.code,
        title: data.title,
        client_id: data.client_id,
        location: data.location || null,
        status: 'active',
        organization_id: organizationId,
      });
      toast.success('Project created successfully');
      navigate(`/projects/${project.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    }
  };

  const onSubmitFull = async (data: FullProjectFormData) => {
    try {
      const project = await createProject.mutateAsync({
        code: data.code,
        title: data.title,
        client_id: data.client_id,
        location: data.location || null,
        sample_collection_date: data.sample_collection_date || null,
        sample_receipt_date: data.sample_receipt_date || null,
        notes: data.notes || null,
        status: 'active',
        organization_id: organizationId,
        // COC fields
        sampler_name: data.sampler_name || null,
        sampler_company: data.sampler_company || null,
        tat: data.tat || null,
        regulatory_program: data.regulatory_programs?.length ? data.regulatory_programs.join(',') : null,
        special_instructions: data.special_instructions || null,
        receipt_discrepancies: data.receipt_discrepancies || null,
        relinquished_by: data.relinquished_by || null,
        received_by: data.received_by || null,
      });
      toast.success('Project created successfully');
      navigate(`/projects/${project.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    }
  };

  const onSubmitClient = async (data: NewClientFormData) => {
    try {
      const client = await createClient.mutateAsync({
        name: data.name,
        contact_name: data.contact_name || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        organization_id: organizationId,
      });
      toast.success('Client created successfully');
      
      // Set the new client in both forms
      quickForm.setValue('client_id', client.id);
      fullForm.setValue('client_id', client.id);
      
      setShowNewClient(false);
      clientForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create client');
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'quick' | 'full')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Create
            </TabsTrigger>
            <TabsTrigger value="full" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Full Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <Card>
              <CardHeader>
                <CardTitle>Quick Project Setup</CardTitle>
                <CardDescription>
                  Create a project with minimal information. You can add more details later.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...quickForm}>
                  <form onSubmit={quickForm.handleSubmit(onSubmitQuick)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={quickForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Code</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., TPI/2026/CLIENT/001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={quickForm.control}
                        name="client_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client</FormLabel>
                            <div className="flex gap-2">
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select client" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                onClick={() => setShowNewClient(true)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={quickForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Environmental Baseline Study - Lagos Facility" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={quickForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Lagos, Nigeria" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProject.isPending}>
                        {createProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Project
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="full">
            <Card>
              <CardHeader>
                <CardTitle>Full Project Details</CardTitle>
                <CardDescription>
                  Enter complete project information including sample dates and notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...fullForm}>
                  <form onSubmit={fullForm.handleSubmit(onSubmitFull)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={fullForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Code</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., TPI/2026/CLIENT/001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fullForm.control}
                        name="client_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client</FormLabel>
                            <div className="flex gap-2">
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select client" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                onClick={() => setShowNewClient(true)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={fullForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Environmental Baseline Study - Lagos Facility" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={fullForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Lagos, Nigeria" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={fullForm.control}
                        name="sample_collection_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sample Collection Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fullForm.control}
                        name="sample_receipt_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sample Receipt Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* COC Section */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-semibold mb-4">Chain of Custody Information</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={fullForm.control}
                          name="sampler_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sampler Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Name of person who collected samples" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={fullForm.control}
                          name="sampler_company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sampler Company</FormLabel>
                              <FormControl>
                                <Input placeholder="Company/organization of sampler" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={fullForm.control}
                          name="regulatory_programs"
                          render={() => (
                            <FormItem>
                              <FormLabel>Regulatory Programs</FormLabel>
                              <FormDescription className="text-xs">
                                Select all applicable regulatory bodies
                              </FormDescription>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {regulatoryPrograms.map((prog) => (
                                  <FormField
                                    key={prog.value}
                                    control={fullForm.control}
                                    name="regulatory_programs"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={prog.value}
                                          className="flex flex-row items-center space-x-2 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(prog.value)}
                                              onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                return checked
                                                  ? field.onChange([...currentValues, prog.value])
                                                  : field.onChange(
                                                      currentValues.filter(
                                                        (value) => value !== prog.value
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal cursor-pointer">
                                            {prog.label}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={fullForm.control}
                          name="tat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Turn-Around-Time (TAT)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select TAT" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {tatOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={fullForm.control}
                          name="relinquished_by"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relinquished By</FormLabel>
                              <FormControl>
                                <Input placeholder="Person who handed over samples" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={fullForm.control}
                          name="received_by"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Received By</FormLabel>
                              <FormControl>
                                <Input placeholder="Lab personnel who received samples" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={fullForm.control}
                        name="special_instructions"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Special Instructions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any special handling or analysis instructions..."
                                className="resize-none"
                                rows={2}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fullForm.control}
                        name="receipt_discrepancies"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Receipt Discrepancies</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Note any issues observed during sample receipt (broken seals, incorrect temperatures, missing samples, etc.)..."
                                className="resize-none"
                                rows={2}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={fullForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional project notes..."
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
                      <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProject.isPending}>
                        {createProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Project
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* New Client Dialog */}
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client to associate with this project.
            </DialogDescription>
          </DialogHeader>
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(onSubmitClient)} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Shell Nigeria Ltd" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={clientForm.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={clientForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+234..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Company address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowNewClient(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createClient.isPending}>
                  {createClient.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Client
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
