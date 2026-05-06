const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env.local from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchSnapshot() {
  const snapshotId = '5938bd01-5bd9-4861-b1bf-ef963c2b64a2';
  console.log(`Fetching snapshot JSON for ID: ${snapshotId}...`);

  const { data, error } = await supabase
    .from('report_snapshots')
    .select('report_json')
    .eq('id', snapshotId)
    .single();

  if (error) {
    console.error('Error fetching snapshot:', error.message);
    process.exit(1);
  }

  if (!data) {
    console.error('No snapshot found with that ID.');
    process.exit(1);
  }

  const jsonStr = JSON.stringify(data.report_json, null, 2);
  const outputPath = path.join(__dirname, '..', 'snapshot_output.json');
  fs.writeFileSync(outputPath, jsonStr);
  
  console.log(`Snapshot JSON successfully written to: ${outputPath}`);
  
  // Also print a summary of the keys to verify the "upside down" claim
  console.log('\nTop-level keys in the JSON:');
  console.log(Object.keys(data.report_json));
  
  if (data.report_json.dominant_narratives) {
    console.log(`\nDominant Narratives count: ${data.report_json.dominant_narratives.length}`);
    console.log('Position of dominant_narratives in keys:', Object.keys(data.report_json).indexOf('dominant_narratives'));
  }
}

fetchSnapshot();
