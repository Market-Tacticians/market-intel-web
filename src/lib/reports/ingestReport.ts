import { parseHtmlReport } from './parseHtmlReport';
import { uploadHtmlReport } from './uploadHtmlReport';
import { saveHtmlReportRecord } from './saveHtmlReportRecord';

/**
 * The complete pipeline for ingesting an HTML report.
 */
export async function ingestReport(html: string, sourceFileName: string) {
  try {
    // 1. Parse
    const parsedReport = parseHtmlReport(html, sourceFileName);
    console.log('Parsed Metadata:', JSON.stringify(parsedReport, null, 2));

    // 2. Upload to Storage
    await uploadHtmlReport(html, parsedReport.file_path);

    // 3. Save to Database
    const savedRecord = await saveHtmlReportRecord(parsedReport);
    
    console.log('Successfully ingested report:', savedRecord.id);
    return savedRecord;
  } catch (error) {
    console.error('Ingestion failed:', error);
    throw error;
  }
}
