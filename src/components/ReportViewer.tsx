'use client';

import React from 'react';
import { Report } from '@/types/report';
import './ReportViewer.css';

interface ReportViewerProps {
  report: Report;
  onClose: () => void;
}

export default function ReportViewer({ report, onClose }: ReportViewerProps) {
  return (
    <div className="report-viewer-overlay animate-fade-in">
      <div className="report-viewer-container glass-panel">
        <div className="report-viewer-header">
          <div className="report-info">
            <h2>{report.title}</h2>
            <p>{report.lastUpdatedDisplay}</p>
          </div>
          <div className="viewer-actions">
            <button className="btn" onClick={() => window.print()}>Print / PDF</button>
            <button className="btn btn-close" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="report-content">
          <iframe 
            src={report.htmlPath} 
            title={report.title}
            className="report-iframe"
          />
        </div>
      </div>
    </div>
  );
}
