import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useJsonReports() {
  const [jsonReports, setJsonReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJsonReports() {
      try {
        const { data, error } = await supabase
          .from('json_reports')
          .select('*')
          .order('calendar_date', { ascending: false });

        if (error) throw error;
        setJsonReports(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJsonReports();
  }, []);

  return { jsonReports, loading, error };
}
