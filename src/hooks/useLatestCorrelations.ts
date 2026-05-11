import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CorrelationResult {
  symbol: string;
  regime_alignment: string;
  technical_state: string;
  current_location: any;
  sequence_behavior: string;
  participation_state: string;
  asset_role: string;
  regime_label: string;
}

export function useLatestCorrelations() {
  const [correlations, setCorrelations] = useState<Record<string, CorrelationResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCorrelations() {
      try {
        setLoading(true);
        // We want the most recent correlation for each symbol
        // The easiest way is to fetch the latest snapshot that has correlations
        // Or simply query the table, order by created_at desc, limit to 7
        // But to be perfectly safe, we can just fetch the last 50 and grab the first occurrence of each symbol
        const { data, error } = await supabase
          .from('regime_asset_correlations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const latest: Record<string, CorrelationResult> = {};
        if (data) {
          for (const row of data) {
            if (!latest[row.symbol]) {
              latest[row.symbol] = row as CorrelationResult;
            }
          }
        }
        setCorrelations(latest);
      } catch (err) {
        console.error('Error fetching correlations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCorrelations();
  }, []);

  return { correlations, loading };
}
