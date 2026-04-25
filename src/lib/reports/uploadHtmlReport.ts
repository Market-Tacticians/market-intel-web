import { supabase } from '../supabase';

/**
 * Uploads an HTML string to Supabase Storage.
 */
export async function uploadHtmlReport(html: string, filePath: string) {
  console.log(`Uploading file to storage: ${filePath}`);
  
  // Use Blob with explicit type to force Supabase Storage to recognize Content-Type
  // Node 18+ and browsers both support new Blob()
  const body = new Blob([html], { type: 'text/html' });

  // Explicitly remove existing file to avoid header caching/upsert issues
  await supabase.storage.from('reports').remove([filePath]);

  const { data, error } = await supabase.storage
    .from('reports')
    .upload(filePath, body, {
      contentType: 'text/html',
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Error uploading to storage: ${error.message}`);
  }

  return data;
}
