const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function backfillSnapshots() {
  console.log('Fetching all existing reports...');
  const { data: reports, error: reportsError } = await supabaseAdmin.from('reports').select('*');
  
  if (reportsError) {
    console.error('Error fetching reports:', reportsError);
    return;
  }

  console.log(`Found ${reports.length} reports. Beginning snapshot generation...`);

  for (const reportData of reports) {
    const reportId = reportData.id;
    console.log(`\nProcessing report: ${reportData.title} (${reportId})...`);

    try {
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
        supabaseAdmin.from('report_sources').select('*').eq('report_id', reportId).order('sort_order'),
        supabaseAdmin.from('report_regimes').select('*').eq('report_id', reportId).single(),
        supabaseAdmin.from('report_narratives').select('*').eq('report_id', reportId).order('sort_order'),
        supabaseAdmin.from('report_catalysts').select('*').eq('report_id', reportId).order('sort_order'),
        supabaseAdmin.from('report_market_snapshot').select('*').eq('report_id', reportId).order('sort_order'),
        supabaseAdmin.from('report_stories_to_track').select('*').eq('report_id', reportId).order('sort_order'),
        supabaseAdmin.from('report_scenarios').select('*').eq('report_id', reportId).order('sort_order'),
        supabaseAdmin.from('report_key_questions').select('*').eq('report_id', reportId).order('sort_order')
      ]);

      const msMap = { indexes: [], macro_fed: [], energy_volatility: [] };
      snapshots?.forEach(s => {
        if (!msMap[s.category]) msMap[s.category] = [];
        msMap[s.category].push({
          label: s.label,
          value: s.value,
          direction: s.direction,
          note: s.note
        });
      });

      const storiesMap = { geopolitical_macro: [], sector_stock_signals: [] };
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
          sources: sources?.map(s => s.label) || []
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

      // Insert into report_snapshots
      const { error: insertError } = await supabaseAdmin.from('report_snapshots').insert({
        original_report_id: reportId,
        title: reportData.title,
        week_of: reportData.week_of,
        update_version: reportData.update_version || 1,
        generated_at: reportData.generated_at,
        report_json: reconstructedJson
      });

      if (insertError) {
        console.error(`Error saving snapshot for ${reportId}:`, insertError);
      } else {
        console.log(`Successfully generated and saved snapshot for ${reportData.title}!`);
      }
    } catch (err) {
      console.error(`Failed to process report ${reportId}:`, err);
    }
  }

  console.log('\nSnapshot backfill complete!');
}

backfillSnapshots();
