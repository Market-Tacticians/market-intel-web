import { fromZonedTime } from 'date-fns-tz';

/**
 * Normalizes the raw timestamp string from the HTML or Filename into structured date fields.
 * Pattern 1: "Fri Apr 24, 2026 | 4:30 PM ET"
 * Pattern 2: "MM-DD-YY" (from filename)
 */
export function normalizeReportTimestamp(rawTs: string, sourceFileName?: string) {
  // 1. Try Filename Parsing first as it's the user's preferred source now
  if (sourceFileName) {
    const fileDateRegex = /(\d{2})-(\d{2})-(\d{2})/; // MM-DD-YY
    const fileMatch = sourceFileName.match(fileDateRegex);
    if (fileMatch) {
      const [_, month, day, yearShort] = fileMatch;
      const year = `20${yearShort}`;
      const isoDate = `${year}-${month}-${day}`;
      
      // Default to 9:00 AM ET for filename-only dates
      const utcDate = fromZonedTime(`${isoDate} 09:00:00`, 'America/New_York');
      
      console.log(`Parsed date from filename: ${isoDate}`);
      return {
        last_updated_at: utcDate.toISOString(),
        last_updated_display: `Extracted from filename: ${month}-${day}-${yearShort}`,
        calendar_date: isoDate
      };
    }
  }

  // 2. Fallback to HTML regex parsing
  const cleanTs = rawTs
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const htmlRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})\s+\|\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i;
  const htmlMatch = cleanTs.match(htmlRegex);

  if (htmlMatch) {
    const [_, month, day, year, hour, minute, ampm] = htmlMatch;
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    
    let h = parseInt(hour, 10);
    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    
    const isoString = `${year}-${months[month]}-${day.padStart(2, '0')} ${h.toString().padStart(2, '0')}:${minute}:00`;
    const utcDate = fromZonedTime(isoString, 'America/New_York');
    
    return {
      last_updated_at: utcDate.toISOString(),
      last_updated_display: cleanTs,
      calendar_date: `${year}-${months[month]}-${day.padStart(2, '0')}`
    };
  }

  // 3. Final fallback
  console.warn('Failed to parse timestamp from any source:', { rawTs, sourceFileName });
  const now = new Date();
  return {
    last_updated_at: now.toISOString(),
    last_updated_display: cleanTs || 'Unknown Timestamp',
    calendar_date: now.toISOString().split('T')[0]
  };
}
