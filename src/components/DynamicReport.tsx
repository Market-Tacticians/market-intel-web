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

  // --- Helper Functions from Spec ---

  const getColor = (colorName: string) => {
    const map: Record<string, string> = {
      'green': 'var(--green)',
      'red': 'var(--red)',
      'amber': 'var(--amber)',
      'blue': 'var(--blue)',
      'cyan': 'var(--cyan)',
      'purple': 'var(--purple)',
      'bull': 'var(--green)',
      'bear': 'var(--red)',
      'base': 'var(--amber)',
    };
    return map[colorName?.toLowerCase()] || 'var(--amber)';
  };

  const getColorDim = (colorName: string) => {
    const map: Record<string, string> = {
      'green': 'var(--green-dim)',
      'red': 'var(--red-dim)',
      'amber': 'var(--amber-dim)',
      'blue': 'var(--blue-dim)',
      'cyan': 'var(--cyan-dim)',
      'purple': 'var(--purple-dim)',
      'bull': 'var(--green-dim)',
      'bear': 'var(--red-dim)',
      'base': 'var(--amber-dim)',
    };
    return map[colorName?.toLowerCase()] || 'var(--amber-dim)';
  };

  const getTagClass = (tag: string) => {
    const t = (tag || '').toLowerCase();
    if (t.includes('geo')) return 'tag-geo';
    if (t.includes('fed') || t.includes('monetary')) return 'tag-fed';
    if (t.includes('oil') || t.includes('energy')) return 'tag-energies';
    if (t.includes('metal') || t.includes('commod')) return 'tag-metals-commodities';
    if (t.includes('earn')) return 'tag-earnings';
    if (t.includes('data') || t.includes('econ')) return 'tag-data';
    if (t.includes('flow') || t.includes('posit')) return 'tag-flow';
    return '';
  };

  const directionClass = (direction: string) => {
    switch (direction) {
      case 'up':      return 'up';
      case 'down':    return 'down';
      case 'neutral': return 'neutral';
      case 'mixed':   return 'flat';
      default:        return 'flat';
    }
  };

  const formatStatVal = (row: any) => {
    if (row.value && row.note) return `${row.value} | ${row.note}`;
    if (row.value) return row.value;
    if (row.note) return row.note;
    return '';
  };

  const badgeClass = (status: string) => {
    switch (status) {
      case 'unanswered':         return 'q-unanswered';
      case 'answered':           return 'q-answered';
      case 'partially_answered': return 'q-badge-partial';
      case 'updated':            return 'q-badge-updated';
      default:                   return 'q-unanswered';
    }
  };

  const statusToLabel = (status: string) => {
    switch (status) {
      case 'unanswered':         return 'Unanswered';
      case 'answered':           return 'Answered';
      case 'partially_answered': return 'Partially Answered';
      case 'updated':            return 'Updated';
      default:                   return 'Unanswered';
    }
  };

  return (
    <div className="report-root">
      {/* Tactical HUD */}
      <div className="tactical-hud-v2">
        <div className="hud-label-v2 mono text-[10px] opacity-40 uppercase">Interactive HUD // Mode: Analysis</div>
        <div className="hud-controls-v2">
          <button 
            className={`hud-btn-v2 ${isBookmarked ? 'active' : ''}`}
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            {isBookmarked ? 'NODE_SAVED' : 'SAVE_NODE'}
          </button>
          <button className="hud-btn-v2">EXPORT_INTEL</button>
        </div>
        <div className="hud-notes-v2 mt-4">
          <textarea 
            placeholder="ADD TACTICAL NOTE..." 
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
          />
        </div>
      </div>

      <div className="briefing-container">
        {/* Masthead */}
        <header className="masthead">
          <div className="masthead-row">
            <h1><span className="accent">▶</span> {intel.meta?.title || 'MARKET INTELLIGENCE BRIEF'}</h1>
            <div className="timestamp-badge">
              <span className="ts-dot" />
              <span className="ts-label">Last Updated</span>
              <span className="ts-value">{intel.meta?.generated || intel.meta?.last_updated || 'N/A'}</span>
            </div>
          </div>
          <p className="subtitle">
            Week of {intel.meta?.period_covered} | Dominant narratives · Catalyst calendar · Scenario planning · Key levels
          </p>
        </header>

        {/* Regime Banner */}
        {intel.regime && (
          <div className="regime-banner" style={{ borderColor: intel.regime.color === 'green' ? 'rgba(34,197,94,0.2)' : intel.regime.color === 'red' ? 'rgba(239,68,68,0.35)' : 'var(--border)' }}>
            <div className="regime-dot" style={{ background: getColor(intel.regime.color) }} />
            <span className="regime-label" style={{ color: getColor(intel.regime.color) }}>
              {intel.regime.label}
            </span>
            <span className="regime-desc">{intel.regime.description}</span>
          </div>
        )}

        <div className="container">
          {/* Dominant Narratives */}
          {intel.dominant_narratives && (
            <section>
              <div className="section-title">Dominant Narratives</div>
              {intel.dominant_narratives.map((narrative: any, idx: number) => {
                const isThread = narrative.type === 'story_thread';
                
                if (isThread) {
                  return (
                    <div key={idx} className="story-thread">
                      <div className="narrative-card condensed">
                        <h3><span className={`tag ${getTagClass(narrative.tag)}`}>{narrative.tag}</span> {narrative.headline}</h3>
                        <p>{narrative.body}</p>
                      </div>
                      <div className="update-timeline">
                        <div className="update-timeline-rail">
                          {narrative.updates?.map((update: any, uIdx: number) => (
                            <details key={uIdx} className="update-entry" open={update.is_live}>
                              <summary className="update-trigger">
                                <div className="update-trigger-top">
                                  <div className={`update-dot ${update.is_live ? 'live' : ''}`} />
                                  <span className="update-badge">
                                    {update.is_live && <span className="pulse" />}
                                    {update.label}
                                  </span>
                                  <span className="update-timestamp">{update.timestamp}</span>
                                  <span className="update-chevron">▾</span>
                                </div>
                                <div className="update-trigger-headline">{update.headline}</div>
                              </summary>
                              <div className="update-body">
                                <p>{update.body}</p>
                                {update.bullets && (
                                  <ul className="bullet-list">
                                    {update.bullets.map((b: string, bIdx: number) => (
                                      <li key={bIdx}>{b}</li>
                                    ))}
                                  </ul>
                                )}
                                {update.market_impact && (
                                  <div className="market-impact">
                                    <div className="market-impact-label">Market Impact — {update.market_impact.session}</div>
                                    <p>{update.market_impact.text}</p>
                                  </div>
                                )}
                                {update.sources && update.sources.length > 0 && (
                                  <details className="sources-drawer">
                                    <summary className="sources-toggle">
                                      Sources <span className="sources-count">{update.sources.length}</span>
                                      <span className="sources-chevron">▾</span>
                                    </summary>
                                    <ul className="sources-list">
                                      {update.sources.map((s: any, sIdx: number) => (
                                        <li key={sIdx}>
                                          <span className="source-label">{s.label}</span><br />
                                          <a href={s.url} target="_blank" rel="noopener">{s.url}</a>
                                        </li>
                                      ))}
                                    </ul>
                                  </details>
                                )}
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="narrative-card">
                    <h3>
                      <span className={`tag ${getTagClass(narrative.tag)}`}>{narrative.tag}</span>
                      {narrative.headline}
                    </h3>
                    <p>{narrative.body}</p>
                  </div>
                );
              })}
            </section>
          )}

          <hr className="divider" />

          {/* Catalyst Calendar */}
          {intel.catalyst_calendar && (
            <section>
              <div className="section-title">Catalyst Calendar</div>
              <div className="timeline">
                {intel.catalyst_calendar.map((c: any, idx: number) => (
                  <div key={idx} className={`tl-item ${c.impact}`}>
                    <div className="tl-date">{c.date_label}</div>
                    <div className="tl-title">
                      {c.event}
                      {c.flag && <span className="inline-update">{c.flag}</span>}
                    </div>
                    <div className="tl-body">{c.body}</div>
                    {c.tags && c.tags.length > 0 && (
                      <div className="tl-tags">
                        {c.tags.map((t: string, tIdx: number) => (
                          <span key={tIdx} className={`tag ${getTagClass(t)}`}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <hr className="divider" />

          {/* Market Snapshot */}
          {intel.market_snapshot && (
            <section>
              <div className="section-title">Market Snapshot</div>
              <div className="grid-3">
                <div className="card">
                  <h4>Global Indexes</h4>
                  {intel.market_snapshot.indexes?.map((row: any, i: number) => (
                    <div key={i} className="stat-row">
                      <span className="stat-label">{row.label}</span>
                      <span className={`stat-val ${directionClass(row.direction)}`}>{formatStatVal(row)}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h4>Macro & Fed</h4>
                  {intel.market_snapshot.macro_fed?.map((row: any, i: number) => (
                    <div key={i} className="stat-row">
                      <span className="stat-label">{row.label}</span>
                      <span className={`stat-val ${directionClass(row.direction)}`}>{formatStatVal(row)}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h4>Energy & Volatility</h4>
                  {intel.market_snapshot.energy_volatility?.map((row: any, i: number) => (
                    <div key={i} className="stat-row">
                      <span className="stat-label">{row.label}</span>
                      <span className={`stat-val ${directionClass(row.direction)}`}>{formatStatVal(row)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <hr className="divider" />

          {/* Stories to Track */}
          {intel.stories_to_track && (
            <section>
              <div className="section-title">Stories to Track</div>
              <div className="grid-2">
                <div className="card">
                  <h4>Geopolitical & Macro</h4>
                  {intel.stories_to_track.geopolitical_macro?.map((row: any, i: number) => (
                    <div key={i} className="watchlist-item">
                      <div className={`w-dot ${row.direction}`}></div>
                      <span className="w-label">{row.label}</span>
                      <span className="w-status">{row.status}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h4>Sector & Stock Signals</h4>
                  {intel.stories_to_track.sector_stock_signals?.map((row: any, i: number) => (
                    <div key={i} className="watchlist-item">
                      <div className={`w-dot ${row.direction}`}></div>
                      <span className="w-label">{row.label}</span>
                      <span className="w-status">{row.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <hr className="divider" />

          {/* Scenarios */}
          {intel.scenarios && (
            <section>
              <div className="section-title">Scenarios</div>
              {intel.scenarios.map((s: any, idx: number) => (
                <div key={idx} className="scenario">
                  <div className="scenario-header">
                    <div className="scenario-icon" style={{ background: getColorDim(s.color), color: getColor(s.color) }}>
                      {s.label}
                    </div>
                    <h4>{s.case} Case: {s.headline}</h4>
                  </div>
                  <p>{s.body}</p>
                  {s.update && (
                    <div className="scenario-update-note">
                      <div className="scenario-update-label">{s.update.label}</div>
                      <p>{s.update.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          <hr className="divider" />

          {/* Key Questions */}
          {intel.key_questions && (
            <section>
              <div className="section-title">Key Questions</div>
              <div className="card">
                <div className="question-block">
                  {intel.key_questions.map((q: any, idx: number) => (
                    <React.Fragment key={idx}>
                      <p>
                        <strong style={{ color: 'var(--text-bright)' }}>{q.number}.</strong>
                        {' '}{q.question}{' '}
                        <span className={badgeClass(q.status)}>
                          {q.update_label || statusToLabel(q.status)}
                        </span>
                      </p>
                      {q.answer && <span className="q-answer">{q.answer}</span>}
                      {q.update && <span className="q-answer partial">{q.update}</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer>
          <span>Weekly Market Intelligence Brief — Week of {intel.meta?.period_covered}</span>
          <span>Last updated: {intel.meta?.generated || intel.meta?.last_updated} | Sources: {intel.meta?.sources?.join(', ') || 'Internal'}</span>
        </footer>
      </div>

      <style jsx>{`
        .report-root {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          width: 100%;
          min-height: 100%;
          background: var(--bg);
        }

        .briefing-container {
          flex: 1;
          min-width: 0;
          padding-bottom: 40px;
        }

        .tactical-hud-v2 {
          position: sticky;
          top: 0;
          width: 240px;
          flex-shrink: 0;
          padding: 16px;
          border-right: 1px solid var(--border);
          background: var(--surface);
          height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
        }

        .hud-btn-v2 {
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

        .hud-btn-v2:hover {
          border-color: var(--cyan);
          color: var(--text-bright);
        }

        .hud-btn-v2.active {
          border-color: var(--cyan);
          background: var(--cyan-dim);
          color: var(--cyan);
        }

        .hud-notes-v2 textarea {
          width: 100%;
          flex: 1;
          min-height: 200px;
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--text);
          resize: none;
        }

        footer {
          padding: 32px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          color: var(--text-dim);
          text-transform: uppercase;
        }

        @media (max-width: 1024px) {
          .report-root {
            flex-direction: column;
          }
          .tactical-hud-v2 {
            position: static;
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          footer {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
