import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need a Supabase client with the SERVICE ROLE KEY to bypass RLS for inserts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize admin client (only safe to do securely on the server side)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body || !body.meta) {
      return NextResponse.json({ success: false, error: "Invalid JSON format: missing 'meta'" }, { status: 400 });
    }

    // 1. Mark existing 'live' reports as 'archived'
    // We unconditionally archive any existing live report before inserting the new one.
    await supabaseAdmin
      .from('reports')
      .update({ status: 'archived' })
      .eq('status', 'live');

    // 2. Insert new 'live' report
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        title: body.meta.title,
        week_of: body.meta.week_of,
        period_covered: body.meta.period_covered,
        generated_at: body.meta.last_updated || body.meta.generated,
        update_version: body.meta.update_version || 1,
        status: 'live'
      })
      .select()
      .single();

    if (reportError) throw reportError;
    const reportId = reportData.id;

    // 3. Insert report_regimes
    if (body.regime) {
      const { error } = await supabaseAdmin.from('report_regimes').insert({
        report_id: reportId,
        label: body.regime.label,
        color: body.regime.color,
        description: body.regime.description
      });
      if (error) throw error;
    }

    // 4. Insert report_narratives
    if (body.dominant_narratives && Array.isArray(body.dominant_narratives)) {
      const narratives = body.dominant_narratives.map((n: any, index: number) => ({
        report_id: reportId,
        narrative_id: n.id,
        type: n.type,
        tag: n.tag,
        headline: n.headline,
        summary: n.summary,
        body: n.body,
        bullets: n.bullets || null,
        market_impact: n.market_impact || null,
        sources: n.sources || null,
        updates: n.updates || null,
        sort_order: index
      }));
      const { error } = await supabaseAdmin.from('report_narratives').insert(narratives);
      if (error) throw error;
    }

    // 5. Insert report_catalysts
    if (body.catalyst_calendar && Array.isArray(body.catalyst_calendar)) {
      const catalysts = body.catalyst_calendar.map((c: any, index: number) => ({
        report_id: reportId,
        date_str: c.date,
        date_label: c.date_label,
        time_label: c.time,
        event: c.event,
        impact: c.impact,
        flag: c.flag,
        tags: c.tags,
        body: c.body,
        updates: c.updates || null,
        sort_order: index
      }));
      const { error } = await supabaseAdmin.from('report_catalysts').insert(catalysts);
      if (error) throw error;
    }

    // 6. Insert report_market_snapshot
    if (body.market_snapshot) {
      const ms = body.market_snapshot;
      const msData: any[] = [];
      let sortOrder = 0;
      
      const categories = ['indexes', 'macro_fed', 'energy_volatility'];
      categories.forEach(cat => {
        if (ms[cat] && Array.isArray(ms[cat])) {
          ms[cat].forEach((item: any) => {
            msData.push({
              report_id: reportId,
              as_of: ms.as_of,
              category: cat,
              label: item.label,
              value: item.value,
              direction: item.direction || null,
              note: item.note || null,
              sort_order: sortOrder++
            });
          });
        }
      });
      
      if (msData.length > 0) {
        const { error } = await supabaseAdmin.from('report_market_snapshot').insert(msData);
        if (error) throw error;
      }
    }

    // 7. Insert report_stories_to_track
    if (body.stories_to_track) {
      const st = body.stories_to_track;
      const stData: any[] = [];
      let sortOrder = 0;
      
      Object.keys(st).forEach(cat => {
        if (Array.isArray(st[cat])) {
          st[cat].forEach((item: any) => {
            stData.push({
              report_id: reportId,
              category: cat,
              label: item.label,
              status: item.status,
              direction: item.direction || null,
              updates: item.updates || null,
              sort_order: sortOrder++
            });
          });
        }
      });
      
      if (stData.length > 0) {
        const { error } = await supabaseAdmin.from('report_stories_to_track').insert(stData);
        if (error) throw error;
      }
    }

    // 8. Insert report_scenarios
    if (body.scenarios && Array.isArray(body.scenarios)) {
      const scenarios = body.scenarios.map((s: any, index: number) => ({
        report_id: reportId,
        scenario_id: s.id,
        label: s.label,
        case_name: s.case,
        color: s.color,
        headline: s.headline,
        body: s.body,
        updates: s.updates || null,
        sort_order: index
      }));
      const { error } = await supabaseAdmin.from('report_scenarios').insert(scenarios);
      if (error) throw error;
    }

    // 9. Insert report_key_questions
    if (body.key_questions && Array.isArray(body.key_questions)) {
      const questions = body.key_questions.map((q: any, index: number) => ({
        report_id: reportId,
        number: q.number,
        question: q.question,
        status: q.status,
        update_label: q.update_label || null,
        answer: q.answer || null,
        updates: q.updates || null,
        sort_order: index
      }));
      const { error } = await supabaseAdmin.from('report_key_questions').insert(questions);
      if (error) throw error;
    }

    // 10. Insert report_sources
    if (body.research_sources && Array.isArray(body.research_sources)) {
      const sources = body.research_sources.map((s: any, index: number) => {
        return {
          report_id: reportId,
          label: s.label,
          url: s.url || null,
          sort_order: index
        };
      });
      if (sources.length > 0) {
        const { error } = await supabaseAdmin.from('report_sources').insert(sources);
        if (error) throw error;
      }
    }

    // 11. Create a Snapshot of the newly ingested report (v1)
    // The incoming body is already perfectly formatted as the full JSON
    const { error: snapshotError } = await supabaseAdmin.from('report_snapshots').insert({
      original_report_id: reportId,
      title: body.meta.title,
      week_of: body.meta.week_of,
      update_version: body.meta.update_version || 1,
      generated_at: body.meta.last_updated || body.meta.generated,
      report_json: body
    });

    if (snapshotError) throw snapshotError;

    return NextResponse.json({ success: true, message: "Report ingested and snapshotted successfully!", report_id: reportId });
  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
