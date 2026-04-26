const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateReport() {
  const targetId = '291f4536-7232-4607-90cc-daf2e39b2478';
  const newPeriodLabel = 'Week of Apr 26 - May 1, 2026';

  console.log(`Updating report ${targetId}...`);

  const { data, error } = await supabase
    .from('html_reports')
    .update({ period_label: newPeriodLabel })
    .eq('id', targetId)
    .select();

  if (error) {
    console.error('Error updating report:', error.message);
  } else {
    console.log('Update successful:', data);
  }
}

updateReport();
