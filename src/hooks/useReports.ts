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
      // Fetch archived reports, joining with report_regimes to get the regime label
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          week_of,
          period_covered,
          generated_at,
          status,
          report_regimes ( label )
        `)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      
      const mappedReports: Report[] = (data || []).map((row: any) => {
        const dateObj = new Date(row.generated_at);
        const calendarDate = dateObj.toISOString().split('T')[0];
        
        // Format last_updated_display (e.g. "Fri Apr 24, 2026 | 4:30 PM ET")
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
          status_label: row.status.toUpperCase(),
          file_path: '', // deprecated
          metadata: {
            regime_label: row.report_regimes ? row.report_regimes.label : 'N/A'
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
