'use client';

import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  eachDayOfInterval,
} from 'date-fns';
import './Calendar.css';

interface CalendarProps {
  activeDates: string[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  reportCounts?: Record<string, number>;
}

export default function Calendar({ activeDates, selectedDate, onDateSelect, reportCounts = {} }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  return (
    <div className="calendar-view animate-fade-in">
      <div className="calendar-controls">
        <div className="month-selector">
          <h2 className="mono tracking-tighter">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="nav-group">
            <button className="nav-action" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>PREV</button>
            <button className="nav-action" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>NEXT</button>
          </div>
        </div>
        <div className="calendar-stats mono text-xs uppercase text-secondary">
          <span>Active Nodes: {activeDates.filter(d => d.startsWith(format(currentMonth, 'yyyy-MM'))).length}</span>
        </div>
      </div>

      <div className="large-calendar glass-panel tactical-border">
        <div className="calendar-grid-header">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="grid-day-name mono uppercase">{day}</div>
          ))}
        </div>
        
        <div className="calendar-grid-body">
          {calendarDays.map((date) => {
            const isoDate = format(date, 'yyyy-MM-dd');
            const isSelected = selectedDate === isoDate;
            const isActive = activeDates.includes(isoDate);
            const isCurrentMonth = isSameMonth(date, monthStart);
            const count = reportCounts[isoDate] || (isActive ? 1 : 0);

            return (
              <div
                key={isoDate}
                className={`grid-cell ${!isCurrentMonth ? 'outside' : ''} ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => isCurrentMonth && onDateSelect(isoDate)}
              >
                <div className="cell-header">
                  <span className="cell-number mono">{format(date, 'd')}</span>
                  {isActive && <span className="cell-signal">SIG-ACT</span>}
                </div>
                
                <div className="cell-content">
                  {isActive && (
                    <div className="cell-brief">
                      <div className="brief-line" />
                      <div className="brief-line short" />
                      <span className="brief-count mono">{count} REPT</span>
                    </div>
                  )}
                </div>

                {isSelected && <div className="cell-focus-bracket" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
