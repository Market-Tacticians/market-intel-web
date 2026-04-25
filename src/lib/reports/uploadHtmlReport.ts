import { supabase } from '../supabase';

/**
 * Uploads an HTML string to Supabase Storage.
 */
export async function uploadHtmlReport(html: string, filePath: string) {
  console.log(`Uploading file to storage: ${filePath}`);
  
  const { data, error } = await supabase.storage
    .from('reports')
    .upload(filePath, html, {
      contentType: 'text/html',
      upsert: true
    });

  if (error) {
    throw new Error(`Error uploading to storage: ${error.message}`);
  }

  return data;
}
