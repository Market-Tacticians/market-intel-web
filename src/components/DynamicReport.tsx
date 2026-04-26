'use client';

import React, { useState } from 'react';
import './DynamicReport.css';

// --- Mock Data Structure ---
const MOCK_REPORT_DATA = {
  id: 'mock-123',
  title: 'Weekly Market Intelligence Brief',
  period: 'Week of Apr 26 - May 1, 2026',
  lastUpdated: 'Sun Apr 26, 2026 | Morning ET',
  regime: {
    status: 'Risk-On (Cautious)',
    description: 'Stocks hit fresh all-time highs Friday on Intel’s blowout earnings. Regime is structurally bullish but fragile: ceasefire expiry ambiguity | Hormuz deadlock | earnings week of 2026 creates a binary tape ahead.',
    color: '#f59e0b' // Amber
  },
  narratives: [
    {
      id: 'n1',
      category: 'GEOPOLITICAL',
      title: 'Iran Ceasefire Holds in Name Only',
      content: 'The Apr 8 Pakistan-brokered two-week ceasefire nominally held through last week, but the strategic picture deteriorated daily. Both the US Navy and Iran seized commercial vessels in the Strait of Hormuz.',
      impact: 'High risk of a negative gap open Monday.'
    },
    {
      id: 'n2',
      category: 'MONETARY',
      title: 'Inflation Gauges Remain Sticky',
      content: 'Core PCE came in slightly above expectations, suggesting the Fed may keep rates higher for longer. Market is pricing in a 40% chance of a June cut, down from 60% last week.',
      impact: 'Yields likely to test recent highs.'
    }
  ],
  catalysts: [
    { time: 'MON 08:30', event: 'Empire State Manufacturing', impact: 'Medium' },
    { time: 'TUE 10:00', event: 'Consumer Confidence', impact: 'High' },
    { time: 'WED 14:00', event: 'FOMC Minutes', impact: 'Critical' }
  ]
};

export default function DynamicReport() {
  const [userNote, setUserNote] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="dynamic-report animate-fade-in">
      {/* Tactical Toolbar (Account Level Functionality) */}
      <div className="report-toolbar glass-panel border-hi">
        <div className="toolbar-status">
          <div className="status-dot online" />
          <span className="mono text-[10px] uppercase">Interactive Mode Active</span>
        </div>
        <div className="toolbar-actions">
          <button 
            className={`btn-icon ${isBookmarked ? 'active' : ''}`} 
            onClick={() => setIsBookmarked(!isBookmarked)}
            title="Bookmark Report"
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          <button className="btn-icon" title="Share Intel">↗</button>
          <button className="btn-icon" title="Export PDF">PDF</button>
        </div>
      </div>

      <div className="report-layout mt-6">
        <div className="report-main">
          {/* Header */}
          <div className="dynamic-masthead">
            <div className="mono text-xs text-accent mb-2 uppercase tracking-widest">Market Intelligence Node</div>
            <h1>{MOCK_REPORT_DATA.title}</h1>
            <div className="meta-row mt-4">
              <span className="period mono">{MOCK_REPORT_DATA.period}</span>
              <span className="divider">|</span>
              <span className="updated mono opacity-50">{MOCK_REPORT_DATA.lastUpdated}</span>
            </div>
          </div>

          {/* Regime Banner */}
          <div className="regime-banner-dynamic glass-panel mt-8">
            <div className="regime-header">
              <div className="regime-dot" style={{ backgroundColor: MOCK_REPORT_DATA.regime.color }} />
              <span className="regime-status uppercase font-bold" style={{ color: MOCK_REPORT_DATA.regime.color }}>
                {MOCK_REPORT_DATA.regime.status}
              </span>
            </div>
            <p className="regime-text mt-3">{MOCK_REPORT_DATA.regime.description}</p>
          </div>

          {/* Narratives */}
          <div className="section-group mt-12">
            <h2 className="section-title-dynamic mono text-xs uppercase opacity-40 mb-6">Dominant Narratives</h2>
            {MOCK_REPORT_DATA.narratives.map(narrative => (
              <div key={narrative.id} className="narrative-card glass-panel mb-6">
                <div className="card-header">
                  <span className="category-tag mono">{narrative.category}</span>
                  <h3 className="text-bright">{narrative.title}</h3>
                </div>
                <div className="card-content mt-4">
                  <p className="text-sm opacity-80">{narrative.content}</p>
                  <div className="impact-box mt-4 border-l-2 border-accent pl-4 py-1">
                    <span className="mono text-[10px] text-accent uppercase block mb-1">Market Impact</span>
                    <p className="text-xs font-semibold italic">{narrative.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar (Account Specific Features) */}
        <div className="report-sidebar-dynamic">
          <div className="sidebar-module glass-panel p-4">
            <h4 className="mono text-[10px] uppercase text-accent mb-4">Tactical Notes</h4>
            <textarea 
              className="notes-input" 
              placeholder="Add your own analysis or reminders..."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
            />
            <button className="btn-small mt-3 w-full mono">Save to Account</button>
          </div>

          <div className="sidebar-module glass-panel p-4 mt-6">
            <h4 className="mono text-[10px] uppercase text-accent mb-4">Scheduled Catalysts</h4>
            <div className="catalyst-list">
              {MOCK_REPORT_DATA.catalysts.map((c, i) => (
                <div key={i} className="catalyst-row py-2 border-b border-border last:border-0 flex justify-between items-center">
                  <span className="mono text-[10px] opacity-60">{c.time}</span>
                  <span className="text-[11px] font-medium">{c.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
