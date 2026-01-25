import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component that monitors all active projects and syncs sample statuses
 * when all results for a sample are approved.
 */
export function SampleStatusSyncManager() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncAllSampleStatuses = async () => {
      try {
        // Get all samples that are in_progress (not yet completed)
        const { data: samples, error: samplesError } = await supabase
          .from('samples')
          .select('id, status, project_id')
          .in('status', ['received', 'in_progress']);

        if (samplesError) {
          console.error('Error fetching samples:', samplesError);
          return;
        }

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
            // Update sample to completed
            const { error: updateError } = await supabase
              .from('samples')
              .update({ status: 'completed' })
              .eq('id', sample.id);

            if (updateError) {
              console.error('Error updating sample status:', updateError);
            }
          }
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['samples'] });
        queryClient.invalidateQueries({ queryKey: ['releasable-projects'] });
        queryClient.invalidateQueries({ queryKey: ['project-samples-progress'] });
      } catch (error) {
        console.error('Error syncing sample status:', error);
      }
    };

    // Run sync on mount
    syncAllSampleStatuses();

    // Subscribe to result changes to trigger sync
    const channel = supabase
      .channel('sample-status-sync-global')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'results',
        },
        (payload) => {
          // When any result is updated (especially to approved), sync all samples
          if (payload.new && (payload.new as any).status === 'approved') {
            syncAllSampleStatuses();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // This is a manager component - renders nothing
  return null;
}
