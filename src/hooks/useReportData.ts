import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApprovedResultData {
  id: string;
  sample_id: string;
  sample_name: string;
  field_id: string | null;
  matrix: string;
  depth: string | null;
  collection_date: string;
  location: string | null;
  entered_value: string | null;
  canonical_value: number | null;
  canonical_unit: string | null;
  is_below_mdl: boolean | null;
  parameter_name: string;
  parameter_abbr: string;
  lab_section: string;
  analyte_group: string;
  mdl: number;
  loq: number;
  method_code: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface ProjectReportData {
  project: {
    id: string;
    code: string;
    title: string;
    location: string | null;
    sample_collection_date: string | null;
    sample_receipt_date: string | null;
    analysis_start_date: string | null;
    analysis_end_date: string | null;
    results_issued_date: string | null;
    regulatory_program: string | null;
    tat: string | null;
  };
  client: {
    name: string;
    address: string | null;
    contact_name: string | null;
    email: string | null;
  };
  samples: Array<{
    id: string;
    sample_id: string;
    field_id: string | null;
    matrix: string;
    depth: string | null;
    location: string | null;
    collection_date: string;
    status: string;
  }>;
  results: ApprovedResultData[];
  summary: {
    totalSamples: number;
    approvedResults: number;
    pendingResults: number;
    allApproved: boolean;
  };
}

export function useProjectReportData(projectId: string) {
  return useQuery({
    queryKey: ['project-report', projectId],
    queryFn: async (): Promise<ProjectReportData | null> => {
      if (!projectId) return null;

      // Fetch project with client info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          id, code, title, location, 
          sample_collection_date, sample_receipt_date, 
          analysis_start_date, analysis_end_date, results_issued_date,
          regulatory_program, tat,
          client:clients(name, address, contact_name, email)
        `)
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch samples
      const { data: samples, error: samplesError } = await supabase
        .from('samples')
        .select('id, sample_id, field_id, matrix, depth, location, collection_date, status')
        .eq('project_id', projectId)
        .order('sample_id');

      if (samplesError) throw samplesError;

      const sampleIds = samples?.map(s => s.id) || [];
      if (sampleIds.length === 0) {
        return {
          project: {
            id: project.id,
            code: project.code,
            title: project.title,
            location: project.location,
            sample_collection_date: project.sample_collection_date,
            sample_receipt_date: project.sample_receipt_date,
            analysis_start_date: project.analysis_start_date,
            analysis_end_date: project.analysis_end_date,
            results_issued_date: project.results_issued_date,
            regulatory_program: project.regulatory_program,
            tat: project.tat,
          },
          client: project.client as ProjectReportData['client'],
          samples: samples || [],
          results: [],
          summary: {
            totalSamples: 0,
            approvedResults: 0,
            pendingResults: 0,
            allApproved: false,
          },
        };
      }

      // Fetch all results with parameter config and method info
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
          id,
          sample_id,
          entered_value,
          canonical_value,
          canonical_unit,
          is_below_mdl,
          status,
          approved_at,
          approved_by,
          parameter_config:parameter_configs(
            mdl,
            loq,
            canonical_unit,
            method:methods(code),
            parameter:parameters(name, abbreviation, lab_section, analyte_group)
          )
        `)
        .in('sample_id', sampleIds);

      if (resultsError) throw resultsError;

      // Create sample lookup
      const sampleMap = new Map(samples?.map(s => [s.id, s]) || []);

      // Transform results
      const transformedResults: ApprovedResultData[] = (results || [])
        .filter(r => r.status === 'approved')
        .map(r => {
          const sample = sampleMap.get(r.sample_id);
          const config = r.parameter_config as any;
          return {
            id: r.id,
            sample_id: r.sample_id,
            sample_name: sample?.sample_id || '',
            field_id: sample?.field_id || null,
            matrix: sample?.matrix || '',
            depth: sample?.depth || null,
            collection_date: sample?.collection_date || '',
            location: sample?.location || null,
            entered_value: r.entered_value,
            canonical_value: r.canonical_value,
            canonical_unit: r.canonical_unit || config?.canonical_unit || '',
            is_below_mdl: r.is_below_mdl,
            parameter_name: config?.parameter?.name || '',
            parameter_abbr: config?.parameter?.abbreviation || '',
            lab_section: config?.parameter?.lab_section || '',
            analyte_group: config?.parameter?.analyte_group || '',
            mdl: config?.mdl || 0,
            loq: config?.loq || 0,
            method_code: config?.method?.code || '',
            approved_at: r.approved_at,
            approved_by: r.approved_by,
          };
        });

      const approvedCount = transformedResults.length;
      const totalResults = results?.length || 0;
      const pendingCount = totalResults - approvedCount;

      return {
        project: {
          id: project.id,
          code: project.code,
          title: project.title,
          location: project.location,
          sample_collection_date: project.sample_collection_date,
          sample_receipt_date: project.sample_receipt_date,
          analysis_start_date: project.analysis_start_date,
          analysis_end_date: project.analysis_end_date,
          results_issued_date: project.results_issued_date,
          regulatory_program: project.regulatory_program,
          tat: project.tat,
        },
        client: project.client as ProjectReportData['client'],
        samples: samples || [],
        results: transformedResults,
        summary: {
          totalSamples: samples?.length || 0,
          approvedResults: approvedCount,
          pendingResults: pendingCount,
          allApproved: pendingCount === 0 && approvedCount > 0,
        },
      };
    },
    enabled: !!projectId,
  });
}

// Hook to get projects ready for release (all samples completed)
export function useReleasableProjects() {
  return useQuery({
    queryKey: ['releasable-projects'],
    queryFn: async () => {
      // Get all active projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, code, title, status,
          client:clients(name)
        `)
        .eq('status', 'active')
        .order('code');

      if (projectsError) throw projectsError;

      // For each project, check if all samples are completed
      const projectsWithStatus = await Promise.all(
        (projects || []).map(async (project) => {
          const { data: samples } = await supabase
            .from('samples')
            .select('id, status')
            .eq('project_id', project.id);

          const totalSamples = samples?.length || 0;
          const completedSamples = samples?.filter(s => s.status === 'completed' || s.status === 'released').length || 0;
          const releasedSamples = samples?.filter(s => s.status === 'released').length || 0;

          return {
            ...project,
            totalSamples,
            completedSamples,
            releasedSamples,
            isReadyForRelease: totalSamples > 0 && completedSamples === totalSamples,
            isFullyReleased: totalSamples > 0 && releasedSamples === totalSamples,
          };
        })
      );

      return projectsWithStatus;
    },
  });
}
