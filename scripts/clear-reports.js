const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function clearDatabase() {
  console.log("Clearing all records from the 'reports' table...");
  
  // Fetch all report IDs first
  const { data: reports, error: fetchError } = await supabaseAdmin
    .from('reports')
    .select('id');

  if (fetchError) {
    console.error("Failed to fetch reports:", fetchError);
    return;
  }

  if (reports.length === 0) {
    console.log("Database is already empty!");
    return;
  }

  console.log(`Found ${reports.length} report(s). Deleting...`);

  // Delete all reports. Because of 'ON DELETE CASCADE' in our schema, 
  // this automatically wipes out all narratives, snapshots, catalysts, etc.
  for (const report of reports) {
    const { error: deleteError } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', report.id);
      
    if (deleteError) {
      console.error(`Failed to delete report ${report.id}:`, deleteError);
    } else {
      console.log(`Successfully deleted report ${report.id} and all cascading data.`);
    }
  }

  console.log("Database cleared successfully!");
}

clearDatabase();
