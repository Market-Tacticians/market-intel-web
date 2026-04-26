import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function ingestJsonFolder(folderPath: string) {
  console.log(`--- Starting JSON Ingestion from: ${folderPath} ---`);

  if (!fs.existsSync(folderPath)) {
    console.error(`Error: Folder not found at ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files.`);

  for (const file of files) {
    try {
      const fullPath = path.join(folderPath, file);
      const rawData = fs.readFileSync(fullPath, 'utf8');
      const jsonData = JSON.parse(rawData);

      // Extract key metadata
      const title = jsonData.meta?.title || 'Weekly Market Intelligence Brief';
      const calendarDate = jsonData.meta?.week_of;

      if (!calendarDate) {
        console.warn(`⚠️ Skipping ${file}: No meta.week_of found for calendar mapping.`);
        continue;
      }

      console.log(`Processing: ${title} (${calendarDate})`);

      // Upsert into json_reports
      const { data, error } = await supabase
        .from('json_reports')
        .upsert({
          calendar_date: calendarDate,
          title: title,
          report_data: jsonData
        }, {
          onConflict: 'calendar_date' // One report per date for now
        })
        .select();

      if (error) {
        console.error(`❌ Error ingesting ${file}:`, error.message);
      } else {
        console.log(`✅ Success: Ingested ${file} -> Record ID: ${data[0].id}`);
      }
    } catch (err) {
      console.error(`❌ Critical error processing ${file}:`, err);
    }
  }

  console.log('--- JSON Ingestion Complete ---');
}

const targetFolder = process.argv[2];
if (!targetFolder) {
  console.error('Usage: ts-node scripts/ingest-json.ts <folder-path>');
  process.exit(1);
}

ingestJsonFolder(targetFolder);
