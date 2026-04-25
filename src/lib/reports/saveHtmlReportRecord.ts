import { supabase } from '../supabase';
import { ParsedHtmlReport } from './parseHtmlReport';

/**
 * Saves or updates a report record in the database.
 * Logical key: title + last_updated_at
 */
export async function saveHtmlReportRecord(report: ParsedHtmlReport) {
  // First, check if a report with the same title and timestamp exists
  const { data: existing, error: fetchError } = await supabase
    .from('html_reports')
    .select('id')
    .eq('title', report.title)
    .eq('last_updated_at', report.last_updated_at)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
    throw new Error(`Error checking for duplicates: ${fetchError.message}`);
  }

  if (existing) {
    console.log(`Updating existing report record: ${existing.id}`);
    const { data, error } = await supabase
      .from('html_reports')
      .update({
        report_type: report.report_type,
        calendar_date: report.calendar_date,
        last_updated_display: report.last_updated_display,
        period_label: report.period_label,
        status_label: report.status_label,
        file_path: report.file_path,
        metadata: report.metadata
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`Error updating report: ${error.message}`);
    return data;
  } else {
    console.log(`Creating new report record: ${report.title}`);
    const { data, error } = await supabase
      .from('html_reports')
      .insert([report])
      .select()
      .single();

    if (error) throw new Error(`Error inserting report: ${error.message}`);
    return data;
  }
}
