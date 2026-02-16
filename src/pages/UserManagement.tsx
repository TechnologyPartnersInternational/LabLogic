import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments } from '@/hooks/useDepartments';

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
import { LabSettingsCard } from '@/components/admin/LabSettingsCard';
import { ComplianceDocumentsCard } from '@/components/admin/ComplianceDocumentsCard';

type LabRole = Database['public']['Enums']['lab_role'];

// Simplified role types for the new department-based model
type SimpleRole = 'analyst' | 'lab_supervisor' | 'qa_officer' | 'admin';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: Array<{
    id: string;
    role: LabRole;
    lab_section: string | null;
    department_id: string | null;
  }>;
}

interface PendingInvitation {
  id: string;
  email: string;
  roles: Array<{ role: string; lab_section?: string; department_id?: string }>;
  expires_at: string;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  wet_chemistry_analyst: 'Analyst',
  instrumentation_analyst: 'Analyst',
  microbiology_analyst: 'Analyst',
  analyst: 'Analyst',
  lab_supervisor: 'Lab Supervisor',
  qa_officer: 'QA Officer',
  admin: 'Administrator',
};

const simpleRoleOptions: { value: SimpleRole; label: string }[] = [
  { value: 'analyst', label: 'Analyst' },
  { value: 'lab_supervisor', label: 'Lab Supervisor' },
  { value: 'qa_officer', label: 'QA Officer' },
  { value: 'admin', label: 'Administrator' },
];

// Roles that require department assignment
const rolesRequiringDepartment: SimpleRole[] = ['analyst', 'lab_supervisor'];

