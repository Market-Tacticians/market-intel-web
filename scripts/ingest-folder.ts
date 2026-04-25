import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load .env.local for Supabase credentials
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { ingestReport } from '../src/lib/reports/ingestReport';

/**
 * Scans a folder for .html files and ingests them into Supabase.
 */
async function ingestFolder(folderPath: string) {
  const absolutePath = path.isAbsolute(folderPath) 
    ? folderPath 
    : path.join(__dirname, '..', folderPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Folder not found: ${absolutePath}`);
    return;
  }

  const files = fs.readdirSync(absolutePath)
    .filter(file => file.endsWith('.html'));

  console.log(`--- Starting Bulk Ingestion (${files.length} files found) ---\n`);

  for (const file of files) {
    const filePath = path.join(absolutePath, file);
    const html = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Processing: ${file}...`);
    try {
      const result = await ingestReport(html, file);
      console.log(`✅ Success: ${result.title} (${result.calendar_date})`);
    } catch (err: any) {
      console.error(`❌ Failed ${file}: ${err.message}`);
    }
    console.log('---');
  }

  console.log('\nBulk Ingestion Complete.');
}

// Get folder from command line or default to "HTML Examples"
const targetFolder = process.argv[2] || 'HTML Examples';
ingestFolder(targetFolder);
