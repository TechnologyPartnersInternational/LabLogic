import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LabProgress {
  labSection: string;
  labLabel: string;
  totalResults: number;
  enteredResults: number;
  reviewedResults: number;
  approvedResults: number;
  percentComplete: number;
}

export interface SampleProgress {
  sampleId: string;
  sampleLabId: string;
  totalResults: number;
  enteredResults: number;
  reviewedResults: number;
  approvedResults: number;
  overallPercent: number;
  labProgress: LabProgress[];
  isComplete: boolean;
}

const LAB_LABELS: Record<string, string> = {
  wet_chemistry: 'Wet Chemistry',
  instrumentation: 'Instrumentation',
  microbiology: 'Microbiology',
};

export function useSampleProgress(sampleId: string) {
  return useQuery({
    queryKey: ['sample-progress', sampleId],
    queryFn: async () => {
      // Get sample info
      const { data: sample, error: sampleError } = await supabase
        .from('samples')
        .select('id, sample_id')
        .eq('id', sampleId)
        .single();

      if (sampleError) throw sampleError;

      // Get all results for this sample with parameter info
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
          id,
          status,
          entered_value,
          parameter_config:parameter_configs(
            parameter:parameters(lab_section)
          )
        `)
        .eq('sample_id', sampleId);

      if (resultsError) throw resultsError;

      // Group by lab section and calculate progress
      const byLab: Record<string, { total: number; entered: number; reviewed: number; approved: number }> = {};

      results?.forEach((result) => {
        const labSection = result.parameter_config?.parameter?.lab_section || 'unknown';
        
        if (!byLab[labSection]) {
          byLab[labSection] = { total: 0, entered: 0, reviewed: 0, approved: 0 };
        }
        
        byLab[labSection].total++;
        
        if (result.entered_value !== null && result.entered_value !== '') {
          byLab[labSection].entered++;
        }
        if (result.status === 'reviewed' || result.status === 'approved') {
          byLab[labSection].reviewed++;
        }
        if (result.status === 'approved') {
          byLab[labSection].approved++;
        }
      });

      const labProgress: LabProgress[] = Object.entries(byLab).map(([labSection, counts]) => ({
        labSection,
        labLabel: LAB_LABELS[labSection] || labSection,
        totalResults: counts.total,
        enteredResults: counts.entered,
        reviewedResults: counts.reviewed,
        approvedResults: counts.approved,
        percentComplete: counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0,
      }));

      const totalResults = results?.length || 0;
      const enteredResults = results?.filter(r => r.entered_value !== null && r.entered_value !== '').length || 0;
      const reviewedResults = results?.filter(r => r.status === 'reviewed' || r.status === 'approved').length || 0;
      const approvedResults = results?.filter(r => r.status === 'approved').length || 0;

      const progress: SampleProgress = {
        sampleId: sample.id,
        sampleLabId: sample.sample_id,
        totalResults,
        enteredResults,
        reviewedResults,
        approvedResults,
        overallPercent: totalResults > 0 ? Math.round((approvedResults / totalResults) * 100) : 0,
        labProgress,
        isComplete: totalResults > 0 && approvedResults === totalResults,
      };

      return progress;
    },
    enabled: !!sampleId,
  });
}

export function useProjectSamplesProgress(projectId: string) {
  return useQuery({
    queryKey: ['project-samples-progress', projectId],
    queryFn: async () => {
      // Get all samples for this project
      const { data: samples, error: samplesError } = await supabase
        .from('samples')
        .select('id, sample_id, status')
        .eq('project_id', projectId)
        .order('sample_id');

      if (samplesError) throw samplesError;
      if (!samples || samples.length === 0) return [];

      const sampleIds = samples.map(s => s.id);

      // Get all results for these samples
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
          id,
          sample_id,
          status,
          entered_value,
          parameter_config:parameter_configs(
            parameter:parameters(lab_section)
          )
        `)
        .in('sample_id', sampleIds);

      if (resultsError) throw resultsError;

      // Build progress for each sample
      const progressMap: SampleProgress[] = samples.map(sample => {
        const sampleResults = results?.filter(r => r.sample_id === sample.id) || [];
        
        const byLab: Record<string, { total: number; entered: number; reviewed: number; approved: number }> = {};

        sampleResults.forEach((result) => {
          const labSection = result.parameter_config?.parameter?.lab_section || 'unknown';
          
          if (!byLab[labSection]) {
            byLab[labSection] = { total: 0, entered: 0, reviewed: 0, approved: 0 };
          }
          
          byLab[labSection].total++;
          
          if (result.entered_value !== null && result.entered_value !== '') {
            byLab[labSection].entered++;
          }
          if (result.status === 'reviewed' || result.status === 'approved') {
            byLab[labSection].reviewed++;
          }
          if (result.status === 'approved') {
            byLab[labSection].approved++;
          }
        });

        const labProgress: LabProgress[] = Object.entries(byLab).map(([labSection, counts]) => ({
          labSection,
          labLabel: LAB_LABELS[labSection] || labSection,
          totalResults: counts.total,
          enteredResults: counts.entered,
          reviewedResults: counts.reviewed,
          approvedResults: counts.approved,
          percentComplete: counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0,
        }));

        const totalResults = sampleResults.length;
        const enteredResults = sampleResults.filter(r => r.entered_value !== null && r.entered_value !== '').length;
        const reviewedResults = sampleResults.filter(r => r.status === 'reviewed' || r.status === 'approved').length;
        const approvedResults = sampleResults.filter(r => r.status === 'approved').length;

        return {
          sampleId: sample.id,
          sampleLabId: sample.sample_id,
          totalResults,
          enteredResults,
          reviewedResults,
          approvedResults,
          overallPercent: totalResults > 0 ? Math.round((approvedResults / totalResults) * 100) : 0,
          labProgress,
          isComplete: totalResults > 0 && approvedResults === totalResults,
        };
      });

      return progressMap;
    },
    enabled: !!projectId,
  });
}

