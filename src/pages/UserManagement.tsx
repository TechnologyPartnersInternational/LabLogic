import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Beaker, 
  Microscope,
  FlaskConical,
  CheckCircle,
  Trash2,
  Loader2,
  AlertTriangle,
  Mail,
  Activity,
  Clock,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { DataPurgeDialog } from '@/components/admin/DataPurgeDialog';

type LabRole = Database['public']['Enums']['lab_role'];
type LabSection = Database['public']['Enums']['lab_section'];

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: Array<{
    id: string;
    role: LabRole;
    lab_section: LabSection | null;
  }>;
}

interface PendingInvitation {
  id: string;
  email: string;
  roles: Array<{ role: string; lab_section?: string }>;
  expires_at: string;
  created_at: string;
}

const roleLabels: Record<LabRole, string> = {
  wet_chemistry_analyst: 'Wet Chemistry Analyst',
  instrumentation_analyst: 'Instrumentation Analyst',
  microbiology_analyst: 'Microbiology Analyst',
  lab_supervisor: 'Lab Supervisor',
  qa_officer: 'QA Officer',
  admin: 'Administrator',
};

const roleIcons: Record<LabRole, typeof Beaker> = {
  wet_chemistry_analyst: FlaskConical,
  instrumentation_analyst: Activity,
  microbiology_analyst: Microscope,
  lab_supervisor: CheckCircle,
  qa_officer: Shield,
  admin: Shield,
};

const sectionLabels: Record<LabSection, string> = {
  wet_chemistry: 'Wet Chemistry',
  instrumentation: 'Instrumentation',
  microbiology: 'Microbiology',
};

// Roles that require lab section assignment
const rolesRequiringSection: LabRole[] = [
  'wet_chemistry_analyst',
  'instrumentation_analyst', 
  'microbiology_analyst',
  'lab_supervisor',
];

