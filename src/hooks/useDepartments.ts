import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DepartmentTemplate } from '@/data/labTemplates';
import { useAuth } from '@/hooks/useAuth';

export interface Department {
  id: string;
  name: string;
  slug: string;
  icon: string;
  analyte_groups: Array<{ key: string; label: string }>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  organization_id: string | null;
}

export function useDepartments() {
  const { organizationId } = useAuth();
  return useQuery({
    queryKey: ['departments', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as Department[];
    },
    enabled: !!organizationId,
  });
}

export function useAllDepartments() {
  const { organizationId } = useAuth();
  return useQuery({
    queryKey: ['departments-all', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as Department[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: async (dept: {
      name: string;
      slug: string;
      icon: string;
      analyte_groups: Array<{ key: string; label: string }>;
      sort_order: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('departments' as any)
        .insert({ ...dept, created_by: user?.id, organization_id: organizationId } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments-all'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Department> & { id: string }) => {
      const { data, error } = await supabase
        .from('departments' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments-all'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments-all'] });
    },
  });
}

export function useApplyTemplate() {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: async (departments: DepartmentTemplate[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: existing } = await supabase
        .from('departments' as any)
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);
      const startOrder = ((existing as any)?.[0]?.sort_order ?? 0) + 1;
      const rows = departments.map((dept, i) => ({
        name: dept.name, slug: dept.slug, icon: dept.icon,
        analyte_groups: dept.analyteGroups, sort_order: startOrder + i,
        created_by: user?.id, organization_id: organizationId,
      }));
      const { error } = await supabase.from('departments' as any).insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments-all'] });
    },
  });
}

export function useReplaceWithTemplate() {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: async (departments: DepartmentTemplate[]) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Nullify department_id on referencing tables to avoid FK violations
      await supabase.from('parameters').update({ department_id: null } as any).neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('test_packages').update({ department_id: null } as any).neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('user_roles').update({ department_id: null } as any).neq('id', '00000000-0000-0000-0000-000000000000');

      // Delete all existing departments (RLS scopes to org)
      const { error: deleteError } = await supabase
        .from('departments' as any)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteError) throw deleteError;

      const rows = departments.map((dept, i) => ({
        name: dept.name, slug: dept.slug, icon: dept.icon,
        analyte_groups: dept.analyteGroups, sort_order: i + 1,
        created_by: user?.id, organization_id: organizationId,
      }));
      const { error: insertError } = await supabase.from('departments' as any).insert(rows as any);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments-all'] });
    },
  });
}

export function slugToLabSection(slug: string): string {
  return slug.replace(/-/g, '_');
}
