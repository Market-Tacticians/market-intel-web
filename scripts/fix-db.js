const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixDb() {
  const correctLiveId = '03eae669-ebb5-4cfd-aac9-eabf0d7c54cf';

  // Update everything EXCEPT the correct live report to 'archived'
  const { data, error } = await supabaseAdmin
    .from('reports')
    .update({ status: 'archived' })
    .eq('status', 'live')
    .neq('id', correctLiveId)
    .select('id, title');

  if (error) {
    console.error("Error fixing DB:", error);
  } else {
    console.log(`Successfully archived ${data.length} rogue live reports:`);
    data.forEach(r => console.log(`- ${r.id} | ${r.title}`));
  }
}

fixDb();