export default function UserManagement() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<LabRole | ''>('');
  const [selectedSection, setSelectedSection] = useState<LabSection | ''>('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoles, setInviteRoles] = useState<Array<{ role: LabRole; lab_section?: LabSection }>>([]);
  const [tempRole, setTempRole] = useState<LabRole | ''>('');
  const [tempSection, setTempSection] = useState<LabSection | ''>('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, lab_section');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
        ...profile,
        roles: allRoles
          .filter(r => r.user_id === profile.id)
          .map(r => ({ id: r.id, role: r.role, lab_section: r.lab_section })),
      }));

      return usersWithRoles;
    },
  });

  const { data: pendingInvitations } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_invitations')
        .select('id, email, roles, expires_at, created_at')
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PendingInvitation[];
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      role, 
      labSection 
    }: { 
      userId: string; 
      role: LabRole; 
      labSection: LabSection | null;
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          lab_section: labSection,
          assigned_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role assigned successfully');
      setShowAddRoleDialog(false);
      setSelectedRole('');
      setSelectedSection('');
    },
    onError: (error) => {
      toast.error('Failed to assign role: ' + error.message);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role removed');
    },
    onError: (error) => {
      toast.error('Failed to remove role: ' + error.message);
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async ({ email, roles }: { email: string; roles: Array<{ role: string; lab_section?: string }> }) => {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { email, roles },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitation sent successfully');
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRoles([]);
    },
    onError: (error) => {
      toast.error('Failed to send invitation: ' + error.message);
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitation cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel invitation: ' + error.message);
    },
  });

  const requiresLabSection = (role: LabRole) => rolesRequiringSection.includes(role);

  const handleAddRole = () => {
    if (!selectedUser || !selectedRole) return;

    const labSection = requiresLabSection(selectedRole as LabRole) ? (selectedSection || null) : null;

    if (requiresLabSection(selectedRole as LabRole) && !selectedSection) {
      toast.error('Please select a lab section for this role');
      return;
    }

    addRoleMutation.mutate({
      userId: selectedUser.id,
      role: selectedRole as LabRole,
      labSection: labSection as LabSection | null,
    });
  };

  const handleAddRoleToInvite = () => {
    if (!tempRole) return;

    if (requiresLabSection(tempRole as LabRole) && !tempSection) {
      toast.error('Please select a lab section for this role');
      return;
    }

    const newRole: { role: LabRole; lab_section?: LabSection } = { role: tempRole as LabRole };
    if (tempSection) {
      newRole.lab_section = tempSection as LabSection;
    }

    setInviteRoles([...inviteRoles, newRole]);
    setTempRole('');
    setTempSection('');
  };

  const handleRemoveRoleFromInvite = (index: number) => {
    setInviteRoles(inviteRoles.filter((_, i) => i !== index));
  };

  const handleSendInvitation = () => {
    if (!inviteEmail) {
      toast.error('Email is required');
      return;
    }
    if (inviteRoles.length === 0) {
      toast.error('At least one role is required');
      return;
    }

    sendInvitationMutation.mutate({
      email: inviteEmail,
      roles: inviteRoles.map(r => ({
        role: r.role,
        lab_section: r.lab_section,
      })),
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Invite users and manage lab section assignments
          </p>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                {pendingInvitations.length} pending invitation(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Roles</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {invitation.roles.map((role, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {roleLabels[role.role as LabRole] || role.role}
                              {role.lab_section && ` (${sectionLabels[role.lab_section as LabSection] || role.lab_section})`}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(invitation.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(invitation.expires_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Cancel this invitation?')) {
                              cancelInvitationMutation.mutate(invitation.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Lab Staff
              </CardTitle>
              <CardDescription>
                {users?.length || 0} registered users
              </CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              <Mail className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.full_name || 'Not set'}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length > 0 ? (
                          u.roles.map((role) => {
                            const Icon = roleIcons[role.role];
                            return (
                              <Badge 
                                key={role.id} 
                                variant="secondary" 
                                className="gap-1 group cursor-pointer"
                                onClick={() => {
                                  if (confirm('Remove this role?')) {
                                    removeRoleMutation.mutate(role.id);
                                  }
                                }}
                              >
                                <Icon className="w-3 h-3" />
                                {roleLabels[role.role]}
                                {role.lab_section && ` (${sectionLabels[role.lab_section]})`}
                                <Trash2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 text-destructive" />
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground text-sm">No roles assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setShowAddRoleDialog(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Role Descriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">Lab Analysts</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter results for their assigned lab section (Wet Chemistry, Instrumentation, or Microbiology)
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-info" />
                  <h3 className="font-medium">Lab Supervisor</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review and validate analyst entries for their assigned lab section before QA approval
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-success" />
                  <h3 className="font-medium">QA Officer</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Final approval and release of results for reporting
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible administrative actions. Use with extreme caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div>
                <h3 className="font-medium">Purge All Sample Data</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all samples, results, and validation errors. Configuration data will be preserved.
                </p>
              </div>
              <DataPurgeDialog />
            </div>
          </CardContent>
        </Card>

        {/* Add Role Dialog */}
        <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
              <DialogDescription>
                Assign a role to {selectedUser?.full_name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as LabRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wet_chemistry_analyst">Wet Chemistry Analyst</SelectItem>
                    <SelectItem value="instrumentation_analyst">Instrumentation Analyst</SelectItem>
                    <SelectItem value="microbiology_analyst">Microbiology Analyst</SelectItem>
                    <SelectItem value="lab_supervisor">Lab Supervisor</SelectItem>
                    <SelectItem value="qa_officer">QA Officer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && requiresLabSection(selectedRole as LabRole) && (
                <div className="space-y-2">
                  <Label>Lab Section <span className="text-destructive">*</span></Label>
                  <Select value={selectedSection} onValueChange={(v) => setSelectedSection(v as LabSection)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lab section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wet_chemistry">Wet Chemistry</SelectItem>
                      <SelectItem value="instrumentation">Instrumentation</SelectItem>
                      <SelectItem value="microbiology">Microbiology</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedRole === 'lab_supervisor' && (
                    <p className="text-xs text-muted-foreground">
                      Lab Supervisors can only review results from their assigned lab section.
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddRoleDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddRole}
                disabled={!selectedRole || addRoleMutation.isPending || (requiresLabSection(selectedRole as LabRole) && !selectedSection)}
              >
                {addRoleMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Assign Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite User Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Invite New User
              </DialogTitle>
              <DialogDescription>
                Send an invitation email with pre-assigned roles. The user will create their own password when they sign up.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              {/* Assigned Roles List */}
              {inviteRoles.length > 0 && (
                <div className="space-y-2">
                  <Label>Assigned Roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {inviteRoles.map((role, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="gap-1 cursor-pointer group"
                        onClick={() => handleRemoveRoleFromInvite(index)}
                      >
                        {roleLabels[role.role]}
                        {role.lab_section && ` (${sectionLabels[role.lab_section]})`}
                        <Trash2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 text-destructive" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Role Section */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <Label className="text-sm font-medium">Add Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={tempRole} onValueChange={(v) => setTempRole(v as LabRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wet_chemistry_analyst">Wet Chemistry Analyst</SelectItem>
                      <SelectItem value="instrumentation_analyst">Instrumentation Analyst</SelectItem>
                      <SelectItem value="microbiology_analyst">Microbiology Analyst</SelectItem>
                      <SelectItem value="lab_supervisor">Lab Supervisor</SelectItem>
                      <SelectItem value="qa_officer">QA Officer</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>

                  {tempRole && requiresLabSection(tempRole as LabRole) ? (
                    <Select value={tempSection} onValueChange={(v) => setTempSection(v as LabSection)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wet_chemistry">Wet Chemistry</SelectItem>
                        <SelectItem value="instrumentation">Instrumentation</SelectItem>
                        <SelectItem value="microbiology">Microbiology</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div />
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddRoleToInvite}
                  disabled={!tempRole || (requiresLabSection(tempRole as LabRole) && !tempSection)}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Role to Invitation
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowInviteDialog(false);
                setInviteEmail('');
                setInviteRoles([]);
                setTempRole('');
                setTempSection('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendInvitation}
                disabled={!inviteEmail || inviteRoles.length === 0 || sendInvitationMutation.isPending}
              >
                {sendInvitationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
