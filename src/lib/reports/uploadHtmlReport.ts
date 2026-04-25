import { supabase } from '../supabase';

/**
 * Uploads an HTML string to Supabase Storage.
 */
export async function uploadHtmlReport(html: string, filePath: string) {
  console.log(`Uploading file to storage: ${filePath}`);
  
  // Create a File object - this is often more reliable for Supabase to detect MIME type
  // especially in Node.js environments
  const file = new File([html], filePath, { type: 'text/html' });

  // Explicitly remove existing file to avoid header caching/upsert issues
  await supabase.storage.from('reports').remove([filePath]);

  const { data, error } = await supabase.storage
    .from('reports')
    .upload(filePath, file, {
      contentType: 'text/html',
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Error uploading to storage: ${error.message}`);
  }

  return data;
}
