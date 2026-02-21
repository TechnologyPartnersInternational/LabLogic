import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { labTemplates, type LabTemplate } from '@/data/labTemplates';
import { useReplaceWithTemplate } from '@/hooks/useDepartments';
import { useUpsertLabSetting } from '@/hooks/useLabSettings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import {
  Beaker,
  Fuel,
  Wheat,
  Loader2,
  FlaskConical,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Users,
  Shield,
  BarChart3,
  FileCheck,
  ClipboardList,
  Microscope,
  Settings,
  Sparkles,
  Globe,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import lablogicLogo from '@/assets/lablogic-logo.png';

const suiteIcons: Record<string, typeof Beaker> = {
  environmental: Beaker,
  petrochemical: Fuel,
  food_beverage: Wheat,
};

const suiteColors: Record<string, string> = {
  environmental: 'border-accent bg-accent/5',
  petrochemical: 'border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/5',
  food_beverage: 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/5',
};

const suiteIconBg: Record<string, string> = {
  environmental: 'bg-accent/10 text-accent',
  petrochemical: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
  food_beverage: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
};

const STEPS = [
  { label: 'Welcome', icon: Sparkles },
  { label: 'Industry', icon: Building2 },
  { label: 'Details', icon: Settings },
  { label: 'Review', icon: CheckCircle2 },
];

const FEATURES = [
  { icon: ClipboardList, title: 'Project & Sample Tracking', desc: 'Chain-of-custody workflows from receipt to release' },
  { icon: Microscope, title: 'Results Entry & Validation', desc: 'Department-scoped grids with scientific validation' },
  { icon: FileCheck, title: 'Multi-tier Review & Approval', desc: 'Supervisor → QA Officer approval pipeline' },
  { icon: BarChart3, title: 'Dashboard & Analytics', desc: 'Real-time lab performance and turnaround metrics' },
  { icon: Users, title: 'Role-Based Access Control', desc: 'Analyst, Supervisor, QA Officer, and Admin roles' },
  { icon: Shield, title: 'Compliance & Audit Trail', desc: 'Full traceability with tamper-proof audit logs' },
];

