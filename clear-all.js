const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAll() {
  console.log('--- Clearing Database & Storage ---\n');

  // 1. Clear Database
  const { error: dbError } = await supabase
    .from('html_reports')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (dbError) console.error('Error clearing DB:', dbError.message);
  else console.log('Database cleared.');

  // 2. Clear Storage
  const { data: files, error: listError } = await supabase.storage
    .from('reports')
    .list();

  if (listError) console.error('Error listing storage:', listError.message);
  else if (files && files.length > 0) {
    const filePaths = files.map(f => f.name);
    const { error: storageError } = await supabase.storage
      .from('reports')
      .remove(filePaths);

    if (storageError) console.error('Error clearing storage:', storageError.message);
    else console.log(`Storage cleared (${filePaths.length} files removed).`);
  }
}

clearAll();
