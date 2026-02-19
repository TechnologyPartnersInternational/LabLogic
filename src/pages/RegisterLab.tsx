import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { labTemplates, type LabTemplate } from '@/data/labTemplates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle, Loader2, Eye, EyeOff, ArrowRight, ArrowLeft,
  Upload, Beaker, Fuel, Wheat, CheckCircle, FlaskConical, Building2,
} from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import appLogo from '@/assets/lablogic-logo.png';

const emailSchema = z.string().trim().email({ message: 'Invalid email address' });
const passwordSchema = z.string().min(8, { message: 'Password must be at least 8 characters' });

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export default function RegisterLab() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: User details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Lab details
  const [labName, setLabName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 3: Suite selection
  const [selectedSuite, setSelectedSuite] = useState<LabTemplate | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return false;
    }
    try { emailSchema.parse(email); } catch (e: any) {
      setError(e.errors?.[0]?.message || 'Invalid email');
      return false;
    }
    try { passwordSchema.parse(password); } catch (e: any) {
      setError(e.errors?.[0]?.message || 'Invalid password');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setError(null);
    if (!labName.trim() || labName.trim().length < 2) {
      setError('Lab name must be at least 2 characters');
      return false;
    }
    if (!slug.trim() || slug.trim().length < 2) {
      setError('URL slug must be at least 2 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedSuite) {
      setError('Please select a laboratory suite');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create account');

      const userId = authData.user.id;

      // 2. Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `${slug}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('org-logos')
          .upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('org-logos').getPublicUrl(path);
          logoUrl = urlData.publicUrl;
        }
      }

      // 3. Create org, link profile, assign admin role (atomic RPC)
      const { data: orgId, error: regError } = await supabase.rpc('register_organization', {
        _user_id: userId,
        _org_name: labName,
        _org_slug: slug,
        _logo_url: logoUrl,
        _industry_suite: selectedSuite.id,
        _accreditation: selectedSuite.standard,
      });
      if (regError) throw regError;

      // 4. Seed departments for the chosen suite
      const deptRows = selectedSuite.departments.map((dept, i) => ({
        name: dept.name,
        slug: dept.slug,
        icon: dept.icon,
        analyte_groups: dept.analyteGroups,
        sort_order: i + 1,
        organization_id: orgId,
        created_by: userId,
      }));
      const { error: deptError } = await supabase
        .from('departments' as any)
        .insert(deptRows as any);
      if (deptError) console.error('Dept seeding error:', deptError);

      // 5. Seed lab_settings
      const settings = [
        { setting_key: 'lab_type', setting_value: selectedSuite.id, organization_id: orgId },
        { setting_key: 'lab_tagline', setting_value: selectedSuite.name, organization_id: orgId },
        { setting_key: 'lab_accreditation', setting_value: selectedSuite.standard, organization_id: orgId },
        { setting_key: 'lab_name', setting_value: labName, organization_id: orgId },
      ];
      await supabase.from('lab_settings').insert(settings as any);

      toast.success('Laboratory registered successfully!');
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.message?.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.message?.includes('duplicate key') && err.message?.includes('slug')) {
        setError('This URL slug is already taken. Please choose another.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src={appLogo} alt="LabLogic" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Register Your Laboratory</h1>
          <p className="text-muted-foreground mt-1">Set up your lab in 3 simple steps</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span className={step >= 1 ? 'text-primary font-medium' : ''}>1. Your Account</span>
            <span className={step >= 2 ? 'text-primary font-medium' : ''}>2. Lab Details</span>
            <span className={step >= 3 ? 'text-primary font-medium' : ''}>3. Lab Suite</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: User Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. Jane Smith" autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@yourlab.com" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                </div>
                <Button className="w-full" onClick={handleNext}>
                  Next: Lab Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Lab Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="labName">Laboratory Name</Label>
                  <Input
                    id="labName" value={labName}
                    onChange={e => {
                      setLabName(e.target.value);
                      setSlug(generateSlug(e.target.value));
                    }}
                    placeholder="Acme Environmental Labs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/join/</span>
                    <Input id="slug" value={slug} onChange={e => setSlug(generateSlug(e.target.value))} placeholder="acme-labs" />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for invite links: /join/{slug || 'your-lab'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Lab Logo (optional)</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-lg object-contain border border-border bg-card" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Upload className="h-4 w-4" /> Upload Logo
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Next: Choose Suite <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Suite Selection */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the laboratory suite that matches your operations. This configures your departments and workflows.
                </p>
                <div className="grid gap-3">
                  {labTemplates.map(template => {
                    const Icon = suiteIcons[template.id] ?? Beaker;
                    const isSelected = selectedSuite?.id === template.id;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedSuite(template)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{template.name}</span>
                              {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                            </div>
                            <Badge variant="secondary" className="mt-1 text-xs">{template.standard}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.departments.map(d => (
                                <Badge key={d.slug} variant="outline" className="text-xs">{d.name}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={!selectedSuite || isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Lab...</>
                    ) : (
                      <><FlaskConical className="mr-2 h-4 w-4" /> Create Laboratory</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button onClick={() => navigate('/auth')} className="text-primary hover:underline font-medium">
            Sign In
          </button>
        </p>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by Technology Partners International (TPI)
        </p>
      </div>
    </div>
  );
}