export default function LabSetupWizard() {
  const navigate = useNavigate();
  const replaceWithTemplate = useReplaceWithTemplate();
  const upsertSetting = useUpsertLabSetting();

  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<LabTemplate | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Step 3 - Details
  const [labTagline, setLabTagline] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [labPhone, setLabPhone] = useState('');
  const [labEmail, setLabEmail] = useState('');

  const canProceed = () => {
    if (step === 1) return !!selectedTemplate;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleConfirm = async () => {
    if (!selectedTemplate) return;
    setIsApplying(true);

    try {
      await replaceWithTemplate.mutateAsync(selectedTemplate.departments);

      await upsertSetting.mutateAsync({ key: 'lab_type', value: selectedTemplate.id });
      await upsertSetting.mutateAsync({ key: 'lab_tagline', value: labTagline || selectedTemplate.name });
      await upsertSetting.mutateAsync({ key: 'lab_accreditation', value: selectedTemplate.standard });
      if (labAddress) await upsertSetting.mutateAsync({ key: 'lab_address', value: labAddress });
      if (labPhone) await upsertSetting.mutateAsync({ key: 'lab_phone', value: labPhone });
      if (labEmail) await upsertSetting.mutateAsync({ key: 'lab_email', value: labEmail });

      toast.success(`Workspace configured as ${selectedTemplate.name}`);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Setup failed:', err);
      toast.error('Failed to configure workspace. Please try again.');
    } finally {
      setIsApplying(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={lablogicLogo} alt="LabLogic" className="h-8" />
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm font-medium text-muted-foreground">Workspace Setup</span>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center gap-1.5">
                <button
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                        ? 'bg-accent/10 text-accent cursor-pointer hover:bg-accent/20'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${i < step ? 'bg-accent' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-5">
                  <FlaskConical className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  Welcome to LabLogic
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Your laboratory information management system is ready to be configured.
                  This wizard will set up your workspace in just a few steps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <Card key={f.title} className="border border-border hover:border-accent/30 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted shrink-0">
                            <Icon className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="bg-muted/50 rounded-xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                    <Lock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Multi-Tenant & Secure</h3>
                    <p className="text-sm text-muted-foreground">
                      Your data is completely isolated within your organization. Row-level security ensures
                      only authorized team members can access your laboratory data. All actions are logged
                      in an immutable audit trail for regulatory compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Industry Suite */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Your Industry</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Choose the laboratory suite that matches your operations. This pre-configures
                  departments, analyte groups, and regulatory standards.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {labTemplates.map((template) => {
                  const Icon = suiteIcons[template.id] ?? Beaker;
                  const colorClass = suiteColors[template.id] ?? '';
                  const iconBg = suiteIconBg[template.id] ?? '';
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`text-left rounded-xl border-2 p-0 transition-all ${
                        isSelected
                          ? `${colorClass} ring-2 ring-offset-2 ring-accent shadow-lg`
                          : 'border-border bg-card hover:border-accent/40 hover:shadow-md'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-3 rounded-xl ${iconBg}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{template.name}</h3>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {template.standard}
                            </Badge>
                          </div>
                          {isSelected && (
                            <div className="ml-auto">
                              <CheckCircle2 className="w-6 h-6 text-accent" />
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

                        <Separator className="mb-4" />

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                            {template.departments.length} Departments
                          </div>
                          {template.departments.map((dept) => (
                            <div key={dept.slug} className="pl-5">
                              <p className="text-xs font-medium text-foreground mb-1">{dept.name}</p>
                              <div className="flex flex-wrap gap-1">
                                {dept.analyteGroups.map((ag) => (
                                  <Badge key={ag.key} variant="outline" className="text-[10px] font-normal py-0">
                                    {ag.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Regulatory: {template.standard}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>{template.departments.reduce((sum, d) => sum + d.analyteGroups.length, 0)} Analyte Groups</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Lab Details */}
          {step === 2 && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Customize Your Lab</h2>
                <p className="text-muted-foreground">
                  Add optional details to personalize your workspace. You can update these later in settings.
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Lab Tagline / Subtitle</Label>
                    <Input
                      id="tagline"
                      placeholder={selectedTemplate?.name || 'e.g. Precision Environmental Testing'}
                      value={labTagline}
                      onChange={(e) => setLabTagline(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Appears on reports and the sidebar</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Lab Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Science Park Blvd"
                        value={labAddress}
                        onChange={(e) => setLabAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={labPhone}
                        onChange={(e) => setLabPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Lab Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="lab@yourdomain.com"
                      value={labEmail}
                      onChange={(e) => setLabEmail(e.target.value)}
                    />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Tip:</strong> These details will be used on
                      Certificates of Analysis (COA) and other exported reports. You can always
                      update them from <span className="font-medium text-foreground">Admin → Lab Settings</span>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && selectedTemplate && (
            <div className="animate-fade-in max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Review & Confirm</h2>
                <p className="text-muted-foreground">
                  Review your workspace configuration before applying.
                </p>
              </div>

              <div className="space-y-5">
                {/* Industry Suite */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-accent" />
                        Industry Suite
                      </h3>
                      <button onClick={() => setStep(1)} className="text-xs text-accent hover:underline">
                        Change
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = suiteIcons[selectedTemplate.id] ?? Beaker;
                        const iconBg = suiteIconBg[selectedTemplate.id] ?? '';
                        return (
                          <div className={`p-2.5 rounded-lg ${iconBg}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        );
                      })()}
                      <div>
                        <p className="font-medium text-foreground">{selectedTemplate.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedTemplate.standard}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Departments */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                      <Layers className="w-4 h-4 text-accent" />
                      Departments ({selectedTemplate.departments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedTemplate.departments.map((dept) => (
                        <div key={dept.slug} className="bg-muted/50 rounded-lg p-3 border border-border">
                          <p className="text-sm font-medium text-foreground mb-1.5">{dept.name}</p>
                          <div className="flex flex-wrap gap-1">
                            {dept.analyteGroups.map((ag) => (
                              <Badge key={ag.key} variant="outline" className="text-[10px] font-normal py-0">
                                {ag.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Lab Details */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Settings className="w-4 h-4 text-accent" />
                        Lab Details
                      </h3>
                      <button onClick={() => setStep(2)} className="text-xs text-accent hover:underline">
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tagline</span>
                        <p className="font-medium text-foreground">{labTagline || selectedTemplate.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Accreditation</span>
                        <p className="font-medium text-foreground">{selectedTemplate.standard}</p>
                      </div>
                      {labAddress && (
                        <div>
                          <span className="text-muted-foreground">Address</span>
                          <p className="font-medium text-foreground">{labAddress}</p>
                        </div>
                      )}
                      {labPhone && (
                        <div>
                          <span className="text-muted-foreground">Phone</span>
                          <p className="font-medium text-foreground">{labPhone}</p>
                        </div>
                      )}
                      {labEmail && (
                        <div>
                          <span className="text-muted-foreground">Email</span>
                          <p className="font-medium text-foreground">{labEmail}</p>
                        </div>
                      )}
                      {!labAddress && !labPhone && !labEmail && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground italic">No additional details provided — you can add them later in settings.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* What happens next */}
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    What happens next
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Your departments and analyte groups will be created',
                      'Lab settings and accreditation info will be saved',
                      'You\'ll be redirected to your dashboard',
                      'You can invite team members and start creating projects',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            className={step === 0 ? 'invisible' : ''}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </div>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => setShowConfirm(true)} disabled={!selectedTemplate}>
              Configure Workspace
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={() => !isApplying && setShowConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configure Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              This will set up your workspace as a <strong>{selectedTemplate?.name}</strong> with{' '}
              <strong>{selectedTemplate?.departments.length} departments</strong> and{' '}
              <strong>{selectedTemplate?.departments.reduce((s, d) => s + d.analyteGroups.length, 0)} analyte groups</strong>.
              You can customize everything later from settings.
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
                'Confirm & Launch'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
