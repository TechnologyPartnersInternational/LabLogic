import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export type MatrixDepthsConfig = Record<string, string[]>;

export function useMatrixDepths() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch the matrix depths from lab_settings
  const query = useQuery({
    queryKey: ['matrix-depths-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase
        .from('lab_settings')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('setting_key', 'matrix_depths')
        .maybeSingle();

      if (error) {
        console.error('Error fetching matrix depths config:', error);
        throw error;
      }

      if (data && data.setting_value) {
        try {
          return JSON.parse(data.setting_value) as MatrixDepthsConfig;
        } catch (e) {
          console.error('Error parsing matrix depths config:', e);
          return {} as MatrixDepthsConfig;
        }
      }

      return {} as MatrixDepthsConfig;
    },
    enabled: !!organization?.id,
  });

  // Update the matrix depths in lab_settings
  const updateMutation = useMutation({
    mutationFn: async (newConfig: MatrixDepthsConfig) => {
      if (!organization?.id) throw new Error('No organization selected');

      // First check if the setting exists
      const { data: existing } = await supabase
        .from('lab_settings')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('setting_key', 'matrix_depths')
        .maybeSingle();

      const configString = JSON.stringify(newConfig);

      if (existing) {
        // Update
        const { error } = await supabase
          .from('lab_settings')
          .update({ setting_value: configString, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('lab_settings')
          .insert({
            organization_id: organization.id,
            setting_key: 'matrix_depths',
            setting_value: configString,
            description: 'Configured depth options for different matrix types',
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-depths-config', organization?.id] });
      toast.success('Matrix depths configuration saved');
    },
    onError: (error) => {
      console.error('Failed to save matrix depths config:', error);
      toast.error('Failed to save configuration');
    },
  });

  return {
    ...query,
    updateConfig: updateMutation,
  };
}
