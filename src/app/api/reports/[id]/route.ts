import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // We can use the anon client for public read

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 requires params to be awaited
    const { id } = await params;

    // 1. Check if the ID belongs to an archived snapshot first
    if (id !== 'live') {
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('report_snapshots')
        .select('report_json')
        .eq('id', id)
        .single();
        
      if (!snapshotError && snapshotData && snapshotData.report_json) {
        return NextResponse.json({ success: true, data: snapshotData.report_json });
      }
    }

    // 2. Fall back to assembling the live/relational report
    let query = supabase.from('reports').select('*');
    if (id === 'live') {
      query = query.eq('status', 'live');
    } else {
      query = query.eq('id', id);
    }
    
    const { data: reportData, error: reportError } = await query.single();

    if (reportError) {
      if (reportError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
      }
      throw reportError;
    }
    
    if (!reportData) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const reportId = reportData.id;

    // Concurrently fetch all child data
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
        id: n.narrative_id,
        type: n.type,
        tag: n.tag,
        headline: n.headline,
        summary: n.summary,
        body: n.body,
        bullets: n.bullets || [],
        market_impact: n.market_impact || null,
        sources: n.sources || [],
        updates: n.updates || []
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

    return NextResponse.json({ success: true, data: reconstructedJson });
  } catch (error: any) {
    console.error('Fetch report error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
