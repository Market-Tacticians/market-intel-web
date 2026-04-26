'use client';

import React from 'react';
import { Report } from '@/types/report';
import { format } from 'date-fns';
import './DailyReportModal.css';

interface DailyReportModalProps {
  date: string;
  reports: Report[];
  onSelectReport: (report: Report) => void;
  onClose: () => void;
}

export default function DailyReportModal({ date, reports, onSelectReport, onClose }: DailyReportModalProps) {
  // Format the date for display (e.g., April 24, 2026)
  const displayDate = format(new Date(date + 'T12:00:00Z'), 'MMMM d, yyyy');

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-container glass-panel animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>INTEL NODES: {displayDate}</h3>
          <button className="btn btn-close mono text-[10px]" onClick={onClose}>CLOSE</button>
        </div>
        
        <div className="modal-content">
          {reports.length > 0 ? (
            <div className="report-list">
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  className="report-item"
                  onClick={() => onSelectReport(report)}
                >
                  <div className="type">{report.report_type}</div>
                  <div className="title">{report.title}</div>
                  <div className="meta">
                    {report.last_updated_display}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>NO DATA NODES FOUND FOR THIS DATE</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
