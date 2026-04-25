import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local for Supabase credentials - MUST BE BEFORE OTHER IMPORTS
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { ingestReport } from '../src/lib/reports/ingestReport';

async function runTest() {
  // Path to HTML Examples relative to this script
  const examplePath = path.join(__dirname, '..', 'HTML Examples', 'market_intelligence_brief_15.html');
  
  if (!fs.existsSync(examplePath)) {
    console.error('Example HTML file not found at:', examplePath);
    process.exit(1);
  }

  const html = fs.readFileSync(examplePath, 'utf8');
  console.log('--- Starting Ingestion Test ---\n');

  try {
    const result = await ingestReport(html, 'market_intelligence_brief_15.html');
    console.log('\n--- Success ---');
    console.log('Record ID:', result.id);
    console.log('Storage Path:', result.file_path);
  } catch (error) {
    console.error('\n--- Test Failed ---');
    console.error(error);
  }
}

runTest();
