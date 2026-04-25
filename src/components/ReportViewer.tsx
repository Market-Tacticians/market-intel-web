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
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHtml() {
      try {
        setLoading(true);
        // Fetch the file content directly from storage
        const { data, error } = await supabase.storage
          .from('reports')
          .download(report.file_path);

        if (error) throw error;
        
        const text = await data.text();
        setHtmlContent(text);
      } catch (err) {
        console.error('Error fetching report content:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHtml();
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
            <div className="viewer-loading mono">Downloading tactical data...</div>
          ) : htmlContent ? (
            <iframe 
              srcDoc={htmlContent} 
              title={report.title}
              className="report-iframe"
              sandbox="allow-popups allow-scripts allow-forms allow-same-origin"
            />
          ) : (
            <div className="viewer-error mono">Failed to download intelligence data.</div>
          )}
        </div>
      </div>
    </div>
  );
}
