import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { validateSampleResults, ValidationResult, SampleResult } from '@/lib/scientificValidation';
import { useValidationRuleConfigsMap } from '@/hooks/useValidationRuleConfigs';

export interface SampleValidationData {
  sampleId: string;
  sampleName: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  matrix: string;
  validations: ValidationResult[];
}

export function useAllValidations() {
  const configsMap = useValidationRuleConfigsMap();

  return useQuery({
    queryKey: ['all-validations', Object.keys(configsMap).length],
    queryFn: async () => {
      // Fetch all results with sample and project info
      const { data: results, error } = await supabase
        .from('results')
        .select(`
          id,
          sample_id,
          entered_value,
          canonical_value,
          canonical_unit,
          parameter_config:parameter_configs(
            id,
            parameter_id,
            matrix,
            canonical_unit,
            parameter:parameters(id, name, abbreviation, lab_section, analyte_group)
          )
        `)
        .not('entered_value', 'is', null);

      if (error) throw error;

      // Fetch samples with project info
      const { data: samples, error: samplesError } = await supabase
        .from('samples')
        .select(`
          id,
          sample_id,
          matrix,
          project_id,
          project:projects(id, code, title)
        `);

      if (samplesError) throw samplesError;

      // Create sample lookup map
      const sampleMap = new Map(samples?.map(s => [s.id, s]) || []);

      // Group results by sample
      const resultsBySample = new Map<string, typeof results>();
      for (const result of results || []) {
        const existing = resultsBySample.get(result.sample_id) || [];
        existing.push(result);
        resultsBySample.set(result.sample_id, existing);
      }

      // Run validations for each sample
      const allSampleValidations: SampleValidationData[] = [];

      for (const [sampleId, sampleResults] of resultsBySample) {
        const sample = sampleMap.get(sampleId);
        if (!sample || !sample.project) continue;

        // Convert to SampleResult format for validation engine
        const sampleResultsForValidation: SampleResult[] = sampleResults
          .filter(r => r.parameter_config?.parameter)
          .map(r => ({
            parameterId: r.parameter_config!.parameter_id,
            parameterName: r.parameter_config!.parameter!.name,
            abbreviation: r.parameter_config!.parameter!.abbreviation,
            value: r.canonical_value,
            unit: r.canonical_unit || r.parameter_config!.canonical_unit,
            analyteGroup: r.parameter_config!.parameter!.analyte_group,
          }));

        // Run validation engine
        const validations = validateSampleResults(sampleResultsForValidation, configsMap);

        if (validations.length > 0) {
          allSampleValidations.push({
            sampleId,
            sampleName: sample.sample_id,
            projectId: sample.project_id,
            projectCode: sample.project.code,
            projectTitle: sample.project.title,
            matrix: sample.matrix,
            validations,
          });
        }
      }

      return allSampleValidations;
    },
    enabled: Object.keys(configsMap).length > 0,
  });
}

// Get summary statistics
export function useValidationSummary() {
  const { data: validations = [], isLoading } = useAllValidations();

  const summary = {
    totalWarnings: 0,
    totalInfo: 0,
    projectsAffected: new Set<string>(),
    samplesAffected: validations.length,
    byCategory: {} as Record<string, number>,
  };

  for (const sample of validations) {
    for (const v of sample.validations) {
      if (v.severity === 'warning') {
        summary.totalWarnings++;
      } else {
        summary.totalInfo++;
      }
      summary.projectsAffected.add(sample.projectId);
      summary.byCategory[v.category] = (summary.byCategory[v.category] || 0) + 1;
    }
  }

  return {
    summary: {
      ...summary,
      projectsAffected: summary.projectsAffected.size,
    },
    isLoading,
  };
}
