'use client';

import React, { useState, useEffect } from 'react';
import { Report } from '@/types/report';
import { supabase } from '@/lib/supabase';
import './ReportViewer.css';

interface ReportViewerProps {
  report: Report;
  onClose: () => void;
}

export default function ReportViewer({ report, onClose }: ReportViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSignedUrl() {
      try {
        setLoading(true);
        const { data, error } = await supabase.storage
          .from('reports')
          .createSignedUrl(report.file_path, 3600); // 1 hour expiry

        if (error) throw error;
        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error generating signed URL:', err);
      } finally {
        setLoading(false);
      }
    }

    getSignedUrl();
  }, [report.file_path]);

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
          {loading ? (
            <div className="viewer-loading mono">Initializing secure link...</div>
          ) : signedUrl ? (
            <iframe 
              src={signedUrl} 
              title={report.title}
              className="report-iframe"
            />
          ) : (
            <div className="viewer-error mono">Failed to retrieve report data.</div>
          )}
        </div>
      </div>
    </div>
  );
}
