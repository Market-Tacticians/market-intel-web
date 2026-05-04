const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function undo() {
  const badId = '3d55f2ea-7554-4f33-966b-de4f3fe315c4';
  
  // 1. Delete the accidental report (this cascades to child tables AND snapshots)
  const { error: delError } = await supabaseAdmin.from('reports').delete().eq('id', badId);
  if (delError) {
    console.error('Error deleting bad report:', delError);
  } else {
    console.log('Successfully deleted the accidental report.');
  }

  // 2. We need to restore the previous 'live' report. 
  // It is probably the most recent 'archived' report.
  const { data: recent, error: recentError } = await supabaseAdmin
    .from('reports')
    .select('id, title, generated_at')
    .eq('status', 'archived')
    .order('generated_at', { ascending: false })
    .limit(1);

  if (recent && recent.length > 0) {
    const oldLiveId = recent[0].id;
    console.log(`Restoring previous report to live status: ${recent[0].title} (${oldLiveId})`);
    await supabaseAdmin.from('reports').update({ status: 'live' }).eq('id', oldLiveId);
    console.log('Restore complete!');
  }
}

undo();
