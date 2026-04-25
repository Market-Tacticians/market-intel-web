'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import Navigation, { TabType } from '@/components/Navigation';
import Calendar from '@/components/Calendar';
import ReportList from '@/components/ReportList';
import ReportViewer from '@/components/ReportViewer';
import { useReports } from '@/hooks/useReports';
import { Report } from '@/types/report';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { reports, loading, error } = useReports();

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

  const renderTabContent = () => {
    if (loading && reports.length === 0) {
      return <div className="p-20 text-center mono animate-pulse">SYNCHRONIZING INTEL...</div>;
    }

    if (error) {
      return <div className="p-20 text-center mono text-danger">CONNECTION ERROR: {error}</div>;
    }

    switch (activeTab) {
      case 'calendar':
        return (
          <div className="tab-calendar animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-9">
                <Calendar 
                  activeDates={activeDates}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  reportCounts={reportCounts}
                />
              </div>
              <div className="lg:col-span-3">
                {selectedDate ? (
                  <div className="selected-date-info glass-panel p-6 border-hi">
                    <h2 className="mono mb-4 text-accent border-bottom pb-2">
                      {format(new Date(selectedDate + 'T12:00:00Z'), 'MMMM d, yyyy')}
                    </h2>
                    <ReportList 
                      reports={reportsForSelectedDate} 
                      onReportSelect={setSelectedReport}
                    />
                  </div>
                ) : (
                  <div className="p-12 glass-panel border-dashed text-center opacity-40">
                    <p className="mono text-xs uppercase tracking-widest">Select Node to View Daily Briefings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'archive':
        return (
          <div className="tab-archive animate-fade-in">
            <div className="archive-header mb-8">
              <h2 className="section-title">Master Intelligence Archive</h2>
              <p className="text-secondary mono text-xs uppercase mt-2">Historical Records Synchronization: Active ({reports.length} Reports)</p>
            </div>
            <div className="archive-grid">
              <ReportList 
                reports={reports} 
                onReportSelect={setSelectedReport}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-layout">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="app-main">
        <header className="app-header">
          <div className="header-breadcrumbs mono text-[10px] uppercase text-muted">
            Terminal / {activeTab} {selectedDate && `/ ${selectedDate}`}
          </div>
          <div className="header-actions">
            <button className="btn mono text-xs" onClick={() => window.location.reload()}>RELOAD CORE</button>
          </div>
        </header>

        <div className="content-container">
          {renderTabContent()}
        </div>
      </main>

      {selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
      
      <style jsx>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          padding: 20px;
          gap: 20px;
        }
        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 0.5rem;
        }
        .content-container {
          flex: 1;
        }
        @media (max-width: 1024px) {
          .app-layout {
            flex-direction: column;
            padding-bottom: 80px;
          }
        }
      `}</style>
    </div>
  );
}
