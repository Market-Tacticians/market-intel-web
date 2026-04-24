export interface Report {
  id: string;
  title: string;
  reportType: string;
  calendarDate: string; // YYYY-MM-DD
  lastUpdatedAt: string; // ISO string
  lastUpdatedDisplay: string; // "Fri Apr 24, 2026 | 4:30 PM ET"
  periodLabel: string;
  statusLabel: string;
  htmlPath: string;
  extracted?: {
    titleTag: string;
    mastheadTitle: string;
    regimeLabel: string;
    sourceFileName: string;
  };
}
