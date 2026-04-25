import { Report } from "@/types/report";

export const mockReports: Report[] = [
  {
    id: "weekly-market-intelligence-brief-2026-04-24-1630-et",
    title: "Weekly Market Intelligence Brief",
    reportType: "Weekly Intel",
    calendarDate: "2026-04-24",
    lastUpdatedAt: "2026-04-24T16:30:00-04:00",
    lastUpdatedDisplay: "Fri Apr 24, 2026 | 4:30 PM ET",
    periodLabel: "Week of Apr 21–25, 2026",
    statusLabel: "Friday Close",
    htmlPath: "/reports/market_intelligence_brief_15.html",
    extracted: {
      titleTag: "Weekly Market Intelligence Brief — Week of Apr 21, 2026",
      mastheadTitle: "Weekly Market Intelligence Brief",
      regimeLabel: "Risk-Off (Cautious)",
      sourceFileName: "market_intelligence_brief_15.html"
    }
  },
  {
    id: "morning-intelligence-brief-2026-04-23-0830-et",
    title: "Morning Intelligence Brief",
    reportType: "Daily Brief",
    calendarDate: "2026-04-23",
    lastUpdatedAt: "2026-04-23T08:30:00-04:00",
    lastUpdatedDisplay: "Thu Apr 23, 2026 | 8:30 AM ET",
    periodLabel: "Apr 23, 2026",
    statusLabel: "Pre-Market",
    htmlPath: "/reports/market_intelligence_brief_14.html",
  },
  {
    id: "mid-session-alpha-report-2026-04-22-1200-et",
    title: "Mid-Session Alpha Report",
    reportType: "Alpha Report",
    calendarDate: "2026-04-22",
    lastUpdatedAt: "2026-04-22T12:00:00-04:00",
    lastUpdatedDisplay: "Wed Apr 22, 2026 | 12:00 PM ET",
    periodLabel: "Apr 22, 2026",
    statusLabel: "Intraday",
    htmlPath: "/reports/market_intelligence_brief_14.html", // Reusing sample for now
  }
];
