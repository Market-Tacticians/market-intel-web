import { formatInTimeZone } from 'date-fns-tz';

/**
 * Creates a deterministic, slugified filename for the report.
 * Format: {slugified-title}-{YYYY-MM-DD}-{HHMM}-et.html
 */
export function slugifyReportName(title: string, date: Date): string {
  const slugifiedTitle = title
    .toLowerCase()
    .replace(/[▶]/g, '') // Remove decorative symbols
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim hyphens

  const dateStr = formatInTimeZone(date, 'America/New_York', 'yyyy-MM-dd');
  const timeStr = formatInTimeZone(date, 'America/New_York', 'HHmm');

  return `${slugifiedTitle}-${dateStr}-${timeStr}-et.html`;
}
