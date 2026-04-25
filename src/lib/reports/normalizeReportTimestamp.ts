import { fromZonedTime } from 'date-fns-tz';

/**
 * Normalizes the raw timestamp string from the HTML into structured date fields.
 * Example Input: "Fri Apr 24, 2026 | 4:30 PM ET"
 */
export function normalizeReportTimestamp(rawTs: string) {
  // Clean string: replace &nbsp; or multiple spaces with single space
  const cleanTs = rawTs
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Regex to extract: Month, Day, Year, Hour, Minute, AM/PM
  // Example: "Fri Apr 24, 2026 | 4:30 PM ET"
  const regex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})\s+\|\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i;
  const match = cleanTs.match(regex);

  if (match) {
    const [_, month, day, year, hour, minute, ampm] = match;
    
    // Construct a simpler string for fromZonedTime: "2026-04-24 16:30"
    // We need to convert Month to number and handle AM/PM
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    
    let h = parseInt(hour, 10);
    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    
    const isoString = `${year}-${months[month]}-${day.padStart(2, '0')} ${h.toString().padStart(2, '0')}:${minute}:00`;
    
    // Convert to UTC assuming ET
    const utcDate = fromZonedTime(isoString, 'America/New_York');
    
    return {
      last_updated_at: utcDate.toISOString(),
      last_updated_display: cleanTs,
      calendar_date: `${year}-${months[month]}-${day.padStart(2, '0')}`
    };
  } else {
    console.warn('Failed to parse timestamp with regex:', cleanTs);
    const now = new Date();
    return {
      last_updated_at: now.toISOString(),
      last_updated_display: cleanTs,
      calendar_date: now.toISOString().split('T')[0]
    };
  }
}
