const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetadata() {
  const { data: reports } = await supabase.from('html_reports').select('*').limit(1);
  if (reports && reports.length > 0) {
    const report = reports[0];
    const { data: files, error } = await supabase.storage.from('reports').list('', {
      search: report.file_path
    });

    if (error) console.error('Error listing:', error.message);
    else if (files && files.length > 0) {
      const file = files.find(f => f.name === report.file_path);
      console.log('File Name:', file.name);
      console.log('Metadata:', JSON.stringify(file.metadata, null, 2));
    }
  }
}

checkMetadata();
