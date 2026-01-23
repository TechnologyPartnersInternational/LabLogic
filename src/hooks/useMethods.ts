import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Method = Database['public']['Tables']['methods']['Row'];
type MethodInsert = Database['public']['Tables']['methods']['Insert'];
type MethodUpdate = Database['public']['Tables']['methods']['Update'];

export function useMethods() {
  return useQuery({
    queryKey: ['methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('methods')
        .select('*')
        .order('code');
      
      if (error) throw error;
      return data as Method[];
    },
  });
}

export function useCreateMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (method: MethodInsert) => {
      const { data, error } = await supabase
        .from('methods')
        .insert(method)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['methods'] });
    },
  });
}

export function useUpdateMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & MethodUpdate) => {
      const { data, error } = await supabase
        .from('methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['methods'] });
    },
  });
}

export function useDeleteMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('methods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['methods'] });
    },
  });
}
