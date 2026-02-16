import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Loader2, FlaskConical, Microscope, Activity, Package, Gauge, Pill, Wheat, Eye, Fuel, Droplets, Droplet, Flame, Mountain, Settings, Leaf, LayoutGrid } from 'lucide-react';
import { labTemplates, type LabTemplate } from '@/data/labTemplates';
import { useApplyTemplate } from '@/hooks/useDepartments';
import { toast } from 'sonner';

const iconMap: Record<string, React.ElementType> = {
  beaker: FlaskConical,
  activity: Activity,
  microscope: Microscope,
  package: Package,
  gauge: Gauge,
  pill: Pill,
  wheat: Wheat,
  'flask-conical': FlaskConical,
  eye: Eye,
  fuel: Fuel,
  droplets: Droplets,
  droplet: Droplet,
  flame: Flame,
  mountain: Mountain,
  settings: Settings,
  leaf: Leaf,
};

interface LabTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
}

export function LabTemplateSelector({ open, onOpenChange, onApplied }: LabTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<LabTemplate | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const applyTemplate = useApplyTemplate();

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelect = (template: LabTemplate) => {
    if (template.id === 'custom') {
      onOpenChange(false);
      return;
    }
    setSelectedTemplate(template);
    setShowConfirm(true);
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;
    try {
      await applyTemplate.mutateAsync(selectedTemplate.departments);
      toast.success(`Applied "${selectedTemplate.name}" template with ${selectedTemplate.departments.length} departments`);
      setShowConfirm(false);
      onOpenChange(false);
      onApplied?.();
    } catch (error: any) {
      toast.error('Failed to apply template: ' + error.message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Choose a Laboratory Template
            </DialogTitle>
            <DialogDescription>
              Select an industry template to pre-populate your department structure. You can customize departments after setup.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            {labTemplates.map(template => {
              const isExpanded = expandedCards.has(template.id);
              return (
                <Card key={template.id} className="relative hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-[10px]">{template.standard}</Badge>
                      </div>
                    </div>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {template.departments.length > 0 && (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(template.id)}>
                        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {template.departments.length} departments
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {template.departments.map(dept => {
                            const Icon = iconMap[dept.icon] || FlaskConical;
                            return (
                              <div key={dept.slug} className="pl-2 border-l-2 border-muted">
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                  <Icon className="w-3.5 h-3.5 text-primary" />
                                  {dept.name}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {dept.analyteGroups.map(g => (
                                    <Badge key={g.key} variant="secondary" className="text-[10px] py-0">
                                      {g.label}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    <Button
                      size="sm"
                      variant={template.id === 'custom' ? 'outline' : 'default'}
                      className="w-full"
                      onClick={() => handleSelect(template)}
                    >
                      {template.id === 'custom' ? 'Start Blank' : 'Use This Template'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add {selectedTemplate?.departments.length} department(s) from the "{selectedTemplate?.name}" template. 
              Existing departments will not be removed. You can customize everything after setup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply} disabled={applyTemplate.isPending}>
              {applyTemplate.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying...</>
              ) : (
                'Apply Template'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
