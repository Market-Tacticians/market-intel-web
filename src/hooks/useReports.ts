import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Report } from '@/types/report';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Step 1: Get the newest snapshot ID — this is the current live state and
      // should NOT appear in the archive. Everything older than this is archive-eligible.
      const { data: newestData } = await supabase
        .from('report_snapshots')
        .select('id')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      const newestId = newestData?.id ?? '';

      // Step 2: Fetch all snapshots except the newest.
      // This includes prior-week snapshots (from archived reports) AND
      // within-week snapshots (from the current live report), which is the
      // intended archive behavior: when a new update comes in, the previous
      // snapshot becomes visible here.
      const { data, error } = await supabase
        .from('report_snapshots')
        .select(`
          id,
          title,
          week_of,
          update_version,
          generated_at,
          report_json->meta->>period_covered,
          report_json->regime->>label
        `)
        .neq('id', newestId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      
      const mappedReports: Report[] = (data || []).map((row: any) => {
        const dateObj = new Date(row.generated_at);
        const calendarDate = dateObj.toISOString().split('T')[0];
        
        const options: Intl.DateTimeFormatOptions = { 
          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
        };
        const displayDate = dateObj.toLocaleDateString('en-US', options).replace(/,/g, '');

        return {
          id: row.id,
          title: row.title,
          report_type: 'market-intel',
          calendar_date: calendarDate,
          last_updated_at: row.generated_at,
          last_updated_display: displayDate,
          period_label: row.period_covered || `Week of ${row.week_of}`,
          status_label: `ARCHIVE v${row.update_version || 1}`,
          file_path: '',
          metadata: {
            regime_label: row.label || 'N/A'
          }
        };
      });

      setReports(mappedReports);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return { reports, loading, error, refresh: fetchReports };
}