// Hook to get lab-specific work order data
export function useLabWorkOrder(projectId: string, labSection: string) {
  return useQuery({
    queryKey: ['lab-work-order', projectId, labSection],
    queryFn: async () => {
      // Get project info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, code, title, client:clients(name)')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Get samples for this project
      const { data: samples, error: samplesError } = await supabase
        .from('samples')
        .select('id, sample_id, field_id, matrix, collection_date, location, status')
        .eq('project_id', projectId)
        .order('sample_id');

      if (samplesError) throw samplesError;
      if (!samples || samples.length === 0) return null;

      const sampleIds = samples.map(s => s.id);

      // Get results for this lab section
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
          id,
          sample_id,
          status,
          entered_value,
          parameter_config:parameter_configs(
            id,
            mdl,
            loq,
            canonical_unit,
            parameter:parameters(id, name, abbreviation, lab_section, analyte_group)
          )
        `)
        .in('sample_id', sampleIds);

      if (resultsError) throw resultsError;

      // Filter results for the specified lab section
      const labResults = results?.filter(
        r => r.parameter_config?.parameter?.lab_section === labSection
      ) || [];

      // Get unique parameters for this lab
      const uniqueParams = new Map<string, { name: string; abbreviation: string; unit: string; mdl: number; analyteGroup: string }>();
      labResults.forEach(r => {
        const param = r.parameter_config?.parameter;
        const config = r.parameter_config;
        if (param && config && !uniqueParams.has(param.id)) {
          uniqueParams.set(param.id, {
            name: param.name,
            abbreviation: param.abbreviation,
            unit: config.canonical_unit,
            mdl: config.mdl,
            analyteGroup: param.analyte_group,
          });
        }
      });

      // Build sample rows with their required tests
      const sampleRows = samples.map(sample => {
        const sampleLabResults = labResults.filter(r => r.sample_id === sample.id);
        const parameters = sampleLabResults.map(r => ({
          parameterId: r.parameter_config?.parameter?.id || '',
          abbreviation: r.parameter_config?.parameter?.abbreviation || '',
          status: r.status,
          hasValue: r.entered_value !== null && r.entered_value !== '',
        }));

        return {
          sampleId: sample.id,
          labId: sample.sample_id,
          fieldId: sample.field_id,
          matrix: sample.matrix,
          collectionDate: sample.collection_date,
          location: sample.location,
          sampleStatus: sample.status,
          parameters,
          totalTests: parameters.length,
          completedTests: parameters.filter(p => p.hasValue).length,
        };
      }).filter(s => s.totalTests > 0); // Only include samples that have tests for this lab

      return {
        project: {
          id: project.id,
          code: project.code,
          title: project.title,
          clientName: (project.client as { name: string } | null)?.name || 'Unknown',
        },
        labSection,
        labLabel: LAB_LABELS[labSection] || labSection,
        generatedAt: new Date().toISOString(),
        parameters: Array.from(uniqueParams.values()),
        samples: sampleRows,
        totalSamples: sampleRows.length,
        totalTests: sampleRows.reduce((sum, s) => sum + s.totalTests, 0),
      };
    },
    enabled: !!projectId && !!labSection,
  });
}
