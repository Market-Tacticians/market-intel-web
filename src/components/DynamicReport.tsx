'use client';

import React, { useState } from 'react';
import './DynamicReport.css';

interface DynamicReportProps {
  data: any;
}

export default function DynamicReport({ data }: DynamicReportProps) {
  const [userNote, setUserNote] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!data) return <div className="p-20 text-center mono opacity-40">NO INTEL DATA LOADED</div>;

  const intel = data;

  return (
    <div className="report-container">
      {/* Tactical HUD */}
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

      {/* Main Report Body */}
      <div className="briefing-root">
        <div className="masthead-dynamic">
          <div className="masthead-row">
            <h1><span className="accent">▶</span> {intel.meta?.title}</h1>
            <div className="meta mono uppercase">{intel.meta?.generated}</div>
          </div>
          <div className="subtitle-dynamic">{intel.meta?.period_covered} | Dominant narratives · Catalyst calendar · Scenario planning · Key levels</div>
        </div>

        {/* Regime Banner */}
        {intel.regime && (
          <div className="regime-banner-dynamic">
            <div className="regime-dot" style={{ backgroundColor: `var(--intel-${intel.regime.color || 'amber'})` }} />
            <div className="regime-content">
              <div className="regime-status uppercase font-bold" style={{ color: `var(--intel-${intel.regime.color || 'amber'})` }}>
                {intel.regime.label}
              </div>
              <p className="mt-2 text-sm opacity-90">{intel.regime.description}</p>
            </div>
          </div>
        )}

        {/* Narratives Section */}
        {intel.dominant_narratives && (
          <section className="narratives-section mt-12">
            <div className="section-header-dynamic">
              <span className="mono text-xs uppercase opacity-40">Dominant Narratives</span>
            </div>

            {intel.dominant_narratives.map((narrative: any, idx: number) => (
              <div key={idx} className="narrative-card-dynamic mt-8">
                <div className="card-header">
                  <span className="category-tag mono">{narrative.tag}</span>
                  <h3>{narrative.headline}</h3>
                </div>
                <div className="card-body mt-6">
                  {narrative.summary && <p className="text-sm leading-relaxed mb-4">{narrative.summary}</p>}
                  {narrative.body && <p className="text-sm leading-relaxed">{narrative.body}</p>}
                  
                  {narrative.updates && (
                    <div className="timeline-items mt-6">
                      {narrative.updates.map((update: any, uIdx: number) => (
                        <div key={uIdx} className="timeline-item mb-4">
                          <div className="timeline-dot" />
                          <div className="mono text-[10px] opacity-40 uppercase mb-1">{update.label} // {update.timestamp}</div>
                          <p className="text-xs font-bold text-bright mb-2">{update.headline}</p>
                          <p className="text-[11px] opacity-70 leading-relaxed">{update.body}</p>
                          {update.market_impact && (
                            <div className="mt-3 border-l border-intel-red pl-3 italic text-[11px] opacity-80">
                              <span className="mono text-[9px] uppercase text-intel-red not-italic block mb-1">Impact: {update.market_impact.session}</span>
                              {update.market_impact.text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {narrative.market_impact && (
                    <div className="impact-box-dynamic mt-8">
                      <div className="impact-label mono text-[10px] uppercase tracking-widest text-intel-red">Market Impact</div>
                      <p className="mt-2 text-sm italic font-medium opacity-90">{narrative.market_impact}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Catalyst Calendar */}
        {intel.catalyst_calendar && (
          <section className="catalysts-section mt-16">
            <div className="section-header-dynamic">
              <span className="mono text-xs uppercase opacity-40">Scheduled Catalysts</span>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {intel.catalyst_calendar.map((c: any, idx: number) => (
                <div key={idx} className="catalyst-card-dynamic glass-panel p-5 border border-intel-border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="mono text-[10px] text-intel-cyan">{c.date_label}</span>
                    {c.impact && <span className={`impact-badge mono text-[8px] uppercase ${c.impact}`}>{c.impact}</span>}
                  </div>
                  <div className="text-sm font-bold text-intel-text-bright mb-3">{c.event}</div>
                  <p className="text-[11px] opacity-60 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scenarios */}
        {intel.scenarios && (
          <section className="scenarios-section mt-16">
            <div className="section-header-dynamic">
              <span className="mono text-xs uppercase opacity-40">Scenario Planning</span>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6">
              {intel.scenarios.map((s: any, idx: number) => (
                <div key={idx} className={`scenario-card-dynamic border-l-4 p-6 bg-intel-surface`} style={{ borderColor: `var(--intel-${s.color})` }}>
                  <div className="mono text-[10px] uppercase mb-1" style={{ color: `var(--intel-${s.color})` }}>Scenario {s.label} // {s.case} Case</div>
                  <h4 className="text-intel-text-bright font-bold mb-3">{s.headline}</h4>
                  <p className="text-xs opacity-70 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .report-container {
          display: flex;
          gap: 40px;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          align-items: flex-start;
        }

        .tactical-hud {
          position: sticky;
          top: 20px;
          width: 240px;
          flex-shrink: 0;
          padding: 16px;
          border-left: 2px solid var(--intel-cyan);
          background: var(--intel-surface);
        }

        .briefing-root {
          flex: 1;
          min-width: 0;
        }

        .hud-btn {
          width: 100%;
          background: var(--intel-surface2);
          border: 1px solid var(--intel-border);
          color: var(--intel-text-dim);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          padding: 8px;
          margin-top: 8px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hud-btn:hover {
          border-color: var(--intel-cyan);
          color: var(--intel-text-bright);
        }

        .hud-btn.active {
          border-color: var(--intel-cyan);
          background: var(--intel-cyan-dim);
          color: var(--intel-cyan);
        }

        .hud-notes textarea {
          width: 100%;
          height: 120px;
          background: var(--intel-bg);
          border: 1px solid var(--intel-border);
          padding: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--intel-text);
          resize: none;
        }

        .impact-badge {
          padding: 2px 6px;
          border-radius: 2px;
          background: var(--intel-surface2);
          border: 1px solid var(--intel-border);
        }

        .impact-badge.high, .impact-badge.critical {
          color: var(--intel-red);
          border-color: var(--intel-red);
          background: var(--intel-red-dim);
        }

        @media (max-width: 1024px) {
          .report-container {
            flex-direction: column;
          }
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
