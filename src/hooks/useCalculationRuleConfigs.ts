import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { CALCULATION_RULES } from '@/lib/labCalculations';
import { toast } from 'sonner';

export interface CalculationRuleConfig {
  id: string;
  organization_id: string;
  rule_id: string;
  rule_name: string;
  category: string;
  enabled: boolean;
  overrides: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export function useCalculationRuleConfigs() {
  const { organization } = useOrganization();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['calculation-rule-configs', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('calculation_rule_configs')
        .select('*')
        .eq('organization_id', orgId)
        .order('category', { ascending: true });

      if (error) throw error;

      // Auto-seed: if no configs exist yet, create them from the CALCULATION_RULES registry
      if (!data || data.length === 0) {
        const seeds = CALCULATION_RULES.map(rule => ({
          organization_id: orgId,
          rule_id: rule.id,
          rule_name: rule.name,
          category: rule.category,
          enabled: true,
          overrides: {} as Record<string, number>,
        }));

        const { data: seeded, error: seedError } = await supabase
          .from('calculation_rule_configs')
          .insert(seeds)
          .select();

        if (seedError) throw seedError;
        return (seeded ?? []) as CalculationRuleConfig[];
      }

      return data as CalculationRuleConfig[];
    },
    enabled: !!orgId,
  });
}

export function useUpdateCalculationRuleConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      enabled,
      overrides,
    }: {
      id: string;
      enabled?: boolean;
      overrides?: Record<string, number>;
    }) => {
      const updates: Record<string, unknown> = {};
      if (enabled !== undefined) updates.enabled = enabled;
      if (overrides !== undefined) updates.overrides = overrides;

      const { data, error } = await supabase
        .from('calculation_rule_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculation-rule-configs'] });
      toast.success('Calculation rule updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
}

/** Map of rule_id → config for engine integration */
export function useCalculationRuleConfigsMap() {
  const { data: configs } = useCalculationRuleConfigs();

  return configs?.reduce((acc, config) => {
    acc[config.rule_id] = config;
    return acc;
  }, {} as Record<string, CalculationRuleConfig>) ?? {};
}
