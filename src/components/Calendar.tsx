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
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import './Calendar.css';

interface CalendarProps {
  activeDates: string[]; // YYYY-MM-DD
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

export default function Calendar({ activeDates, selectedDate, onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // Default to April 2026 for sample

  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <div className="month-display">
          <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
        </div>
        <div className="nav-controls">
          <button className="nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            &larr;
          </button>
          <button className="nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            &rarr;
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="days-row">
        {days.map((day) => (
          <div className="day-name" key={day}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="calendar-grid">
        {calendarDays.map((date) => {
          const isoDate = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDate === isoDate;
          const isActive = activeDates.includes(isoDate);
          const isCurrentMonth = isSameMonth(date, monthStart);

          return (
            <div
              key={isoDate}
              className={`calendar-cell ${!isCurrentMonth ? 'disabled' : ''} ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => isCurrentMonth && onDateSelect(isoDate)}
            >
              <span className="number">{format(date, 'd')}</span>
              {isActive && <div className="indicator" />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="calendar-container glass-panel">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
