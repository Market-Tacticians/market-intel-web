import { useEffect, useState } from 'react';

const reportCache: Record<string, any> = {};

export function useLiveReport(initialReportId?: string) {
  const cacheKey = initialReportId || 'live';

  // Initialize synchronously from cache if available to prevent loading flashes
  const [liveReport, setLiveReport] = useState<any>(() => reportCache[cacheKey] || null);
  const [loading, setLoading] = useState<boolean>(!reportCache[cacheKey]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveReport() {
      // Return cached data immediately if available
      if (reportCache[cacheKey]) {
        if (liveReport !== reportCache[cacheKey]) {
          setLiveReport(reportCache[cacheKey]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const urlId = initialReportId || 'live';
        const response = await fetch(`/api/reports/${urlId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch report from server');
        }

        const reconstructedJson = result.data;
        reportCache[cacheKey] = reconstructedJson;
        setLiveReport(reconstructedJson);
      } catch (err: any) {
        console.error("Error fetching report:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveReport();
  }, [initialReportId]);

  return { liveReport, loading, error };
}
