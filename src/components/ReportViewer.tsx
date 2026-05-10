'use client';

import React from 'react';
import { Report } from '@/types/report';
import { useLiveReport } from '@/hooks/useLiveReport';
import DynamicReport from '@/components/DynamicReport';
import BacktestProfileModal from '@/components/BacktestProfileModal';
import './ReportViewer.css';

interface ReportViewerProps {
  report: Report;
  onClose: () => void;
}

export default function ReportViewer({ report, onClose }: ReportViewerProps) {
  const { liveReport, loading, error } = useLiveReport(report.id);
  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);
  const symbols = ['ES', 'NQ', 'YM', 'RTY', 'GC', 'CL', 'SI'];

  return (
    <div className="report-viewer-overlay animate-fade-in">
      <div className="report-viewer-container glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '90vh', width: '90vw', maxWidth: '1200px' }}>
        <div className="report-viewer-header" style={{ flexShrink: 0 }}>
          <div className="report-info">
            <h2>{report.title}</h2>
            <p className="mono text-xs opacity-60">{report.last_updated_display}</p>
          </div>
          <div className="viewer-actions" style={{ alignItems: 'center' }}>
            <div className="symbol-grid hidden md:flex" style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
              {symbols.map(sym => (
                <button 
                  key={sym} 
                  className="symbol-btn mono"
                  style={{ padding: '2px 8px', fontSize: '11px', background: 'rgba(255, 193, 7, 0.1)', color: 'var(--amber)', border: '1px solid var(--amber)', cursor: 'pointer' }}
                  onClick={() => setSelectedSymbol(sym)}
                  title={`View Backtest Profile for ${sym}`}
                >
                  {sym}
                </button>
              ))}
            </div>
            <button className="btn mono text-[10px]" onClick={() => window.print()}>PRINT Intel</button>
            <button className="btn btn-close mono text-[10px]" onClick={onClose}>TERMINATE SESSION</button>
          </div>
        </div>
        <div className="report-content" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-main)' }}>
          {loading ? (
            <div className="viewer-loading mono animate-pulse">Downloading tactical data...</div>
          ) : error ? (
            <div className="viewer-error mono text-danger">Failed to download intelligence data: {error}</div>
          ) : liveReport ? (
            <DynamicReport data={liveReport} />
          ) : (
            <div className="viewer-error mono text-danger">Intelligence file corrupted or missing.</div>
          )}
        </div>
      </div>

      {selectedSymbol && (
        <BacktestProfileModal 
          symbol={selectedSymbol}
          archiveDate={report.calendar_date}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
}
