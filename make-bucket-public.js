const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBucket() {
  console.log('--- Updating Reports Bucket to Public ---\n');
  const { data, error } = await supabase.storage.updateBucket('reports', {
    public: true,
    allowedMimeTypes: ['text/html'],
    fileSizeLimit: 5242880 // 5MB
  });
  
  if (error) {
    console.error('Error updating bucket:', error.message);
  } else {
    console.log('Bucket "reports" updated to public successfully.');
  }
}

updateBucket();
