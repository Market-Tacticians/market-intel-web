const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function migrateLegacyFiles() {
  const legacyDir = path.join(__dirname, '../JSON Examples/Legacy JSONs');
  
  if (!fs.existsSync(legacyDir)) {
    console.error(`Legacy directory not found: ${legacyDir}`);
    return;
  }

  const files = fs.readdirSync(legacyDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} legacy JSON files. Beginning migration...`);

  for (const file of files) {
    console.log(`\nProcessing ${file}...`);
    const filePath = path.join(legacyDir, file);
    const rawData = fs.readFileSync(filePath, 'utf8');
    
    let body;
    try {
      body = JSON.parse(rawData);
    } catch (e) {
      console.error(`Failed to parse ${file}:`, e);
      continue;
    }

    if (!body.meta) {
      console.error(`Skipping ${file}: Missing 'meta' block.`);
      continue;
    }

    try {
      // 1. Insert report as ARCHIVED
      const { data: reportData, error: reportError } = await supabaseAdmin
        .from('reports')
        .insert({
          title: body.meta.title || "Legacy Intelligence Brief",
          week_of: body.meta.week_of,
          period_covered: body.meta.period_covered,
          generated_at: body.meta.last_updated || body.meta.generated,
          update_version: body.meta.update_version || 1,
          status: 'archived' // EXPLICITLY ARCHIVED
        })
        .select()
        .single();

      if (reportError) throw reportError;
      const reportId = reportData.id;

      // 2. Insert report_regimes
      if (body.regime) {
        const { error } = await supabaseAdmin.from('report_regimes').insert({
          report_id: reportId,
          label: body.regime.label,
          color: body.regime.color,
          description: body.regime.description
        });
        if (error) throw error;
      }

      // 3. Insert report_narratives
      if (body.dominant_narratives && Array.isArray(body.dominant_narratives)) {
        const narratives = body.dominant_narratives.map((n, index) => ({
          report_id: reportId,
          narrative_id: n.id,
          type: n.type,
          tag: n.tag,
          headline: n.headline,
          summary: n.summary || null,
          body: n.body || null,
          bullets: n.bullets || null,
          market_impact: n.market_impact || null,
          sources: n.sources || null,
          updates: n.updates || null, // Captures the nested story_thread updates perfectly!
          sort_order: index
        }));
        const { error } = await supabaseAdmin.from('report_narratives').insert(narratives);
        if (error) throw error;
      }

      // 4. Insert report_catalysts
      if (body.catalyst_calendar && Array.isArray(body.catalyst_calendar)) {
        const catalysts = body.catalyst_calendar.map((c, index) => ({
          report_id: reportId,
          date_str: c.date,
          date_label: c.date_label,
          time_label: c.time || null,
          event: c.event,
          impact: c.impact || null,
          flag: c.flag || null,
          tags: c.tags || [],
          body: c.body || null,
          updates: c.updates || null,
          sort_order: index
        }));
        const { error } = await supabaseAdmin.from('report_catalysts').insert(catalysts);
        if (error) throw error;
      }

      // 5. Insert report_market_snapshot
      if (body.market_snapshot) {
        const ms = body.market_snapshot;
        const msData = [];
        let sortOrder = 0;
        
        const categories = ['indexes', 'macro_fed', 'energy_volatility'];
        categories.forEach(cat => {
          if (ms[cat] && Array.isArray(ms[cat])) {
            ms[cat].forEach((item) => {
              
              // Handle legacy change_wk and change_ytd by appending to note
              let finalNote = item.note || "";
              const legacyAppend = [];
              if (item.change_wk) legacyAppend.push(`Wk: ${item.change_wk}`);
              if (item.change_ytd) legacyAppend.push(`YTD: ${item.change_ytd}`);
              
              if (legacyAppend.length > 0) {
                const appendStr = legacyAppend.join(' | ');
                finalNote = finalNote ? `${finalNote} | ${appendStr}` : appendStr;
              }

              msData.push({
                report_id: reportId,
                as_of: ms.as_of,
                category: cat,
                label: item.label,
                value: item.value,
                direction: item.direction || null,
                note: finalNote || null,
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

      // 6. Insert report_stories_to_track
      if (body.stories_to_track) {
        const st = body.stories_to_track;
        const stData = [];
        let sortOrder = 0;
        
        Object.keys(st).forEach(cat => {
          if (Array.isArray(st[cat])) {
            st[cat].forEach((item) => {
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

      // 7. Insert report_scenarios
      if (body.scenarios && Array.isArray(body.scenarios)) {
        const scenarios = body.scenarios.map((s, index) => ({
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

      // 8. Insert report_key_questions
      if (body.key_questions && Array.isArray(body.key_questions)) {
        const questions = body.key_questions.map((q, index) => ({
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

      // 9. Insert report_sources
      // Handle both meta.sources (string array) and research_sources (object array)
      const finalSources = [];
      if (body.research_sources && Array.isArray(body.research_sources)) {
        body.research_sources.forEach((s, index) => {
          finalSources.push({
            report_id: reportId,
            label: s.label,
            url: s.url || null,
            sort_order: index
          });
        });
      } else if (body.meta.sources && Array.isArray(body.meta.sources)) {
        body.meta.sources.forEach((s, index) => {
          const label = typeof s === 'string' ? s : s.label;
          finalSources.push({
            report_id: reportId,
            label: label,
            url: null,
            sort_order: index
          });
        });
      }

      if (finalSources.length > 0) {
        const { error } = await supabaseAdmin.from('report_sources').insert(finalSources);
        if (error) throw error;
      }

      console.log(`Successfully migrated ${file} -> Report ID: ${reportId}`);
    } catch (err) {
      console.error(`Database error migrating ${file}:`, err);
    }
  }

  console.log("\nMigration complete!");
}

migrateLegacyFiles();
