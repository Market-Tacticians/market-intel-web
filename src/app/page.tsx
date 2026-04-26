'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import Navigation, { TabType } from '@/components/Navigation';
import Calendar from '@/components/Calendar';
import ReportList from '@/components/ReportList';
import ReportViewer from '@/components/ReportViewer';
import DailyReportModal from '@/components/DailyReportModal';
import { useReports } from '@/hooks/useReports';
import { Report } from '@/types/report';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Archive specific state
  const [archiveDate, setArchiveDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { reports, loading, error } = useReports();

  // --- Logic for Calendar ---
  const activeDates = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.calendar_date)));
  }, [reports]);

  const reportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      counts[r.calendar_date] = (counts[r.calendar_date] || 0) + 1;
    });
    return counts;
  }, [reports]);

  const reportsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return reports
      .filter(r => r.calendar_date === selectedDate)
      .sort((a, b) => new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime());
  }, [selectedDate, reports]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  // --- Logic for Archive ---
  const reportsForArchiveDate = useMemo(() => {
    return reports
      .filter(r => r.calendar_date === archiveDate)
      .sort((a, b) => new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime());
  }, [archiveDate, reports]);

  return (
    <div className="app-layout">
      <Navigation activeTab={activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        setSelectedDate(null);
        setShowModal(false);
      }} />
      
      <main className="app-main">
        <header className="app-header">
          <div className="header-breadcrumbs mono text-[10px] uppercase text-muted">
            Terminal / {activeTab} {activeTab === 'calendar' && selectedDate && `/ ${selectedDate}`}
          </div>
          <div className="header-actions">
            <button className="btn mono text-xs" onClick={() => window.location.reload()}>RELOAD CORE</button>
          </div>
        </header>

        <div className="content-container">
          {loading && reports.length === 0 ? (
            <div className="p-20 text-center mono animate-pulse">SYNCHRONIZING INTEL...</div>
          ) : error ? (
            <div className="p-20 text-center mono text-danger">CONNECTION ERROR: {error}</div>
          ) : activeTab === 'calendar' ? (
            /* --- CALENDAR VIEW --- */
            <div className="tab-calendar animate-fade-in flex items-center justify-center p-12">
              <Calendar 
                activeDates={activeDates}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                reportCounts={reportCounts}
              />
            </div>
          ) : (
            /* --- ARCHIVE VIEW (Organized) --- */
            <div className="tab-archive animate-fade-in h-full">
              <div className="archive-layout h-full">
                <div className="archive-sidebar">
                  <div className="archive-selector-group">
                    <h4>Select Historical Node</h4>
                    <div className="archive-calendar-mini">
                      <Calendar 
                        activeDates={activeDates}
                        selectedDate={archiveDate}
                        onDateSelect={setArchiveDate}
                        reportCounts={reportCounts}
                        variant="mini"
                      />
                    </div>
                  </div>
                </div>

                <div className="archive-results">
                  <div className="archive-header mb-8">
                    <h2 className="section-title">Intel Results: {format(new Date(archiveDate + 'T12:00:00Z'), 'MMMM d, yyyy')}</h2>
                    <p className="text-secondary mono text-xs uppercase mt-2">
                      Synchronization: {reportsForArchiveDate.length} Nodes Found
                    </p>
                  </div>
                  
                  {reportsForArchiveDate.length > 0 ? (
                    <ReportList 
                      reports={reportsForArchiveDate} 
                      onReportSelect={setSelectedReport}
                    />
                  ) : (
                    <div className="empty-state">
                      <p>NO INTELLIGENCE RECORDED FOR THIS DATE</p>
                      <p className="opacity-40 mt-2 text-[10px]">Select a highlighted date in the calendar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      {showModal && selectedDate && (
        <DailyReportModal
          date={selectedDate}
          reports={reportsForSelectedDate}
          onSelectReport={(report) => {
            setSelectedReport(report);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
      
      <style jsx>{`
        .app-layout {
          display: flex;
          height: 100vh;
          padding: 20px;
          gap: 20px;
          overflow: hidden;
        }
        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0; /* Prevents overflow-x */
        }
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 0.5rem;
          flex-shrink: 0;
        }
        .content-container {
          flex: 1;
          min-height: 0; /* Important for flex-grow with overflow */
        }
        .tab-calendar, .tab-archive {
          height: 100%;
        }
        @media (max-width: 1024px) {
          .app-layout {
            flex-direction: column;
            height: auto;
            min-height: 100vh;
            padding-bottom: 80px;
            overflow: auto;
          }
          .archive-layout {
            grid-template-columns: 1fr;
          }
          .archive-sidebar {
            border-right: none;
            border-bottom: 1px solid var(--border);
            padding-right: 0;
            padding-bottom: 24px;
          }
        }
      `}</style>
    </div>
  );
}
