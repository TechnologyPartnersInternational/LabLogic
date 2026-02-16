import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  LayoutGrid, Plus, Pencil, Trash2, Loader2, GripVertical, LayoutTemplate,
  FlaskConical, Microscope, Activity, Package, Gauge, Pill, Wheat, Eye,
  Fuel, Droplets, Droplet, Flame, Mountain, Settings, Leaf, Beaker,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment,
  type Department,
} from '@/hooks/useDepartments';
import { LabTemplateSelector } from '@/components/config/LabTemplateSelector';

const iconOptions = [
  { value: 'beaker', label: 'Beaker', Icon: Beaker },
  { value: 'flask-conical', label: 'Flask', Icon: FlaskConical },
  { value: 'activity', label: 'Activity', Icon: Activity },
  { value: 'microscope', label: 'Microscope', Icon: Microscope },
  { value: 'package', label: 'Package', Icon: Package },
  { value: 'gauge', label: 'Gauge', Icon: Gauge },
  { value: 'pill', label: 'Pill', Icon: Pill },
  { value: 'wheat', label: 'Wheat', Icon: Wheat },
  { value: 'eye', label: 'Eye', Icon: Eye },
  { value: 'fuel', label: 'Fuel', Icon: Fuel },
  { value: 'droplets', label: 'Droplets', Icon: Droplets },
  { value: 'droplet', label: 'Droplet', Icon: Droplet },
  { value: 'flame', label: 'Flame', Icon: Flame },
  { value: 'mountain', label: 'Mountain', Icon: Mountain },
  { value: 'settings', label: 'Settings', Icon: Settings },
  { value: 'leaf', label: 'Leaf', Icon: Leaf },
];

const iconMap: Record<string, React.ElementType> = Object.fromEntries(
  iconOptions.map(o => [o.value, o.Icon])
);

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function DepartmentManagement() {
  const { data: departments, isLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const [showForm, setShowForm] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('beaker');
  const [formGroups, setFormGroups] = useState('');

  const openCreate = () => {
    setEditingDept(null);
    setFormName('');
    setFormIcon('beaker');
    setFormGroups('');
    setShowForm(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormIcon(dept.icon);
    setFormGroups(dept.analyte_groups.map(g => g.label).join(', '));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Department name is required');
      return;
    }

    const analyteGroups = formGroups
      .split(',')
      .map(g => g.trim())
      .filter(Boolean)
      .map(label => ({
        key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        label,
      }));

    try {
      if (editingDept) {
        await updateDept.mutateAsync({
          id: editingDept.id,
          name: formName.trim(),
          icon: formIcon,
          slug: generateSlug(formName),
          analyte_groups: analyteGroups,
        });
        toast.success('Department updated');
      } else {
        const maxOrder = Math.max(0, ...(departments?.map(d => d.sort_order) || [0]));
        await createDept.mutateAsync({
          name: formName.trim(),
          slug: generateSlug(formName),
          icon: formIcon,
          analyte_groups: analyteGroups,
          sort_order: maxOrder + 1,
        });
        toast.success('Department created');
      }
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Delete "${dept.name}"? This cannot be undone.`)) return;
    try {
      await deleteDept.mutateAsync(dept.id);
      toast.success('Department deleted');
    } catch (error: any) {
      toast.error('Cannot delete: ' + error.message);
    }
  };

  // Show template selector if no departments exist
  const isEmpty = !isLoading && (!departments || departments.length === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Department Management</h1>
          <p className="text-muted-foreground">Configure laboratory departments and analyte groups</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplate(true)}>
            <LayoutTemplate className="w-4 h-4 mr-2" />
            Load Template
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="p-12 text-center">
            <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No departments configured</h3>
            <p className="text-muted-foreground mb-6">
              Choose an industry template to get started quickly, or create departments manually.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setShowTemplate(true)}>
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Choose a Template
              </Button>
              <Button variant="outline" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Departments
            </CardTitle>
            <CardDescription>{departments?.length || 0} department(s) configured</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Analyte Groups</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments?.map(dept => {
                    const Icon = iconMap[dept.icon] || FlaskConical;
                    return (
                      <TableRow key={dept.id}>
                        <TableCell>
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="font-medium">{dept.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{dept.slug}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dept.analyte_groups.map(g => (
                              <Badge key={g.key} variant="secondary" className="text-[10px]">
                                {g.label}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(dept)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(dept)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
            <DialogDescription>
              {editingDept ? 'Update department details' : 'Create a new laboratory department'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Wet Chemistry" />
              {formName && (
                <p className="text-xs text-muted-foreground">Slug: <code>{generateSlug(formName)}</code></p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formIcon} onValueChange={setFormIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.Icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Analyte Groups</Label>
              <Input
                value={formGroups}
                onChange={e => setFormGroups(e.target.value)}
                placeholder="e.g. Heavy Metals, Hydrocarbons, Organics"
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of analyte group names</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createDept.isPending || updateDept.isPending}>
              {(createDept.isPending || updateDept.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingDept ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selector */}
      <LabTemplateSelector open={showTemplate} onOpenChange={setShowTemplate} />
    </div>
  );
}
