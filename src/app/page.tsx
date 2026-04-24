'use client';

import React, { useState, useMemo } from 'react';
import Calendar from '@/components/Calendar';
import ReportList from '@/components/ReportList';
import ReportViewer from '@/components/ReportViewer';
import { mockReports } from '@/data/reports';
import { Report } from '@/types/report';

export default function Home() {
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

  return (
    <main className="min-h-screen p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl mb-2">Market Intelligence</h1>
          <p className="text-secondary max-w-2xl">
            Lightweight chronological access to tactical intelligence reports and market analysis.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Calendar 
              activeDates={activeDates}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
            
            <div className="mt-8 p-6 glass-panel">
              <h4 className="section-title mb-4">Architecture Info</h4>
              <p className="text-xs text-secondary leading-relaxed">
                This platform is designed for rapid navigation of historical reports. 
                Dates highlighted in blue indicate available intelligence briefings.
              </p>
            </div>
          </aside>

          <section className="lg:col-span-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {selectedDate ? (
              <ReportList 
                reports={reportsForSelectedDate} 
                onReportSelect={setSelectedReport}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-20 glass-panel border-dashed">
                <div className="text-4xl mb-4 opacity-20">📅</div>
                <h3 className="text-xl mb-1">Select a date</h3>
                <p className="text-secondary text-sm">Choose a highlighted date on the calendar to view reports.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
      
      <footer className="mt-20 pt-8 border-t border-white/5 text-center text-xs text-secondary">
        &copy; 2026 Market Intelligence Web. Built for scale.
      </footer>
    </main>
  );
}
