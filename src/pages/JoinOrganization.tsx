import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle, Mail, Building2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import appLogo from '@/assets/lablogic-logo.png';

const passwordSchema = z.string().min(8, { message: 'Password must be at least 8 characters' });

const roleLabels: Record<string, string> = {
  wet_chemistry_analyst: 'Analyst',
  instrumentation_analyst: 'Analyst',
  microbiology_analyst: 'Analyst',
  lab_supervisor: 'Lab Supervisor',
  qa_officer: 'QA Officer',
  admin: 'Administrator',
};

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry_suite: string | null;
}

interface InvitationData {
  id: string;
  email: string;
  roles: Array<{ role: string; lab_section?: string; department_id?: string }>;
  expires_at: string;
  organization_id: string;
}

export default function JoinOrganization() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  const token = searchParams.get('token');

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) navigate('/', { replace: true });
  }, [user, authLoading, navigate]);

  // Fetch org by slug
  useEffect(() => {
    if (!orgSlug) return;
    (async () => {
      setLoadingOrg(true);
      const { data, error } = await supabase.rpc('get_org_by_slug', { _slug: orgSlug });
      if (error || !data || data.length === 0) {
        setError('Organization not found.');
      } else {
        setOrg(data[0] as unknown as OrgInfo);
      }
      setLoadingOrg(false);
    })();
  }, [orgSlug]);

  // Fetch invitation
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoadingInvite(true);
      const { data, error } = await supabase.rpc('get_invitation_by_token', { _token: token });
      if (error || !data || data.length === 0) {
        setError('This invitation is invalid or has expired.');
      } else {
        const inv = data[0];
        setInvitation({
          id: inv.id,
          email: inv.email,
          roles: inv.roles as any,
          expires_at: inv.expires_at,
          organization_id: inv.organization_id,
        });
      }
      setLoadingInvite(false);
    })();
  }, [token]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try { passwordSchema.parse(password); } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid password');
      return;
    }

    if (!invitation || !token) {
      setError('No valid invitation found.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: { data: { full_name: fullName || undefined } },
      });
      if (signUpError) throw signUpError;

      if (data?.user) {
        const { error: acceptError } = await supabase.rpc('accept_invitation', {
          _token: token,
          _user_id: data.user.id,
        });
        if (acceptError) {
          console.error('Failed to accept invitation:', acceptError);
          toast.error('Account created, but failed to assign roles.');
        } else {
          toast.success(`Welcome to ${org?.name || 'the lab'}!`);
        }
      }
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingOrg || loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Org Logo / Branding */}
        <div className="text-center mb-6">
          {org?.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="h-16 w-auto mx-auto mb-3 rounded-lg" />
          ) : (
            <div className="h-16 w-16 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <h1 className="text-xl font-bold text-foreground">{org?.name || 'Laboratory'}</h1>
        </div>

        {!token ? (
          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Invitation Required</h2>
              <p className="text-sm text-muted-foreground">
                You need a valid invitation link to join {org?.name || 'this lab'}.
                Contact your administrator to receive one.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/auth')}>
                Sign In Instead
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Invitation Info */}
            {invitation && (
              <Card className="mb-4 border-primary/50 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        You've been invited to join {org?.name}!
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {invitation.roles.map((role, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {roleLabels[role.role] || role.role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sign Up Form */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-lg">Create Your Account</CardTitle>
                <CardDescription>Complete your registration to get started</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={invitation?.email || ''} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" autoComplete="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pwd">Password</Label>
                    <div className="relative">
                      <Input id="pwd" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" className="pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : 'Create Account & Join'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by Technology Partners International (TPI)
        </p>
      </div>
    </div>
  );
}
