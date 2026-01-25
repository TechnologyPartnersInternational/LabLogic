import { useMemo } from 'react';
import { 
  validateSampleResults, 
  SampleResult, 
  ValidationResult,
  ValidationRuleConfig
} from '@/lib/scientificValidation';
import { Result } from '@/hooks/useResults';
import { useValidationRuleConfigs } from '@/hooks/useValidationRuleConfigs';

/**
 * Hook to run scientific validations on sample results
 * Groups results by sample and validates each sample independently
 */
export function useScientificValidation(
  results: Result[], 
  sampleId?: string
): {
  validations: ValidationResult[];
  validationsBySample: Map<string, ValidationResult[]>;
  hasWarnings: boolean;
  warningCount: number;
  infoCount: number;
} {
  const { data: dbConfigs } = useValidationRuleConfigs();
  
  // Convert DB configs to the format expected by validation engine
  const configs = useMemo(() => {
    if (!dbConfigs) return undefined;
    return dbConfigs.reduce((acc, config) => {
      acc[config.rule_id] = {
        rule_id: config.rule_id,
        enabled: config.enabled,
        thresholds: config.thresholds || {},
      };
      return acc;
    }, {} as Record<string, ValidationRuleConfig>);
  }, [dbConfigs]);

  return useMemo(() => {
    if (!results || results.length === 0) {
      return {
        validations: [],
        validationsBySample: new Map(),
        hasWarnings: false,
        warningCount: 0,
        infoCount: 0,
      };
    }

    // Group results by sample
    const resultsBySample = results.reduce((acc, result) => {
      if (!acc.has(result.sample_id)) {
        acc.set(result.sample_id, []);
      }
      acc.get(result.sample_id)!.push(result);
      return acc;
    }, new Map<string, Result[]>());

    const validationsBySample = new Map<string, ValidationResult[]>();
    let allValidations: ValidationResult[] = [];

    // Run validations for each sample
    for (const [sid, sampleResults] of resultsBySample) {
      // Skip if we're filtering by sample and this isn't the one
      if (sampleId && sid !== sampleId) continue;

      // Convert to validation format
      const formattedResults: SampleResult[] = sampleResults
        .filter(r => r.entered_value !== null && r.parameter_config?.parameter)
        .map(r => ({
          parameterId: r.parameter_config!.parameter_id,
          parameterName: r.parameter_config!.parameter!.name,
          abbreviation: r.parameter_config!.parameter!.abbreviation,
          value: r.canonical_value ?? (r.entered_value ? parseFloat(r.entered_value) : null),
          unit: r.canonical_unit ?? r.entered_unit ?? '',
          analyteGroup: r.parameter_config!.parameter!.analyte_group,
        }));

      const sampleValidations = validateSampleResults(formattedResults, configs);
      
      if (sampleValidations.length > 0) {
        validationsBySample.set(sid, sampleValidations);
        allValidations = [...allValidations, ...sampleValidations];
      }
    }

    const warningCount = allValidations.filter(v => v.severity === 'warning').length;
    const infoCount = allValidations.filter(v => v.severity === 'info').length;

    return {
      validations: allValidations,
      validationsBySample,
      hasWarnings: warningCount > 0,
      warningCount,
      infoCount,
    };
  }, [results, sampleId, configs]);
}

/**
 * Hook to validate a single sample's results
 */
export function useSampleScientificValidation(
  results: Result[],
  sampleId: string
): ValidationResult[] {
  const { validationsBySample } = useScientificValidation(results, sampleId);
  return validationsBySample.get(sampleId) ?? [];
}
