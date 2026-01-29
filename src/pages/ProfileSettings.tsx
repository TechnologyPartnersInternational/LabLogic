import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2, Save, Trash2, User, Shield, Key, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

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

export default function ProfileSettings() {
  const { user } = useAuth();
  const { 
    profile, 
    roles, 
    isLoading, 
    uploading, 
    updateProfile, 
    uploadAvatar, 
    removeAvatar,
    updatePassword,
    isUpdating 
  } = useProfile();
  
  const [fullName, setFullName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Initialize fullName when profile loads
  useState(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    await uploadAvatar(file);
  };

  const handleSaveName = () => {
    if (fullName.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    updateProfile({ full_name: fullName.trim() });
    setIsEditingName(false);
  };

  const handlePasswordChange = async () => {
    setPasswordErrors({});
    
    try {
      passwordSchema.parse({ newPassword, confirmPassword });
      
      setIsChangingPassword(true);
      await updatePassword('', newPassword);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setPasswordErrors(errors);
      } else {
        toast.error('Failed to update password: ' + (error as Error).message);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Upload a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(profile?.full_name || null, user?.email || '')}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <label className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={uploading}
                    />
                  </label>
                </Button>
                {profile?.avatar_url && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={removeAvatar}
                    disabled={uploading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Your personal information and email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact an administrator if needed.
              </p>
            </div>
            
            <Separator />
            
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="flex gap-2">
                <Input
                  id="fullName"
                  value={isEditingName ? fullName : (profile?.full_name || '')}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditingName}
                  placeholder="Enter your full name"
                  className={!isEditingName ? 'bg-muted' : ''}
                />
                {isEditingName ? (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleSaveName}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setIsEditingName(false);
                        setFullName(profile?.full_name || '');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setFullName(profile?.full_name || '');
                      setIsEditingName(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Assigned Roles
            </CardTitle>
            <CardDescription>
              Your roles and permissions in the system (managed by administrators)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roles && roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge 
                    key={role.id} 
                    variant={role.role === 'admin' ? 'default' : 'secondary'}
                    className="py-1.5 px-3"
                  >
                    {roleLabels[role.role] || role.role}
                    {role.lab_section && (
                      <span className="ml-1 opacity-75">
                        ({sectionLabels[role.lab_section] || role.lab_section})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No roles assigned</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Contact an administrator to request role changes.
            </p>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
              )}
            </div>
            
            <Button 
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Account created: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
            <p>Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
