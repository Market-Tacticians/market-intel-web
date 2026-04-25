const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  console.log('--- Creating Reports Bucket ---\n');
  const { data, error } = await supabase.storage.createBucket('reports', {
    public: false, // Keeping it private for security, we will use signed URLs or Service Role access
    allowedMimeTypes: ['text/html'],
    fileSizeLimit: 5242880 // 5MB
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket "reports" already exists.');
    } else {
      console.error('Error creating bucket:', error.message);
    }
  } else {
    console.log('Bucket "reports" created successfully.');
  }
}

createBucket();
