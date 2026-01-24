import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Beaker, Shield, AlertCircle, Loader2, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

// Validation schemas
const emailSchema = z.string().trim().email({ message: "Invalid email address" });
const passwordSchema = z.string().min(8, { message: "Password must be at least 8 characters" });
const fullNameSchema = z.string().trim().min(2, { message: "Name must be at least 2 characters" }).optional();

interface InvitationData {
  id: string;
  email: string;
  roles: Array<{ role: string; lab_section?: string }>;
  expires_at: string;
}

const roleLabels: Record<string, string> = {
  wet_chemistry_analyst: 'Wet Chemistry Analyst',
  instrumentation_analyst: 'Instrumentation Analyst',
  microbiology_analyst: 'Microbiology Analyst',
  lab_supervisor: 'Lab Supervisor',
  qa_officer: 'QA Officer',
  admin: 'Administrator',
};

const sectionLabels: Record<string, string> = {
  wet_chemistry: 'Wet Chemistry',
  instrumentation: 'Instrumentation',
  microbiology: 'Microbiology',
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Invitation state
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  // Check for invitation token in URL
  useEffect(() => {
    const token = searchParams.get('invitation');
    if (token) {
      setInvitationToken(token);
      setActiveTab('signup');
      fetchInvitation(token);
    }
  }, [searchParams]);

  const fetchInvitation = async (token: string) => {
    setLoadingInvitation(true);
    try {
      const { data, error } = await supabase.rpc('get_invitation_by_token', { _token: token });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const inv = data[0];
        setInvitation({
          id: inv.id,
          email: inv.email,
          roles: inv.roles as Array<{ role: string; lab_section?: string }>,
          expires_at: inv.expires_at,
        });
        setEmail(inv.email);
      } else {
        setError('This invitation is invalid or has expired.');
        setInvitationToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch invitation:', err);
      setError('Failed to load invitation. Please try again.');
      setInvitationToken(null);
    } finally {
      setLoadingInvitation(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateInputs = (isSignUp: boolean) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (isSignUp && fullName) {
        fullNameSchema.parse(fullName);
      }
      return null;
    } catch (e) {
      if (e instanceof z.ZodError) {
        return e.errors[0].message;
      }
      return 'Validation failed';
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validationError = validateInputs(false);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await signIn(email, password);
    
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validationError = validateInputs(true);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    // For invitation signups, we need to use supabase directly to get the user data
    if (invitationToken) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || undefined },
        },
      });
      
      if (signUpError) {
        setIsSubmitting(false);
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Accept the invitation to assign roles
      if (data?.user) {
        try {
          const { data: accepted, error: acceptError } = await supabase.rpc('accept_invitation', {
            _token: invitationToken,
            _user_id: data.user.id,
          });

          if (acceptError) {
            console.error('Failed to accept invitation:', acceptError);
            toast.error('Account created, but failed to assign roles. Please contact an administrator.');
          } else if (accepted) {
            toast.success('Account created with assigned roles!');
          }
        } catch (err) {
          console.error('Error accepting invitation:', err);
        }
      }
    } else {
      const { error: signUpError } = await signUp(email, password, fullName || undefined);
      
      if (signUpError) {
        setIsSubmitting(false);
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(signUpError.message);
        }
        return;
      }
    }
    
    setIsSubmitting(false);
  };

  if (loading || loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Beaker className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">LabFlow LIMS</h1>
          <p className="text-muted-foreground mt-1">Environmental Laboratory Management</p>
        </div>

        {/* Invitation Banner */}
        {invitation && (
          <Card className="mb-4 border-primary/50 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">You've been invited!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your account to join with the following role(s):
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {invitation.roles.map((role, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {roleLabels[role.role] || role.role}
                        {role.lab_section && ` (${sectionLabels[role.lab_section] || role.lab_section})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-lg">
              {invitation ? 'Complete Your Registration' : 'Welcome'}
            </CardTitle>
            <CardDescription>
              {invitation 
                ? 'Create a password to complete your account setup'
                : 'Sign in to your account or create a new one'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitation ? (
              // Invitation signup form (no tabs)
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account & Sign In'
                  )}
                </Button>
              </form>
            ) : (
              // Standard login/signup tabs
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <div className="text-center py-6">
                    <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground mb-2">Invitation Required</h3>
                    <p className="text-sm text-muted-foreground">
                      New accounts can only be created through an administrator invitation. 
                      Please contact your lab administrator to request access.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                <Shield className="inline w-3 h-3 mr-1" />
                Passwords are securely hashed and never stored in plain text
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role information */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm">
          <p className="font-medium text-foreground mb-2">Lab Staff Roles:</p>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>• <span className="text-foreground">Analysts</span> - Enter results for assigned lab sections</li>
            <li>• <span className="text-foreground">Supervisors</span> - Review and validate results</li>
            <li>• <span className="text-foreground">QA Officers</span> - Final approval and release</li>
            <li>• <span className="text-foreground">Admins</span> - Full system access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
