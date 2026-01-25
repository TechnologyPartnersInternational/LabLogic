import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ValidationRuleConfig {
  id: string;
  rule_id: string;
  rule_name: string;
  category: string;
  description: string | null;
  enabled: boolean;
  thresholds: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export function useValidationRuleConfigs() {
  return useQuery({
    queryKey: ['validation-rule-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('validation_rule_configs')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data as ValidationRuleConfig[];
    },
  });
}

export function useUpdateValidationRuleConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      enabled,
      thresholds,
    }: {
      id: string;
      enabled?: boolean;
      thresholds?: Record<string, number>;
    }) => {
      const updates: Partial<ValidationRuleConfig> = {};
      if (enabled !== undefined) updates.enabled = enabled;
      if (thresholds !== undefined) updates.thresholds = thresholds;

      const { data, error } = await supabase
        .from('validation_rule_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-rule-configs'] });
      toast.success('Validation rule updated');
    },
    onError: (error) => {
      toast.error('Failed to update validation rule: ' + error.message);
    },
  });
}

// Hook to get configs as a map for easy lookup in validation engine
export function useValidationRuleConfigsMap() {
  const { data: configs } = useValidationRuleConfigs();
  
  return configs?.reduce((acc, config) => {
    acc[config.rule_id] = config;
    return acc;
  }, {} as Record<string, ValidationRuleConfig>) ?? {};
}
