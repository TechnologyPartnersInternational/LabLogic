import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle, FlaskConical, Mail } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import appLogo from '@/assets/lablogic-logo.png';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

const roleLabels: Record<string, string> = {
  wet_chemistry_analyst: 'Wet Chemistry Analyst',
  instrumentation_analyst: 'Instrumentation Analyst',
  microbiology_analyst: 'Microbiology Analyst',
  lab_supervisor: 'Lab Supervisor',
  qa_officer: 'QA Officer',
  admin: 'Administrator',
};

interface OrgInfo { id: string; name: string; slug: string; logo_url: string | null; industry_suite: string | null; }
interface InviteInfo { id: string; email: string; roles: Array<{ role: string; department_id?: string }>; expires_at: string; organization_id: string; }

export default function JoinOrganization() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch org by slug
        if (orgSlug) {
          const { data: orgData } = await supabase.rpc('get_org_by_slug', { _slug: orgSlug });
          if (orgData && orgData.length > 0) setOrg(orgData[0] as OrgInfo);
          else { setError('Organization not found'); setLoading(false); return; }
        }
        // Fetch invitation
        if (token) {
          const { data: invData } = await supabase.rpc('get_invitation_by_token', { _token: token });
          if (invData && invData.length > 0) {
            setInvite(invData[0] as InviteInfo);
          } else {
            setError('This invitation link is invalid or has expired.');
          }
        } else {
          setError('No invitation token provided.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orgSlug, token]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try { passwordSchema.parse(password); } catch { setError('Password must be at least 8 characters'); return; }
    if (!invite || !token) return;

    setIsSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: { data: { full_name: fullName || undefined } },
      });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error('Failed to create account');

      const { data: accepted, error: acceptErr } = await supabase.rpc('accept_invitation', {
        _token: token,
        _user_id: authData.user.id,
      });
      if (acceptErr) throw acceptErr;
      if (!accepted) throw new Error('Failed to accept invitation');

      toast.success('Account created! Welcome to ' + (org?.name || 'the lab'));
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayLogo = org?.logo_url || appLogo;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={displayLogo} alt={org?.name || 'LabLogic'} className="h-20 w-auto mx-auto mb-2 object-contain" />
          {org && <p className="text-sm font-medium text-foreground">{org.name}</p>}
        </div>

        {error && !invite ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/auth')}>Go to Sign In</Button>
            </CardContent>
          </Card>
        ) : invite ? (
          <>
            <Card className="mb-4 border-primary/50 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10"><Mail className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h3 className="font-medium">You've been invited to join {org?.name || 'a laboratory'}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {invite.roles.map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {roleLabels[r.role] || r.role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Complete Your Registration</CardTitle>
                <CardDescription>Create a password to finish setting up your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={invite.email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
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
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Account & Join'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
