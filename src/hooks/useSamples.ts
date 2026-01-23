import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type SampleInsert = Database['public']['Tables']['samples']['Insert'];
type SampleUpdate = Database['public']['Tables']['samples']['Update'];

export interface Sample {
  id: string;
  sample_id: string;
  field_id: string | null;
  project_id: string;
  matrix: string;
  location: string | null;
  depth: string | null;
  collection_date: string;
  collection_time: string | null;
  status: string;
  sample_type: string;
  preservation_type: string | null;
  container_type: string | null;
  created_at: string;
  project?: {
    id: string;
    code: string;
    title: string;
    client_id: string;
  };
}

export function useSamples() {
  return useQuery({
    queryKey: ['samples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select(`
          *,
          project:projects(id, code, title, client_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sample[];
    },
  });
}

export function useSample(id: string) {
  return useQuery({
    queryKey: ['sample', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select(`
          *,
          project:projects(id, code, title, client_id, location)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Sample;
    },
    enabled: !!id,
  });
}

export function useSamplesByProject(projectId: string) {
  return useQuery({
    queryKey: ['samples', 'project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .eq('project_id', projectId)
        .order('sample_id', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

// Get count of existing samples for a project (for Lab ID generation)
export function useSampleCountByProject(projectId: string) {
  return useQuery({
    queryKey: ['samples', 'count', projectId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('samples')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
  });
}

export function useCreateSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sample: SampleInsert) => {
      const { data, error } = await supabase
        .from('samples')
        .insert(sample)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      queryClient.invalidateQueries({ queryKey: ['samples', 'project', data.project_id] });
    },
  });
}

export function useCreateSamplesBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (samples: SampleInsert[]) => {
      const { data, error } = await supabase
        .from('samples')
        .insert(samples)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
    },
  });
}

export function useUpdateSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & SampleUpdate) => {
      const { data, error } = await supabase
        .from('samples')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      queryClient.invalidateQueries({ queryKey: ['sample', data.id] });
      queryClient.invalidateQueries({ queryKey: ['samples', 'project', data.project_id] });
    },
  });
}

export function useDeleteSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('samples')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
    },
  });
}
