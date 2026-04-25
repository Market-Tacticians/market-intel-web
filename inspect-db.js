const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('--- Database Schema Inspection ---\n');

  // List all tables
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tablesError) {
    // If direct information_schema access is restricted, try a simple query to a known table or use RPC if available
    console.error('Error fetching tables via information_schema:', tablesError.message);
    console.log('Attempting alternative inspection...');
    
    // Fallback: Try common table names or just report connectivity
    const { data, error } = await supabase.from('html_reports').select('*').limit(1);
    if (error) {
      console.log('Could not find "html_reports" table.');
    } else {
      console.log('Found "html_reports" table.');
    }
  } else {
    console.log('Tables found:', tables.map(t => t.table_name).join(', '));
    
    for (const table of tables) {
      console.log(`\nColumns for ${table.table_name}:`);
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', table.table_name)
        .eq('table_schema', 'public');
      
      if (columns) {
        columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
      }
    }
  }
}

inspectSchema();
