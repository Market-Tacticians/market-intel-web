import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assembleReportJson } from '@/lib/report-assembler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Fetch current 'live' report
    const { data: liveReport, error: liveError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('status', 'live')
      .single();

    if (liveError || !liveReport) {
      return NextResponse.json({ success: false, error: 'No live report found to update.' }, { status: 404 });
    }

    const reportId = liveReport.id;
    const newVersion = (liveReport.update_version || 1) + 1;
    const updateTimestamp = new Date().toISOString();

    // 1. Meta Updates (Version bump, timestamp)
    await supabaseAdmin
      .from('reports')
      .update({
        update_version: newVersion,
        updated_at: updateTimestamp
      })
      .eq('id', reportId);

    // If new sources provided, append them to report_sources
    if (body.meta_update?.sources && Array.isArray(body.meta_update.sources)) {
      const { data: maxOrderData } = await supabaseAdmin
        .from('report_sources')
        .select('sort_order')
        .eq('report_id', reportId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      let nextSortOrder = (maxOrderData?.[0]?.sort_order ?? 0) + 1;

      for (const source of body.meta_update.sources) {
        await supabaseAdmin.from('report_sources').insert({
          report_id: reportId,
          label: source,
          sort_order: nextSortOrder++
        });
      }
    }

    // 2. Regime Update
    if (body.regime_update) {
      await supabaseAdmin
        .from('report_regimes')
        .update({
          label: body.regime_update.label,
          color: body.regime_update.color,
          description: body.regime_update.description,
          updated_at: updateTimestamp
        })
        .eq('report_id', reportId);
    }

    if (body.dominant_narrative_updates && Array.isArray(body.dominant_narrative_updates)) {
      for (const u of body.dominant_narrative_updates) {
        // Claude indexes update IDs (e.g. "iran-hormuz-war-2") to track sequence.
        // Strip the trailing -N suffix to find the base narrative record in the DB.
        const baseNarrativeId = u.narrative_id.replace(/-\d+$/, '');

        const { data: nData } = await supabaseAdmin
          .from('report_narratives')
          .select('id, updates')
          .eq('report_id', reportId)
          .eq('narrative_id', baseNarrativeId)
          .single();

        if (nData) {
          const currentUpdates = nData.updates || [];
          // Force the backend timestamp to prevent LLM hallucination
          u.update.timestamp = updateTimestamp;
          currentUpdates.push(u.update);
          await supabaseAdmin
            .from('report_narratives')
            .update({ updates: currentUpdates, updated_at: updateTimestamp })
            .eq('id', nData.id);
        } else {
          console.warn(`[update] No narrative found for id="${baseNarrativeId}" (from Claude id="${u.narrative_id}") — skipping`);
        }
      }
    }

    // 4. Catalyst Calendar Updates & Inserts
    if (body.catalyst_calendar_updates && Array.isArray(body.catalyst_calendar_updates)) {
      for (const c of body.catalyst_calendar_updates) {
        const { data: cData } = await supabaseAdmin
          .from('report_catalysts')
          .select('id, updates')
          .eq('report_id', reportId)
          .eq('event', c.event)
          .single();

        if (cData) {
          const currentUpdates = cData.updates || [];
          if (c.update) c.update.timestamp = updateTimestamp;
          currentUpdates.push(c.update);
          const updateObj: any = { updates: currentUpdates, updated_at: updateTimestamp };
          if (c.new_impact) updateObj.impact = c.new_impact;
          if (c.new_flag) updateObj.flag = c.new_flag;

          await supabaseAdmin.from('report_catalysts').update(updateObj).eq('id', cData.id);
        }
      }
    }

    if (body.catalyst_calendar_inserts && Array.isArray(body.catalyst_calendar_inserts)) {
      const { data: maxOrderData } = await supabaseAdmin
        .from('report_catalysts')
        .select('sort_order')
        .eq('report_id', reportId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      let nextSortOrder = (maxOrderData?.[0]?.sort_order ?? 0) + 1;
      
      for (const c of body.catalyst_calendar_inserts) {
        await supabaseAdmin.from('report_catalysts').insert({
          report_id: reportId,
          date_str: c.date,
          date_label: c.date_label,
          time_label: c.time,
          event: c.event,
          impact: c.impact,
          flag: c.flag,
          tags: c.tags,
          body: c.body,
          sort_order: nextSortOrder++
        });
      }
    }

    // 5. Market Snapshot Updates
    if (body.market_snapshot_updates?.updates && Array.isArray(body.market_snapshot_updates.updates)) {
      for (const ms of body.market_snapshot_updates.updates) {
        await supabaseAdmin
          .from('report_market_snapshot')
          .update({
            value: ms.new_value,
            direction: ms.new_direction,
            note: ms.new_note,
            as_of: updateTimestamp,
            updated_at: updateTimestamp
          })
          .eq('report_id', reportId)
          .eq('category', ms.category)
          .eq('label', ms.label);
      }
    }

    // 6. Stories to Track Updates & Inserts
    if (body.stories_to_track_updates && Array.isArray(body.stories_to_track_updates)) {
      for (const s of body.stories_to_track_updates) {
        const { data: sData } = await supabaseAdmin
          .from('report_stories_to_track')
          .select('id, updates')
          .eq('report_id', reportId)
          .eq('category', s.category)
          .eq('label', s.label)
          .single();

        if (sData) {
          const updateObj: any = { updated_at: updateTimestamp };
          if (s.update) {
            s.update.timestamp = updateTimestamp;
            const currentUpdates = sData.updates || [];
            currentUpdates.push(s.update);
            updateObj.updates = currentUpdates;
          }
          if (s.new_status) updateObj.status = s.new_status;
          if (s.new_direction) updateObj.direction = s.new_direction;

          await supabaseAdmin.from('report_stories_to_track').update(updateObj).eq('id', sData.id);
        }
      }
    }

    if (body.stories_to_track_inserts && Array.isArray(body.stories_to_track_inserts)) {
      const { data: maxOrderData } = await supabaseAdmin
        .from('report_stories_to_track')
        .select('sort_order')
        .eq('report_id', reportId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      let nextSortOrder = (maxOrderData?.[0]?.sort_order ?? 0) + 1;
      
      for (const s of body.stories_to_track_inserts) {
        await supabaseAdmin.from('report_stories_to_track').insert({
          report_id: reportId,
          category: s.category,
          label: s.label,
          status: s.status,
          direction: s.direction,
          sort_order: nextSortOrder++
        });
      }
    }

    // 7. Scenario Updates
    if (body.scenario_updates && Array.isArray(body.scenario_updates)) {
      for (const sc of body.scenario_updates) {
        const { data: scData } = await supabaseAdmin
          .from('report_scenarios')
          .select('id, updates')
          .eq('report_id', reportId)
          .eq('scenario_id', sc.id)
          .single();

        if (scData) {
          const currentUpdates = scData.updates || [];
          if (sc.update) sc.update.timestamp = updateTimestamp;
          currentUpdates.push(sc.update);
          await supabaseAdmin.from('report_scenarios').update({ updates: currentUpdates, updated_at: updateTimestamp }).eq('id', scData.id);
        }
      }
    }

    // 8. Key Questions Updates
    if (body.key_questions_updates && Array.isArray(body.key_questions_updates)) {
      for (const q of body.key_questions_updates) {
        const { data: qData } = await supabaseAdmin
          .from('report_key_questions')
          .select('id, updates')
          .eq('report_id', reportId)
          .eq('number', q.number)
          .single();

        if (qData) {
          const updateObj: any = { updated_at: updateTimestamp };
          if (q.update) {
            q.update.timestamp = updateTimestamp;
            const currentUpdates = qData.updates || [];
            currentUpdates.push(q.update);
            updateObj.updates = currentUpdates;
          }
          if (q.new_status) updateObj.status = q.new_status;
          if (q.new_update_label) updateObj.update_label = q.new_update_label;
          if (q.new_answer) updateObj.answer = q.new_answer;

          await supabaseAdmin.from('report_key_questions').update(updateObj).eq('id', qData.id);
        }
      }
    }

    // 9. Research Sources Inserts
    if (body.research_sources_update && Array.isArray(body.research_sources_update)) {
      // Find max sort_order
      const { data: maxOrderData } = await supabaseAdmin
        .from('report_sources')
        .select('sort_order')
        .eq('report_id', reportId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      let nextSortOrder = (maxOrderData?.[0]?.sort_order ?? 0) + 1;

      // Note: We might need to add a `tag` column to `report_sources` in the DB if we want to store it.
      // But for now, we just insert label and url, which the DB schema currently supports.
      for (const source of body.research_sources_update) {
        await supabaseAdmin.from('report_sources').insert({
          report_id: reportId,
          label: source.label,
          url: source.url,
          sort_order: nextSortOrder++
        });
      }
    }

    // 10. GENERATE SNAPSHOT
    // Fetch the updated liveReport again to get the latest generated_at
    const { data: updatedLiveReport } = await supabaseAdmin.from('reports').select('*').eq('id', reportId).single();
    
    // Assemble the complete JSON using the helper
    const completeJson = await assembleReportJson(supabaseAdmin, updatedLiveReport);

    // Insert into report_snapshots
    const { data: snapshotData, error: snapshotError } = await supabaseAdmin.from('report_snapshots').insert({
      original_report_id: reportId,
      title: updatedLiveReport.title,
      week_of: updatedLiveReport.week_of,
      update_version: newVersion,
      generated_at: updateTimestamp,
      report_json: completeJson
    }).select('id').single();

    if (snapshotError) {
      console.error('Failed to create report snapshot:', snapshotError);
      throw snapshotError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Report successfully updated to version ${newVersion} and snapshotted!`,
      version: newVersion,
      snapshot_id: snapshotData.id
    });

  } catch (error: any) {
    console.error('Failed to process update:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
