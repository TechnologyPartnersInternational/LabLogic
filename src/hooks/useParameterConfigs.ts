import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ParameterConfig = Database['public']['Tables']['parameter_configs']['Row'];
type ParameterConfigInsert = Database['public']['Tables']['parameter_configs']['Insert'];
type ParameterConfigUpdate = Database['public']['Tables']['parameter_configs']['Update'];

export interface ParameterConfigWithRelations extends ParameterConfig {
  parameter?: Database['public']['Tables']['parameters']['Row'];
  method?: Database['public']['Tables']['methods']['Row'];
}

export function useParameterConfigs() {
  return useQuery({
    queryKey: ['parameter_configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parameter_configs')
        .select(`
          *,
          parameter:parameters(*),
          method:methods(*)
        `)
        .order('created_at');
      
      if (error) throw error;
      return data as ParameterConfigWithRelations[];
    },
  });
}

export function useParameterConfigsByParameter(parameterId: string | null) {
  return useQuery({
    queryKey: ['parameter_configs', 'by_parameter', parameterId],
    queryFn: async () => {
      if (!parameterId) return [];
      
      const { data, error } = await supabase
        .from('parameter_configs')
        .select(`
          *,
          parameter:parameters(*),
          method:methods(*)
        `)
        .eq('parameter_id', parameterId);
      
      if (error) throw error;
      return data as ParameterConfigWithRelations[];
    },
    enabled: !!parameterId,
  });
}

export function useCreateParameterConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: ParameterConfigInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single();

      const { data, error } = await supabase
        .from('parameter_configs')
        .insert({ ...config, organization_id: profile?.organization_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter_configs'] });
    },
  });
}

export function useUpdateParameterConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ParameterConfigUpdate) => {
      const { data, error } = await supabase
        .from('parameter_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter_configs'] });
    },
  });
}

export function useDeleteParameterConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parameter_configs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter_configs'] });
    },
  });
}
