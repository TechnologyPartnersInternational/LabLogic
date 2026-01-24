import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateSample } from '@/hooks/useSamples';

/**
 * Hook that automatically updates sample status to 'completed' when all results are approved.
 * This should be called in a component that monitors project-level data.
 */
export function useSampleStatusSync(projectId: string) {
  const queryClient = useQueryClient();
  const updateSample = useUpdateSample();

  useEffect(() => {
    if (!projectId) return;

    const checkAndUpdateSampleStatus = async () => {
      try {
        // Get all samples for this project
        const { data: samples, error: samplesError } = await supabase
          .from('samples')
          .select('id, status')
          .eq('project_id', projectId)
          .neq('status', 'completed'); // Only check non-completed samples

        if (samplesError) throw samplesError;
        if (!samples || samples.length === 0) return;

        // For each sample, check if all results are approved
        for (const sample of samples) {
          const { data: results, error: resultsError } = await supabase
            .from('results')
            .select('id, status')
            .eq('sample_id', sample.id);

          if (resultsError) continue;
          if (!results || results.length === 0) continue;

          // Check if all results are approved
          const allApproved = results.every(r => r.status === 'approved');
          
          if (allApproved && sample.status !== 'completed') {
            await updateSample.mutateAsync({
              id: sample.id,
              status: 'completed',
            });
          }
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['samples'] });
        queryClient.invalidateQueries({ queryKey: ['project-samples-progress', projectId] });
      } catch (error) {
        console.error('Error syncing sample status:', error);
      }
    };

    // Check initially
    checkAndUpdateSampleStatus();

    // Subscribe to result changes
    const channel = supabase
      .channel(`sample-status-sync-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'results',
        },
        (payload) => {
          // When a result is updated, check if we need to update sample status
          if (payload.new && payload.new.status === 'approved') {
            checkAndUpdateSampleStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, updateSample]);
}
