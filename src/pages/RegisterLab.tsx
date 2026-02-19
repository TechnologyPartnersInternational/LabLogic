import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Eye, EyeOff, Upload, Check, ArrowRight, ArrowLeft, FlaskConical } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { labTemplates } from '@/data/labTemplates';
import appLogo from '@/assets/lablogic-logo.png';

const emailSchema = z.string().trim().email('Invalid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

export default function RegisterLab() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [labName, setLabName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 3
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  const handleLabNameChange = (val: string) => {
    setLabName(val);
    setSlug(generateSlug(val));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo must be under 2MB');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateStep1 = () => {
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 2) { setError('Name must be at least 2 characters'); return false; }
    try { emailSchema.parse(email); } catch { setError('Invalid email address'); return false; }
    try { passwordSchema.parse(password); } catch { setError('Password must be at least 8 characters'); return false; }
    return true;
  };

  const validateStep2 = () => {
    setError(null);
    if (!labName.trim() || labName.trim().length < 2) { setError('Lab name must be at least 2 characters'); return false; }
    if (!slug || slug.length < 2) { setError('Invalid lab slug'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedSuite) { setError('Please select a laboratory suite'); return; }
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      const userId = authData.user.id;

      // 2. Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('org-logos').upload(filePath, logoFile);
        if (!uploadErr) {
          const { data: publicData } = supabase.storage.from('org-logos').getPublicUrl(filePath);
          logoUrl = publicData.publicUrl;
        }
      }

      // 3. Register organization via RPC
      const template = labTemplates.find(t => t.id === selectedSuite);
      const { data: orgId, error: rpcErr } = await supabase.rpc('register_organization', {
        _user_id: userId,
        _org_name: labName.trim(),
        _org_slug: slug,
        _logo_url: logoUrl,
        _industry_suite: selectedSuite,
        _accreditation: template?.standard || null,
      });
      if (rpcErr) throw rpcErr;

      // 4. Seed departments from the template
      if (template && orgId) {
        const deptRows = template.departments.map((dept, i) => ({
          name: dept.name,
          slug: dept.slug,
          icon: dept.icon,
          analyte_groups: dept.analyteGroups,
          sort_order: i + 1,
          organization_id: orgId,
          created_by: userId,
        }));
        await supabase.from('departments').insert(deptRows as any);

        // Seed lab_type setting
        await supabase.from('lab_settings').insert({
          setting_key: 'lab_type',
          setting_value: selectedSuite,
          organization_id: orgId,
        } as any);
      }

      toast.success('Laboratory registered successfully!');
      // Small delay to let auth session establish
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <img src={appLogo} alt="LabLogic" className="h-20 w-auto mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Register your laboratory</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s ? 'bg-primary text-primary-foreground' : step > s ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {step === 1 ? 'Your Details' : step === 2 ? 'Lab Details' : 'Select Lab Suite'}
            </CardTitle>
            <CardDescription>
              {step === 1 ? 'Create your administrator account' : step === 2 ? 'Set up your laboratory identity' : 'Choose your industry specialization'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="Dr. Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Work Email</Label>
                  <Input type="email" placeholder="jane@lab.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Min. 8 characters</p>
                </div>
                <Button className="w-full" onClick={() => validateStep1() && setStep(2)}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Laboratory Name</Label>
                  <Input placeholder="Acme Environmental Labs" value={labName} onChange={e => handleLabNameChange(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>/join/</span>
                    <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo (optional)</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded border" />
                    ) : (
                      <div className="w-16 h-16 rounded border border-dashed flex items-center justify-center text-muted-foreground">
                        <FlaskConical className="w-6 h-6" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-muted transition-colors">
                        <Upload className="w-4 h-4" /> Upload
                      </div>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="flex-1" onClick={() => validateStep2() && setStep(3)}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {labTemplates.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedSuite(t.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        selectedSuite === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{t.name}</span>
                        <Badge variant="secondary" className="text-xs">{t.standard}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.departments.map(d => (
                          <Badge key={d.slug} variant="outline" className="text-xs">{d.name}</Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting || !selectedSuite}>
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      'Register Laboratory'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{' '}
                <a href="/auth" className="text-primary hover:underline">Sign in</a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