export default function UserManagement() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const { data: departments } = useDepartments();
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<SimpleRole | ''>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoles, setInviteRoles] = useState<Array<{ role: SimpleRole; department_id?: string }>>([]);
  const [tempRole, setTempRole] = useState<SimpleRole | ''>('');
  const [tempDepartmentId, setTempDepartmentId] = useState('');

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
        .select('id, user_id, role, lab_section, department_id');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
        ...profile,
        roles: allRoles
          .filter(r => r.user_id === profile.id)
          .map(r => ({ id: r.id, role: r.role, lab_section: r.lab_section, department_id: r.department_id })),
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

  // Map simple role + department to the legacy lab_role enum value
  const mapToLabRole = (role: SimpleRole, departmentSlug?: string): LabRole => {
    if (role === 'analyst' && departmentSlug) {
      // Map to legacy analyst roles based on department slug for backward compat
      const slugToAnalystRole: Record<string, LabRole> = {
        'wet-chemistry': 'wet_chemistry_analyst',
        'instrumentation': 'instrumentation_analyst',
        'microbiology': 'microbiology_analyst',
      };
      return slugToAnalystRole[departmentSlug] || 'wet_chemistry_analyst';
    }
    return role as LabRole;
  };

  const getDepartmentName = (departmentId: string | null | undefined): string | null => {
    if (!departmentId || !departments) return null;
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || null;
  };

  const getDepartmentSlug = (departmentId: string): string | undefined => {
    if (!departments) return undefined;
    return departments.find(d => d.id === departmentId)?.slug;
  };

  const requiresDepartment = (role: SimpleRole) => rolesRequiringDepartment.includes(role);

  const addRoleMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      role, 
      departmentId 
    }: { 
      userId: string; 
      role: LabRole; 
      departmentId: string | null;
    }) => {
      // Also set lab_section for backward compat
      const dept = departments?.find(d => d.id === departmentId);
      const labSection = dept ? dept.slug.replace(/-/g, '_') : null;
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          department_id: departmentId,
          lab_section: labSection as any,
          assigned_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role assigned successfully');
      setShowAddRoleDialog(false);
      setSelectedRole('');
      setSelectedDepartmentId('');
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
    mutationFn: async ({ email, roles }: { email: string; roles: Array<{ role: string; lab_section?: string; department_id?: string }> }) => {
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

  const handleAddRole = () => {
    if (!selectedUser || !selectedRole) return;

    if (requiresDepartment(selectedRole) && !selectedDepartmentId) {
      toast.error('Please select a department for this role');
      return;
    }

    const deptSlug = selectedDepartmentId ? getDepartmentSlug(selectedDepartmentId) : undefined;
    const labRole = mapToLabRole(selectedRole, deptSlug);

    addRoleMutation.mutate({
      userId: selectedUser.id,
      role: labRole,
      departmentId: selectedDepartmentId || null,
    });
  };

  const handleAddRoleToInvite = () => {
    if (!tempRole) return;

    if (requiresDepartment(tempRole) && !tempDepartmentId) {
      toast.error('Please select a department for this role');
      return;
    }

    // Check for duplicate
    const isDuplicate = inviteRoles.some(
      r => r.role === tempRole && r.department_id === (tempDepartmentId || undefined)
    );
    
    if (isDuplicate) {
      toast.error('This role has already been added');
      return;
    }

    const newRole: { role: SimpleRole; department_id?: string } = { role: tempRole };
    if (tempDepartmentId) {
      newRole.department_id = tempDepartmentId;
    }

    setInviteRoles([...inviteRoles, newRole]);
    setTempRole('');
    setTempDepartmentId('');
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

    // Map to the format the edge function expects
    const mappedRoles = inviteRoles.map(r => {
      const deptSlug = r.department_id ? getDepartmentSlug(r.department_id) : undefined;
      const labRole = mapToLabRole(r.role, deptSlug);
      const dept = departments?.find(d => d.id === r.department_id);
      const labSection = dept ? dept.slug.replace(/-/g, '_') : undefined;
      return {
        role: labRole,
        lab_section: labSection,
        department_id: r.department_id,
      };
    });

    sendInvitationMutation.mutate({
      email: inviteEmail,
      roles: mappedRoles,
    });
  };

  // Helper to display a role badge label
  const getRoleBadgeLabel = (role: LabRole, departmentId: string | null | undefined): string => {
    const baseLabel = roleLabels[role] || role;
    const deptName = getDepartmentName(departmentId);
    if (deptName) return `${baseLabel} (${deptName})`;
    return baseLabel;
  };

  const getInviteRoleBadgeLabel = (role: SimpleRole, departmentId?: string): string => {
    const baseLabel = simpleRoleOptions.find(o => o.value === role)?.label || role;
    const deptName = getDepartmentName(departmentId || null);
    if (deptName) return `${baseLabel} (${deptName})`;
    return baseLabel;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Invite users and manage department assignments
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
                              {roleLabels[role.role] || role.role}
                              {role.department_id && ` (${getDepartmentName(role.department_id) || role.lab_section || ''})`}
                              {!role.department_id && role.lab_section && ` (${role.lab_section.replace(/_/g, ' ')})`}
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
                          u.roles.map((role) => (
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
                              {getRoleBadgeLabel(role.role, role.department_id)}
                              <Trash2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 text-destructive" />
                            </Badge>
                          ))
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
                  <h3 className="font-medium">Analyst</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter results for their assigned department. Department is selected when assigning the role.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-info" />
                  <h3 className="font-medium">Lab Supervisor</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review and validate analyst entries for their assigned department before QA approval
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

        {/* Lab Settings */}
        <LabSettingsCard />

        {/* Compliance Documents */}
        <ComplianceDocumentsCard />

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
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as SimpleRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {simpleRoleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && requiresDepartment(selectedRole) && (
                <div className="space-y-2">
                  <Label>Department <span className="text-destructive">*</span></Label>
                  <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRole === 'lab_supervisor' && (
                    <p className="text-xs text-muted-foreground">
                      Lab Supervisors can only review results from their assigned department.
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
                disabled={!selectedRole || addRoleMutation.isPending || (requiresDepartment(selectedRole) && !selectedDepartmentId)}
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
                        {getInviteRoleBadgeLabel(role.role, role.department_id)}
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
                  <Select value={tempRole} onValueChange={(v) => setTempRole(v as SimpleRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {simpleRoleOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {tempRole && requiresDepartment(tempRole) ? (
                    <Select value={tempDepartmentId} onValueChange={setTempDepartmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
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
                  disabled={!tempRole || (requiresDepartment(tempRole) && !tempDepartmentId)}
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
                setTempDepartmentId('');
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
    </>
  );
}
