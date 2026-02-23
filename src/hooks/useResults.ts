import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type ResultInsert = Database['public']['Tables']['results']['Insert'];
type ResultUpdate = Database['public']['Tables']['results']['Update'];

export interface Result {
  id: string;
  sample_id: string;
  parameter_config_id: string;
  entered_value: string | null;
  entered_unit: string | null;
  canonical_value: number | null;
  canonical_unit: string | null;
  is_below_mdl: boolean | null;
  is_calculated: boolean;
  status: string;
  entered_by: string | null;
  entered_at: string | null;
  analyst_notes: string | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  created_at: string;
  updated_at: string;
  parameter_config?: {
    id: string;
    parameter_id: string;
    matrix: string;
    mdl: number;
    loq: number;
    canonical_unit: string;
    decimal_places: number;
    parameter?: {
      id: string;
      name: string;
      abbreviation: string;
      lab_section: string;
      department_id?: string | null;
      analyte_group: string;
    };
  };
}

export function useResultsBySample(sampleId: string) {
  return useQuery({
    queryKey: ['results', 'sample', sampleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          parameter_config:parameter_configs(
            id,
            parameter_id,
            matrix,
            mdl,
            loq,
            canonical_unit,
            decimal_places,
            parameter:parameters(id, name, abbreviation, lab_section, department_id, analyte_group)
          )
        `)
        .eq('sample_id', sampleId);

      if (error) throw error;
      return data as Result[];
    },
    enabled: !!sampleId,
  });
}

export function useResultsByProject(projectId: string) {
  return useQuery({
    queryKey: ['results', 'project', projectId],
    queryFn: async () => {
      // First get all sample IDs for this project
      const { data: samples, error: samplesError } = await supabase
        .from('samples')
        .select('id')
        .eq('project_id', projectId);

      if (samplesError) throw samplesError;
      if (!samples || samples.length === 0) return [];

      const sampleIds = samples.map(s => s.id);

      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          parameter_config:parameter_configs(
            id,
            parameter_id,
            matrix,
            mdl,
            loq,
            canonical_unit,
            decimal_places,
            parameter:parameters(id, name, abbreviation, lab_section, department_id, analyte_group)
          )
        `)
        .in('sample_id', sampleIds);

      if (error) throw error;
      return data as Result[];
    },
    enabled: !!projectId,
  });
}

export function useCreateResult() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (result: ResultInsert) => {
      const { data, error } = await supabase
        .from('results')
        .insert({ ...result, organization_id: profile?.organization_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['results', 'sample', data.sample_id] });
    },
  });
}

export function useCreateResultsBatch() {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();

  return useMutation({
    mutationFn: async (results: ResultInsert[]) => {
      if (!user) throw new Error('User not authenticated');

      // Set entered_by and organization_id for each result
      const resultsWithUserAndOrg = results.map(result => ({
        ...result,
        entered_by: user.id,
        organization_id: profile?.organization_id
      }));

      const { data, error } = await supabase
        .from('results')
        .insert(resultsWithUserAndOrg)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
}

export function useUpdateResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ResultUpdate) => {
      const { data, error } = await supabase
        .from('results')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['results', 'sample', data.sample_id] });
    },
  });
}

export function useUpdateResultsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string } & ResultUpdate>) => {
      const results = await Promise.all(
        updates.map(async ({ id, ...update }) => {
          const { data, error } = await supabase
            .from('results')
            .update(update)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      // Also invalidate progress queries so UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['sample-progress'] });
      queryClient.invalidateQueries({ queryKey: ['project-samples-progress'] });
    },
  });
}
