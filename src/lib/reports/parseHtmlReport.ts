import * as cheerio from 'cheerio';
import { normalizeReportTimestamp } from './normalizeReportTimestamp';
import { slugifyReportName } from './slugifyReportName';

export type ParsedHtmlReport = {
  title: string;
  report_type: string | null;
  calendar_date: string;
  last_updated_at: string;
  last_updated_display: string | null;
  period_label: string | null;
  status_label: string | null;
  file_path: string;
  metadata: Record<string, any>;
};

/**
 * Parses an HTML report string and extracts metadata.
 */
export function parseHtmlReport(html: string, sourceFileName: string): ParsedHtmlReport {
  const $ = cheerio.load(html);

  // 1. Extract Title
  let title = $('.masthead h1').text().trim();
  if (!title) title = $('title').text().trim();
  if (!title) title = 'Untitled Report';
  
  // Clean title
  title = title.replace(/[▶]/g, '').trim();

  // 2. Extract Period Label
  const period_label = $('.masthead .meta').text().trim();

  // 3. Extract Timestamp
  const rawTs = $('.timestamp-badge .ts-value').text().trim();
  const { last_updated_at, last_updated_display, calendar_date } = normalizeReportTimestamp(rawTs);

  // 4. Infer Report Type
  let report_type = 'Other';
  if (title.includes('Weekly Market Intelligence Brief')) {
    report_type = 'Weekly Intel';
  } else if (title.includes('Daily')) {
    report_type = 'Daily Brief';
  } else if (title.includes('Market Review')) {
    report_type = 'Market Review';
  }

  // 5. Infer Status Label
  let status_label = 'Update';
  const hours = new Date(last_updated_at).getHours();
  const day = new Date(last_updated_at).getDay(); // 5 = Friday

  if (day === 5 && hours >= 16) {
    status_label = 'Friday Close';
  } else if (hours < 9) {
    status_label = 'Pre-Market';
  } else if (hours >= 16) {
    status_label = 'Market Close';
  }

  // 6. Metadata
  const metadata = {
    title_tag: $('title').text().trim(),
    masthead_title: title,
    subtitle: $('.subtitle').text().trim(),
    regime_label: $('.regime-label').text().trim(),
    source_file_name: sourceFileName,
    raw_last_updated_display: rawTs,
    extracted_from_html: true
  };

  // 7. File Path
  const file_path = slugifyReportName(title, new Date(last_updated_at));

  return {
    title,
    report_type,
    calendar_date,
    last_updated_at,
    last_updated_display,
    period_label,
    status_label,
    file_path,
    metadata
  };
}
