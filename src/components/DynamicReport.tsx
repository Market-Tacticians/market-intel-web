'use client';

import React, { useState } from 'react';
import './DynamicReport.css';

// --- Mock Data Structure (Simulating what Claude would output) ---
const MOCK_INTEL = {
  title: "WEEKLY MARKET INTELLIGENCE BRIEF",
  period: "Week of Apr 26 – May 2, 2026",
  lastUpdated: "Sun Apr 26, 2026 | Morning ET",
  regime: {
    label: "RISK-ON (CAUTIOUS)",
    color: "var(--amber)",
    summary: "Stocks hit fresh all-time highs Friday on Intel’s blowout earnings and Iran FM travel to Islamabad, but Trump’s Sunday cancellation of US peace talks envoy trip pulls the geopolitical floor out. Regime is structurally bullish but fragile: ceasefire expiry ambiguity | Hormuz deadlock | earnings week of 2026 creates a binary tape ahead."
  },
  narratives: [
    {
      title: "Iran Ceasefire Holds in Name Only — Hormuz Remains a Battleground",
      label: "GEOPOLITICAL",
      dateRange: "APR 21-25",
      content: "The Apr 8 Pakistan-brokered two-week ceasefire nominally held through last week, but the strategic picture deteriorated daily. Both the US Navy and Iran seized commercial vessels in the Strait of Hormuz, oil tanker traffic remains at near-standstill, and a second round of peace talks in Islamabad collapsed almost before it began.",
      details: [
        "Trump cancels Witkoff/Kushner Islamabad trip — peace hopes collapse Sunday AM",
        "Iran's FM Araghchi traveled to Pakistan Friday, then departed after presenting mediators a new framework.",
        "IEA assessment: IEA head Birol called this \"the biggest energy security threat in history.\""
      ],
      impact: "High risk of a negative gap open Monday. Crude will likely open higher as the peace-talks catalyst that lifted Friday is removed. S\u0026P 500 futures flat as of late Sunday — the full implications of the cancellation may not be fully priced."
    }
  ]
};

export default function DynamicReport() {
  const [userNote, setUserNote] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="report-container">
      {/* Tactical HUD (Interactive Layer) */}
      <div className="tactical-hud glass-panel">
        <div className="hud-label mono text-[10px] opacity-40 uppercase">Interactive HUD // Mode: Analysis</div>
        <div className="hud-controls">
          <button 
            className={`hud-btn ${isBookmarked ? 'active' : ''}`}
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            {isBookmarked ? 'NODE_SAVED' : 'SAVE_NODE'}
          </button>
          <button className="hud-btn">EXPORT_INTEL</button>
        </div>
        <div className="hud-notes mt-4">
          <textarea 
            placeholder="ADD TACTICAL NOTE..." 
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
          />
        </div>
      </div>

      {/* Main Report Body (Exact Replica of Briefing Style) */}
      <div className="briefing-root">
        <div className="masthead-dynamic">
          <div className="masthead-row">
            <h1><span className="accent">▶</span> {MOCK_INTEL.title}</h1>
            <div className="meta mono uppercase">{MOCK_INTEL.lastUpdated}</div>
          </div>
          <div className="subtitle-dynamic">{MOCK_INTEL.period} | Dominant narratives · Catalyst calendar · Scenario planning · Key levels</div>
        </div>

        <div className="regime-banner-dynamic">
          <div className="regime-dot" />
          <div className="regime-content">
            <div className="regime-status uppercase font-bold text-amber">
              {MOCK_INTEL.regime.label}
            </div>
            <p className="mt-2 text-sm opacity-90">{MOCK_INTEL.regime.summary}</p>
          </div>
        </div>

        <section className="narratives-section mt-12">
          <div className="section-header-dynamic">
            <span className="mono text-xs uppercase opacity-40">Dominant Narratives</span>
          </div>

          {MOCK_INTEL.narratives.map((narrative, idx) => (
            <div key={idx} className="narrative-card-dynamic mt-8">
              <div className="card-header">
                <span className="category-tag mono">{narrative.label}</span>
                <h3>{narrative.title}</h3>
              </div>
              <div className="card-body mt-6">
                <p className="text-sm leading-relaxed">{narrative.content}</p>
                
                <div className="timeline-items mt-6">
                  {narrative.details.map((detail, dIdx) => (
                    <div key={dIdx} className="timeline-item">
                      <div className="timeline-dot" />
                      <p className="text-xs opacity-70">{detail}</p>
                    </div>
                  ))}
                </div>

                <div className="impact-box-dynamic mt-8">
                  <div className="impact-label mono text-[10px] uppercase tracking-widest text-red">Market Impact — Monday Open</div>
                  <p className="mt-2 text-sm italic font-medium opacity-90">{narrative.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      <style jsx>{`
        .report-container {
          position: relative;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        /* --- Tactical HUD --- */
        .tactical-hud {
          position: fixed;
          left: 40px;
          top: 140px;
          width: 240px;
          padding: 16px;
          z-index: 200;
          border-left: 2px solid var(--accent);
        }

        .hud-btn {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text-dim);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          padding: 8px;
          margin-top: 8px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hud-btn:hover {
          border-color: var(--accent);
          color: var(--text-bright);
        }

        .hud-btn.active {
          border-color: var(--accent);
          background: var(--accent-dim);
          color: var(--accent);
        }

        .hud-notes textarea {
          width: 100%;
          height: 120px;
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--text);
          resize: none;
        }

        @media (max-width: 1400px) {
          .tactical-hud {
            position: static;
            width: 100%;
            margin-bottom: 32px;
          }
        }
      `}</style>
    </div>
  );
}
