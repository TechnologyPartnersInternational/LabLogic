import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  role: string;
  lab_section: string | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      // Delete existing avatar first
      await supabase.storage
        .from('avatars')
        .remove([fileName]);
      
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Update profile with new avatar URL
      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      
      return publicUrl;
    } catch (error) {
      toast.error('Failed to upload avatar: ' + (error as Error).message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user?.id || !profile?.avatar_url) return;
    
    setUploading(true);
    try {
      // Extract file path from URL
      const urlParts = profile.avatar_url.split('/avatars/');
      if (urlParts.length > 1) {
        await supabase.storage
          .from('avatars')
          .remove([urlParts[1]]);
      }
      
      await updateProfile.mutateAsync({ avatar_url: null });
    } catch (error) {
      toast.error('Failed to remove avatar: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    // Note: Supabase doesn't verify current password, it just updates
    // For better security, you might want to re-authenticate first
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    toast.success('Password updated successfully');
  };

  return {
    profile,
    roles,
    isLoading: profileLoading || rolesLoading,
    uploading,
    updateProfile: updateProfile.mutate,
    uploadAvatar,
    removeAvatar,
    updatePassword,
    isUpdating: updateProfile.isPending,
  };
}
