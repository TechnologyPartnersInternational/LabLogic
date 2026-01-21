import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  code: string;
  title: string;
  status: string;
  location: string | null;
  notes: string | null;
  client_id: string;
  sample_collection_date: string | null;
  sample_receipt_date: string | null;
  analysis_start_date: string | null;
  analysis_end_date: string | null;
  results_issued_date: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name, contact_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name, contact_name, email, phone, address)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });
}

export function useProjectSamples(projectId: string) {
  return useQuery({
    queryKey: ['project-samples', projectId],
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
