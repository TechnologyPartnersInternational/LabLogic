import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type Parameter = Database['public']['Tables']['parameters']['Row'];
type ParameterInsert = Database['public']['Tables']['parameters']['Insert'];
type ParameterUpdate = Database['public']['Tables']['parameters']['Update'];

export function useParameters() {
  return useQuery({
    queryKey: ['parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parameters')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Parameter[];
    },
  });
}

export function useCreateParameter() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (parameter: ParameterInsert) => {
      const { data, error } = await supabase
        .from('parameters')
        .insert({ ...parameter, organization_id: profile?.organization_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameters'] });
    },
  });
}

export function useUpdateParameter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ParameterUpdate) => {
      const { data, error } = await supabase
        .from('parameters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameters'] });
    },
  });
}

export function useDeleteParameter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parameters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameters'] });
    },
  });
}
