const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function audit() {
  const { data: liveReports, error } = await supabaseAdmin
    .from('reports')
    .select('id, title, generated_at, status')
    .eq('status', 'live');
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${liveReports.length} 'live' reports:`);
    liveReports.forEach(r => console.log(`- ${r.id} | ${r.title} | ${r.generated_at}`));
  }
}

audit();
