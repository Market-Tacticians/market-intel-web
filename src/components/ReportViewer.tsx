'use client';

import React from 'react';
import { Report } from '@/types/report';
import { useLiveReport } from '@/hooks/useLiveReport';
import DynamicReport from '@/components/DynamicReport';
import './ReportViewer.css';

interface ReportViewerProps {
  report: Report;
  onClose: () => void;
}

export default function ReportViewer({ report, onClose }: ReportViewerProps) {
  const { liveReport, loading, error } = useLiveReport(report.id);

  return (
    <div className="report-viewer-overlay animate-fade-in">
      <div className="report-viewer-container glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '90vh', width: '90vw', maxWidth: '1200px' }}>
        <div className="report-viewer-header" style={{ flexShrink: 0 }}>
          <div className="report-info">
            <h2>{report.title}</h2>
            <p className="mono text-xs opacity-60">{report.last_updated_display}</p>
          </div>
          <div className="viewer-actions">
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
    </div>
  );
}
