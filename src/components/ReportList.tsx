'use client';

import React from 'react';
import { Report } from '@/types/report';
import './ReportList.css';

interface ReportListProps {
  reports: Report[];
  onReportSelect: (report: Report) => void;
}

export default function ReportList({ reports, onReportSelect }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="report-list-empty animate-fade-in">
        <p>No reports available for this date.</p>
      </div>
    );
  }

  return (
    <div className="report-list animate-fade-in">
      <h3 className="section-title">Reports</h3>
      <div className="report-cards">
        {reports.map((report) => (
          <div 
            key={report.id} 
            className="report-card glass-panel"
            onClick={() => onReportSelect(report)}
          >
            <div className="report-card-header">
              <span className="report-type">{report.reportType}</span>
              <span className="report-status">{report.statusLabel}</span>
            </div>
            <h4 className="report-title">{report.title}</h4>
            <div className="report-card-meta">
              <div className="meta-item">
                <span className="label">Period:</span>
                <span className="value">{report.periodLabel}</span>
              </div>
              <div className="meta-item">
                <span className="label">Updated:</span>
                <span className="value">{report.lastUpdatedDisplay}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
