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
import { Shield, AlertCircle, Loader2, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import appLogo from '@/assets/lablogic-logo.png';

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
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    setIsSubmitting(false);
    
    if (error) {
      setError(error.message);
    } else {
      setResetEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
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
          <img src={appLogo} alt="LabLogic Logo" className="h-36 w-auto mx-auto" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
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
            ) : showForgotPassword ? (
              // Forgot password form
              <div className="space-y-4">
                {resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="p-3 rounded-full bg-success/10 w-fit mx-auto">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Check your email</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        We've sent a password reset link to <strong>{email}</strong>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                        setEmail('');
                      }}
                    >
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError(null);
                      }}
                    >
                      Back to Sign In
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              // Login only (signup requires invitation)
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError(null);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
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
                
                <div className="text-xs text-center text-muted-foreground pt-2 space-y-1">
                  <p>Need an account? Contact your administrator for an invitation.</p>
                  <p>
                    Setting up a new lab?{' '}
                    <a href="/register-lab" className="text-primary hover:underline font-medium">Register here</a>
                  </p>
                </div>
              </form>
            )}

            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                <Shield className="inline w-3 h-3 mr-1" />
                Passwords are securely hashed and never stored in plain text
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by Technology Partners International (TPI)
        </p>
      </div>
    </div>
  );
}
