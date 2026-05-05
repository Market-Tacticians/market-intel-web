const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetTest() {
  console.log('Finding current live report...');
  const { data: liveReport, error: fetchError } = await supabase
    .from('reports')
    .select('id')
    .eq('status', 'live')
    .single();

  if (liveReport) {
    console.log(`Found live report ${liveReport.id}. Deleting it to reset state...`);
    // Delete child records first to avoid foreign key constraint errors
    await supabase.from('report_regimes').delete().eq('report_id', liveReport.id);
    await supabase.from('report_narratives').delete().eq('report_id', liveReport.id);
    await supabase.from('report_catalysts').delete().eq('report_id', liveReport.id);
    await supabase.from('report_market_snapshot').delete().eq('report_id', liveReport.id);
    await supabase.from('report_stories_to_track').delete().eq('report_id', liveReport.id);
    await supabase.from('report_scenarios').delete().eq('report_id', liveReport.id);
    await supabase.from('report_key_questions').delete().eq('report_id', liveReport.id);
    await supabase.from('report_sources').delete().eq('report_id', liveReport.id);
    await supabase.from('report_snapshots').delete().eq('report_id', liveReport.id);
    
    // Delete the report itself
    const { error: deleteError } = await supabase.from('reports').delete().eq('id', liveReport.id);
    if (deleteError) {
      console.error('Failed to delete report:', deleteError);
      return;
    }
    console.log('Successfully deleted the updated live report.');
  } else {
    console.log('No live report found to delete. Proceeding with fresh ingestion...');
  }

  const filePath = path.join(__dirname, '../JSON Examples/market_intelligence_brief_05-03-26.json');
  console.log(`\nReading initialization JSON from: ${filePath}`);
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonPayload = JSON.parse(rawData);

  console.log(`Sending POST request to http://localhost:3000/api/ingest...`);
  try {
    const response = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonPayload)
    });

    const result = await response.json();
    if (result.success) {
      console.log(`\n✅ Success! The test environment has been completely reset.`);
      console.log(`New clean report_id: ${result.report_id}`);
      console.log(`You can now run 'node scripts/test-update.js' again!`);
    } else {
      console.error('Failed to ingest:', result);
    }
  } catch (error) {
    console.error('Failed to run ingestion:', error);
  }
}

resetTest();
