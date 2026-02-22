import { useMemo } from 'react';
import { runCalculations, CalculatedValue } from '@/lib/labCalculations';
import { Result } from '@/hooks/useResults';
import { useCalculationRuleConfigsMap } from '@/hooks/useCalculationRuleConfigs';

/**
 * Hook that watches entered results for a sample and returns auto-calculated values.
 * Also accepts local edits (unsaved cell values) to recalculate in real-time.
 * Respects admin-configured enabled/disabled rules and overrides.
 */
export function useLabCalculations(
  results: Result[],
  sampleId?: string,
  localEdits?: Record<string, Record<string, string>>,
): {
  calculatedValues: CalculatedValue[];
  calculatedBySample: Map<string, CalculatedValue[]>;
} {
  const ruleConfigs = useCalculationRuleConfigsMap();

  return useMemo(() => {
    if (!results || results.length === 0) {
      return { calculatedValues: [], calculatedBySample: new Map() };
    }

    // Group results by sample
    const resultsBySample = new Map<string, Result[]>();
    results.forEach((r) => {
      if (sampleId && r.sample_id !== sampleId) return;
      if (!resultsBySample.has(r.sample_id)) {
        resultsBySample.set(r.sample_id, []);
      }
      resultsBySample.get(r.sample_id)!.push(r);
    });

    const calculatedBySample = new Map<string, CalculatedValue[]>();
    let allCalculated: CalculatedValue[] = [];

    for (const [sid, sampleResults] of resultsBySample) {
      const inputs = sampleResults
        .filter((r) => r.parameter_config?.parameter)
        .map((r) => {
          const localValue = localEdits?.[sid]?.[r.parameter_config_id];
          const numericValue = localValue !== undefined
            ? parseFloat(localValue)
            : r.canonical_value ?? (r.entered_value ? parseFloat(r.entered_value) : null);

          return {
            abbreviation: r.parameter_config!.parameter!.abbreviation,
            parameterName: r.parameter_config!.parameter!.name,
            value: numericValue !== null && !isNaN(numericValue) ? numericValue : null,
          };
        });

      const calcs = runCalculations(inputs, ruleConfigs);
      if (calcs.length > 0) {
        calculatedBySample.set(sid, calcs);
        allCalculated = [...allCalculated, ...calcs];
      }
    }

    return { calculatedValues: allCalculated, calculatedBySample };
  }, [results, sampleId, localEdits, ruleConfigs]);
}
