const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listReports() {
  const { data, error } = await supabase
    .from('html_reports')
    .select('*')
    .order('last_updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error.message);
  } else {
    console.log(`--- Total Reports: ${data.length} ---\n`);
    data.forEach(r => {
      console.log(`[${r.calendar_date}] ${r.title}`);
      console.log(`  Updated: ${r.last_updated_display}`);
      console.log(`  Path: ${r.file_path}\n`);
    });
  }
}

listReports();
