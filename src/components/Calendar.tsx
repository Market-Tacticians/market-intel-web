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
  variant?: 'large' | 'mini';
}

export default function Calendar({ 
  activeDates, 
  selectedDate, 
  onDateSelect, 
  reportCounts = {},
  variant = 'large'
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (!isNaN(d.getTime())) {
        return startOfMonth(d);
      }
    }
    return startOfMonth(new Date());
  });


  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const isMini = variant === 'mini';

  return (
    <div className={`calendar-view ${isMini ? 'calendar-mini' : ''} animate-fade-in`}>
      <div className="calendar-controls">
        <div className="month-selector">
          <h2 className="mono tracking-tighter">{format(currentMonth, isMini ? 'MMM yyyy' : 'MMMM yyyy')}</h2>
          <div className="nav-group">
            <button className="nav-action" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>PREV</button>
            <button className="nav-action" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>NEXT</button>
          </div>
        </div>
        {!isMini && (
          <div className="calendar-stats mono text-xs uppercase text-secondary">
            <span>Active Nodes: {activeDates.filter(d => d.startsWith(format(currentMonth, 'yyyy-MM'))).length}</span>
          </div>
        )}
      </div>

      <div className={`${isMini ? 'mini-calendar-grid' : 'large-calendar glass-panel tactical-border'}`}>
        <div className="calendar-grid-header">
          {(isMini ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map((day, idx) => (
            <div key={`${day}-${idx}`} className="grid-day-name mono uppercase">{day}</div>
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
                  {isActive && !isMini && <span className="cell-signal">SIG-ACT</span>}
                  {isActive && isMini && <div className="mini-active-dot" />}
                </div>
                
                {!isMini && (
                  <div className="cell-content">
                    {isActive && (
                      <div className="cell-brief">
                        <div className="brief-line" />
                        <div className="brief-line short" />
                        <span className="brief-count mono">{count} REPT</span>
                      </div>
                    )}
                  </div>
                )}

                {isSelected && !isMini && <div className="cell-focus-bracket" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
