import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LabSettings {
  lab_name: string;
  lab_short_name: string;
  lab_address: string;
  lab_phone: string;
  lab_email: string;
  lab_accreditation: string;
  lab_tagline: string;
}

const defaultSettings: LabSettings = {
  lab_name: 'Technology Partners International',
  lab_short_name: 'TPI',
  lab_address: '',
  lab_phone: '',
  lab_email: '',
  lab_accreditation: 'ISO 17025:2017 Accredited',
  lab_tagline: 'Environmental Laboratory Services',
};

export function useLabSettings() {
  return useQuery({
    queryKey: ['lab-settings'],
    queryFn: async (): Promise<LabSettings> => {
      const { data, error } = await supabase
        .from('lab_settings')
        .select('setting_key, setting_value');

      if (error) {
        console.error('Error fetching lab settings:', error);
        return defaultSettings;
      }

      const settings = { ...defaultSettings };
      data?.forEach((row) => {
        if (row.setting_key in settings) {
          (settings as Record<string, string>)[row.setting_key] = row.setting_value;
        }
      });

      return settings;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useUpdateLabSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('lab_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: (error) => {
      console.error('Error updating lab setting:', error);
      toast.error('Failed to update setting');
    },
  });
}
