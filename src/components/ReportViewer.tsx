'use client';

import React from 'react';
import { Report } from '@/types/report';
import { supabase } from '@/lib/supabase';
import './ReportViewer.css';

interface ReportViewerProps {
  report: Report;
  onClose: () => void;
}

export default function ReportViewer({ report, onClose }: ReportViewerProps) {
  // Get the public URL for the report
  const { data } = supabase.storage
    .from('reports')
    .getPublicUrl(report.file_path);

  const publicUrl = data.publicUrl;

  return (
    <div className="report-viewer-overlay animate-fade-in">
      <div className="report-viewer-container glass-panel">
        <div className="report-viewer-header">
          <div className="report-info">
            <h2>{report.title}</h2>
            <p className="mono text-xs opacity-60">{report.last_updated_display}</p>
          </div>
          <div className="viewer-actions">
            <button className="btn mono text-[10px]" onClick={() => window.print()}>PRINT Intel</button>
            <button className="btn btn-close mono text-[10px]" onClick={onClose}>TERMINATE SESSION</button>
          </div>
        </div>
        <div className="report-content">
          {publicUrl ? (
            <iframe 
              src={publicUrl} 
              title={report.title}
              className="report-iframe"
            />
          ) : (
            <div className="viewer-error mono">Failed to resolve report path.</div>
          )}
        </div>
      </div>
    </div>
  );
}
