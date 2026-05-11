import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CorrelationResult } from './useLatestCorrelations';

export function useSnapshotCorrelations(snapshotId: string) {
  const [correlations, setCorrelations] = useState<Record<string, CorrelationResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCorrelations() {
      if (!snapshotId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('regime_asset_correlations')
          .select('*')
          .eq('report_snapshot_id', snapshotId);

        if (error) throw error;

        const results: Record<string, CorrelationResult> = {};
        if (data) {
          for (const row of data) {
            results[row.symbol] = row as CorrelationResult;
          }
        }
        setCorrelations(results);
      } catch (err) {
        console.error('Error fetching snapshot correlations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCorrelations();
  }, [snapshotId]);

  return { correlations, loading };
}
