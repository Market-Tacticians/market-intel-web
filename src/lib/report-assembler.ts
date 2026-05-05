export async function assembleReportJson(supabase: any, reportData: any) {
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
  snapshots?.forEach((s: any) => {
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
  stories?.forEach((s: any) => {
    if (!storiesMap[s.category]) storiesMap[s.category] = [];
    storiesMap[s.category].push({
      label: s.label,
      status: s.status,
      direction: s.direction,
      updates: s.updates || []
    });
  });

  const reconstructedJson = {
    meta: {
      title: reportData.title,
      week_of: reportData.week_of,
      period_covered: reportData.period_covered,
      generated: reportData.generated_at,
      last_updated: reportData.updated_at || reportData.generated_at,
      update_version: reportData.update_version,
      sources: sources?.map((s: any) => s.label) || [] // For the footer string list
    },
    research_sources: sources?.map((s: any) => ({
      label: s.label,
      url: s.url
    })) || [],
    regime: regimes ? {
      label: regimes.label,
      color: regimes.color,
      description: regimes.description,
      updated: regimes.updated_at
    } : null,
    dominant_narratives: narratives?.map((n: any) => ({
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
    catalyst_calendar: catalysts?.map((c: any) => ({
      date: c.date_str,
      date_label: c.date_label,
      time: c.time_label,
      event: c.event,
      impact: c.impact,
      flag: c.flag,
      tags: c.tags || [],
      body: c.body,
      updates: c.updates || []
    })) || [],
    market_snapshot: {
      as_of: reportData.updated_at || reportData.generated_at,
      indexes: msMap.indexes,
      macro_fed: msMap.macro_fed,
      energy_volatility: msMap.energy_volatility
    },
    stories_to_track: {
      as_of: reportData.updated_at || reportData.generated_at,
      geopolitical_macro: storiesMap.geopolitical_macro,
      sector_stock_signals: storiesMap.sector_stock_signals
    },
    scenarios: scenarios?.map((s: any) => ({
      id: s.scenario_id,
      label: s.label,
      case: s.case_name,
      color: s.color,
      headline: s.headline,
      body: s.body,
      updates: s.updates || []
    })) || [],
    key_questions: questions?.map((q: any) => ({
      number: q.number,
      question: q.question,
      status: q.status,
      answer: q.answer,
      update_label: q.update_label,
      updates: q.updates || []
    })) || []
  };

  return reconstructedJson;
}
