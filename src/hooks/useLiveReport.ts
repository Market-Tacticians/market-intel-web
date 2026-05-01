import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useLiveReport() {
  const [liveReport, setLiveReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveReport() {
      try {
        // 1. Fetch the master report where status = 'live'
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('status', 'live')
          .single();

        if (reportError) throw reportError;
        if (!reportData) {
          setLiveReport(null);
          return;
        }

        const reportId = reportData.id;

        // 2. Concurrently fetch all child data
        const [
          { data: sources },
          { data: regimes },
          { data: narratives },
          { data: catalysts },
          { data: snapshots },
          { data: stories },
          { data: scenarios },
          { data: questions }
        ] = await Promise.all([
          supabase.from('report_sources').select('*').eq('report_id', reportId).order('sort_order'),
          supabase.from('report_regimes').select('*').eq('report_id', reportId).single(),
          supabase.from('report_narratives').select('*').eq('report_id', reportId).order('sort_order'),
          supabase.from('report_catalysts').select('*').eq('report_id', reportId).order('sort_order'),
          supabase.from('report_market_snapshot').select('*').eq('report_id', reportId).order('sort_order'),
          supabase.from('report_stories_to_track').select('*').eq('report_id', reportId).order('sort_order'),
          supabase.from('report_scenarios').select('*').eq('report_id', reportId).order('sort_order'),
          supabase.from('report_key_questions').select('*').eq('report_id', reportId).order('sort_order')
        ]);

        // 3. Reconstruct the JSON structure for DynamicReport.tsx
        
        // Group market snapshots
        const msMap: Record<string, any[]> = { indexes: [], macro_fed: [], energy_volatility: [] };
        snapshots?.forEach(s => {
          if (!msMap[s.category]) msMap[s.category] = [];
          msMap[s.category].push({
            label: s.label,
            value: s.value,
            direction: s.direction,
            note: s.note
          });
        });

        // Group stories to track
        const storiesMap: Record<string, any[]> = { geopolitical_macro: [], sector_stock_signals: [] };
        stories?.forEach(s => {
          if (!storiesMap[s.category]) storiesMap[s.category] = [];
          storiesMap[s.category].push({
            label: s.label,
            status: s.status,
            direction: s.direction
          });
        });

        const reconstructedJson = {
          meta: {
            title: reportData.title,
            week_of: reportData.week_of,
            period_covered: reportData.period_covered,
            generated: reportData.generated_at,
            last_updated: reportData.generated_at,
            update_version: reportData.update_version,
            sources: sources?.map(s => s.label) || [] // For the footer string list
          },
          research_sources: sources?.map(s => ({
            label: s.label,
            url: s.url
          })) || [],
          regime: regimes ? {
            label: regimes.label,
            color: regimes.color,
            description: regimes.description,
            updated: regimes.updated_at
          } : null,
          dominant_narratives: narratives?.map(n => ({
            id: n.id,
            type: n.type,
            tag: n.tag,
            headline: n.headline,
            summary: n.summary,
            body: n.body,
            bullets: n.bullets || [],
            market_impact: n.market_impact_text ? {
              session: n.market_impact_session,
              text: n.market_impact_text
            } : null
            // Note: If you add nested updates or sources to narratives later, you'd map them here
          })) || [],
          catalyst_calendar: catalysts?.map(c => ({
            date: c.date_str,
            date_label: c.date_label,
            time: c.time_label,
            event: c.event,
            impact: c.impact,
            flag: c.flag,
            tags: c.tags || [],
            body: c.body
          })) || [],
          market_snapshot: {
            as_of: reportData.generated_at,
            indexes: msMap.indexes,
            macro_fed: msMap.macro_fed,
            energy_volatility: msMap.energy_volatility
          },
          stories_to_track: storiesMap,
          scenarios: scenarios?.map(s => ({
            id: s.id,
            label: s.label,
            case: s.case,
            color: s.color,
            headline: s.headline,
            body: s.body
          })) || [],
          key_questions: questions?.map(q => ({
            number: q.number,
            question: q.question,
            status: q.status,
            answer: q.answer,
            update_label: q.update_label,
            update: q.update_text
          })) || []
        };

        setLiveReport(reconstructedJson);
      } catch (err: any) {
        console.error("Error fetching live report:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveReport();
  }, []);

  return { liveReport, loading, error };
}
