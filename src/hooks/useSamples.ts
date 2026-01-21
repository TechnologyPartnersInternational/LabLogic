import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
