const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeaders() {
  const { data: reports } = await supabase.from('html_reports').select('*').limit(1);
  if (reports && reports.length > 0) {
    const report = reports[0];
    const { data } = supabase.storage.from('reports').getPublicUrl(report.file_path);
    console.log('Public URL:', data.publicUrl);
    
    try {
      const resp = await fetch(data.publicUrl, { method: 'HEAD' });
      console.log('Content-Type:', resp.headers.get('content-type'));
    } catch (e) {
      console.error('Fetch failed:', e.message);
    }
  }
}

checkHeaders();
