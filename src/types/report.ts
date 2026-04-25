export interface Report {
  id: string;
  title: string;
  report_type: string;
  calendar_date: string; // YYYY-MM-DD
  last_updated_at: string; // ISO string
  last_updated_display: string; // "Fri Apr 24, 2026 | 4:30 PM ET"
  period_label: string;
  status_label: string;
  file_path: string;
  metadata: {
    title_tag?: string;
    masthead_title?: string;
    regime_label?: string;
    source_file_name?: string;
    [key: string]: any;
  };
  created_at?: string;
}
