'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import Navigation, { TabType } from '@/components/Navigation';
import Calendar from '@/components/Calendar';
import ReportList from '@/components/ReportList';
import ReportViewer from '@/components/ReportViewer';
import { mockReports } from '@/data/reports';
import { Report } from '@/types/report';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('intelligence');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const activeDates = useMemo(() => {
    return Array.from(new Set(mockReports.map(r => r.calendarDate)));
  }, []);

  const reportsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return mockReports
      .filter(r => r.calendarDate === selectedDate)
      .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
  }, [selectedDate]);

  const latestReports = useMemo(() => {
    return [...mockReports]
      .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
      .slice(0, 5);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'intelligence':
        return (
          <div className="tab-intelligence animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <div className="intelligence-hero glass-panel tactical-border p-8 mb-8">
                  <h2 className="mono text-accent mb-2">Live Intelligence Feed</h2>
                  <p className="text-secondary max-w-xl mb-6">
                    Real-time monitoring of market-moving events and tactical intelligence briefings.
                  </p>
                  <div className="hero-stats grid grid-cols-3 gap-4">
                    <div className="stat-card">
                      <span className="stat-label mono uppercase">Alert Level</span>
                      <span className="stat-value mono text-accent">ELEVATED</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label mono uppercase">Active Assets</span>
                      <span className="stat-value mono">6/6</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label mono uppercase">Latency</span>
                      <span className="stat-value mono">14ms</span>
                    </div>
                  </div>
                </div>
                
                <div className="latest-intel">
                  <h3 className="section-title mb-4">Latest Briefings</h3>
                  <ReportList 
                    reports={latestReports} 
                    onReportSelect={setSelectedReport}
                  />
                </div>
              </div>
              
              <div className="lg:col-span-4">
                <div className="market-state glass-panel p-6 mb-8">
                  <h3 className="section-title mb-6">Market Posture</h3>
                  <div className="posture-grid space-y-4">
                    <div className="posture-item">
                      <span className="mono text-xs text-muted uppercase">Global Risk</span>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: '65%' }} /></div>
                    </div>
                    <div className="posture-item">
                      <span className="mono text-xs text-muted uppercase">Volatility</span>
                      <div className="progress-bar"><div className="progress-fill danger" style={{ width: '82%' }} /></div>
                    </div>
                    <div className="posture-item">
                      <span className="mono text-xs text-muted uppercase">Liquidity</span>
                      <div className="progress-bar"><div className="progress-fill success" style={{ width: '45%' }} /></div>
                    </div>
                  </div>
                </div>

                <div className="system-logs glass-panel p-6">
                  <h3 className="section-title mb-4">System Logs</h3>
                  <div className="logs-list mono text-[10px] space-y-2 opacity-60">
                    <div className="log-entry"><span className="text-accent">[08:30:00]</span> Morning Briefing Ingested</div>
                    <div className="log-entry"><span className="text-accent">[10:15:22]</span> Volatility Threshold Crossed</div>
                    <div className="log-entry"><span className="text-accent">[14:00:05]</span> Mid-Session Review Pending</div>
                    <div className="log-entry"><span className="text-accent">[16:30:10]</span> Daily Archive Finalized</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="tab-calendar animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-9">
                <Calendar 
                  activeDates={activeDates}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
              <div className="lg:col-span-3">
                {selectedDate ? (
                  <div className="selected-date-info">
                    <h2 className="mono mb-4">{format(new Date(selectedDate + 'T12:00:00Z'), 'MMM d, yyyy')}</h2>
                    <ReportList 
                      reports={reportsForSelectedDate} 
                      onReportSelect={setSelectedReport}
                    />
                  </div>
                ) : (
                  <div className="p-8 glass-panel border-dashed text-center opacity-40">
                    <p className="mono text-xs uppercase">Select Node</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'archive':
        return (
          <div className="tab-archive animate-fade-in text-center p-20 opacity-30">
            <h2 className="mono">Historical Archive Offline</h2>
            <p className="text-xs uppercase mt-2">Requires Supabase Synchronization</p>
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
            Main / {activeTab} {selectedDate && `/ ${selectedDate}`}
          </div>
          <div className="header-actions">
            <button className="btn mono text-xs">RELOAD SYSTEM</button>
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
        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 0.6rem;
          color: var(--text-muted);
        }
        .stat-value {
          font-size: 1.25rem;
          font-weight: 800;
        }
        .progress-bar {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--accent);
        }
        .progress-fill.danger { background: var(--danger); }
        .progress-fill.success { background: var(--success); }

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
