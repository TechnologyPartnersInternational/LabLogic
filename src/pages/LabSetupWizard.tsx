import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { labTemplates, type LabTemplate } from '@/data/labTemplates';
import { useReplaceWithTemplate } from '@/hooks/useDepartments';
import { useUpsertLabSetting } from '@/hooks/useLabSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Beaker,
  Fuel,
  Wheat,
  ChevronDown,
  ChevronRight,
  Loader2,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import lablogicLogo from '@/assets/lablogic-logo.png';

const suiteIcons: Record<string, typeof Beaker> = {
  environmental: Beaker,
  petrochemical: Fuel,
  food_beverage: Wheat,
};

const suiteColors: Record<string, string> = {
  environmental: 'border-t-[hsl(var(--accent))]',
  petrochemical: 'border-t-[hsl(var(--warning))]',
  food_beverage: 'border-t-[hsl(var(--success))]',
};

export default function LabSetupWizard() {
  const navigate = useNavigate();
  const replaceWithTemplate = useReplaceWithTemplate();
  const upsertSetting = useUpsertLabSetting();
  const [selectedTemplate, setSelectedTemplate] = useState<LabTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleConfirm = async () => {
    if (!selectedTemplate) return;
    setIsApplying(true);

    try {
      // 1. Replace departments
      await replaceWithTemplate.mutateAsync(selectedTemplate.departments);

      // 2. Upsert lab_type, lab_tagline, lab_accreditation
      await upsertSetting.mutateAsync({ key: 'lab_type', value: selectedTemplate.id });
      await upsertSetting.mutateAsync({ key: 'lab_tagline', value: selectedTemplate.name });
      await upsertSetting.mutateAsync({ key: 'lab_accreditation', value: selectedTemplate.standard });

      toast.success(`Workspace configured as ${selectedTemplate.name}`);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Setup failed:', err);
      toast.error('Failed to configure workspace. Please try again.');
    } finally {
      setIsApplying(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="py-8 px-6 text-center">
        <img src={lablogicLogo} alt="LabLogic" className="h-10 mx-auto mb-6" />
        <div className="flex items-center justify-center gap-3 mb-3">
          <FlaskConical className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">Welcome to LabLogic</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the laboratory suite that best matches your operations. This will configure your
          departments, analyte groups, and workspace layout.
        </p>
      </div>

      {/* Suite Cards */}
      <div className="flex-1 px-6 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {labTemplates.map((template) => {
            const Icon = suiteIcons[template.id] ?? Beaker;
            const borderColor = suiteColors[template.id] ?? '';
            const isExpanded = expandedId === template.id;

            return (
              <Card
                key={template.id}
                className={`relative border-t-4 ${borderColor} hover:shadow-lg transition-shadow flex flex-col`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-muted">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1.5 text-xs">
                        {template.standard}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">{template.description}</p>

                  {/* Department list */}
                  <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : template.id)}>
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {template.departments.length} Departments
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      {template.departments.map((dept) => (
                        <div key={dept.slug} className="bg-muted/50 rounded-md p-3">
                          <p className="text-sm font-medium text-foreground">{dept.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {dept.analyteGroups.map((ag) => (
                              <Badge key={ag.key} variant="outline" className="text-xs font-normal">
                                {ag.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="mt-auto pt-2">
                    <Button
                      className="w-full"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      Select This Suite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedTemplate} onOpenChange={() => !isApplying && setSelectedTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configure Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              This will set up your workspace as a <strong>{selectedTemplate?.name}</strong> with{' '}
              <strong>{selectedTemplate?.departments.length} departments</strong>. You can customize
              departments later from the settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplying}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Configuring...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
