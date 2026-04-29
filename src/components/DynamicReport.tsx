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

  // Helper to map color names to hex/var
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
    return map[colorName.toLowerCase()] || 'var(--amber)';
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
    return map[colorName.toLowerCase()] || 'var(--amber-dim)';
  };

  const getTagClass = (tag: string) => {
    const t = (tag || '').toLowerCase();
    if (t.includes('geo')) return 'tag-geo';
    if (t.includes('fed') || t.includes('monetary')) return 'tag-fed';
    if (t.includes('oil') || t.includes('energy')) return 'tag-oil';
    if (t.includes('earn')) return 'tag-earnings';
    if (t.includes('data') || t.includes('econ')) return 'tag-data';
    if (t.includes('flow') || t.includes('posit')) return 'tag-flow';
    return '';
  };

  const getDirectionClass = (dir: string) => {
    const d = (dir || '').toLowerCase();
    if (d === 'up') return 'up';
    if (d === 'down') return 'down';
    if (d === 'neutral') return 'neutral';
    return 'flat';
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
              <div className="ts-dot" />
              <span className="ts-label">Last Updated:</span>
              <span className="ts-value">{intel.meta?.generated || intel.meta?.last_updated || 'N/A'}</span>
            </div>
          </div>
          <div className="subtitle">
            {intel.meta?.period_covered} | Dominant narratives · Catalyst calendar · Scenario planning · Key levels
          </div>
        </header>

        {/* Regime Banner */}
        {intel.regime && (
          <div className="regime-banner" style={{ borderColor: `${getColor(intel.regime.color)}33` }}>
            <div className="regime-dot" style={{ background: getColor(intel.regime.color) }} />
            <span className="regime-label" style={{ color: getColor(intel.regime.color) }}>
              {intel.regime.label}
            </span>
            <span className="regime-desc">{intel.regime.description}</span>
          </div>
        )}

        <div className="container">
          {/* Market Snapshot */}
          {intel.market_snapshot && (
            <section>
              <h2 className="section-title">Market Snapshot</h2>
              <div className="grid-3">
                <div className="card">
                  <h4>Global Indexes</h4>
                  {intel.market_snapshot.indexes?.map((item: any, i: number) => (
                    <div key={i} className="stat-row">
                      <span className="stat-label">{item.label}</span>
                      <div className={`stat-val ${getDirectionClass(item.direction)}`}>
                        {item.value}
                        {item.update && <span className="stat-update-note">{item.update}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h4>Macro & Fed</h4>
                  {intel.market_snapshot.macro_fed?.map((item: any, i: number) => (
                    <div key={i} className="stat-row">
                      <span className="stat-label">{item.label}</span>
                      <div className={`stat-val ${getDirectionClass(item.direction)}`}>
                        {item.value}
                        {item.update && <span className="stat-update-note">{item.update}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h4>Energy & Volatility</h4>
                  {intel.market_snapshot.energy_volatility?.map((item: any, i: number) => (
                    <div key={i} className="stat-row">
                      <span className="stat-label">{item.label}</span>
                      <div className={`stat-val ${getDirectionClass(item.direction)}`}>
                        {item.value}
                        {item.update && <span className="stat-update-note">{item.update}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Stories to Track */}
          {intel.stories_to_track && (
            <section>
              <h2 className="section-title">Stories to Track</h2>
              <div className="grid-2">
                <div className="card">
                  <h4>Geopolitical Risk</h4>
                  {intel.stories_to_track.geopolitical?.map((item: any, i: number) => (
                    <div key={i} className="watchlist-item">
                      <div className={`w-dot ${getDirectionClass(item.direction)}`} />
                      <div className="w-label">{item.label}</div>
                      <div className="w-status">{item.status}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h4>Sector Signals</h4>
                  {intel.stories_to_track.sector_signals?.map((item: any, i: number) => (
                    <div key={i} className="watchlist-item">
                      <div className={`w-dot ${getDirectionClass(item.direction)}`} />
                      <div className="w-label">{item.label}</div>
                      <div className="w-status">{item.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Narratives Section */}
          {intel.dominant_narratives && (
            <section>
              <h2 className="section-title">Dominant Narratives</h2>
              {intel.dominant_narratives.map((narrative: any, idx: number) => {
                const isThread = narrative.type === 'story_thread' || (narrative.updates && narrative.updates.length > 0);
                
                if (isThread) {
                  return (
                    <div key={idx} className="story-thread">
                      <div className="narrative-card condensed">
                        <h3>
                          {narrative.tag && <span className={`tag ${getTagClass(narrative.tag)}`}>{narrative.tag}</span>}
                          {narrative.headline}
                        </h3>
                        <p>{narrative.body || narrative.summary}</p>
                      </div>
                      <div className="update-timeline">
                        <div className="update-timeline-rail">
                          {narrative.updates?.map((update: any, uIdx: number) => (
                            <details key={uIdx} className="update-entry" open={uIdx === 0}>
                              <summary className="update-trigger">
                                <div className="update-trigger-top">
                                  <div className={`update-dot ${uIdx === 0 ? 'live' : ''}`} />
                                  <div className="update-badge">
                                    {uIdx === 0 && <span className="pulse" />}
                                    {update.label || 'Update'}
                                  </div>
                                  <div className="update-timestamp">{update.timestamp}</div>
                                  <div className="update-chevron">▾</div>
                                </div>
                                <div className="update-trigger-headline">{update.headline}</div>
                              </summary>
                              <div className="update-body">
                                <p>{update.body}</p>
                                {update.market_impact && (
                                  <div className="market-impact">
                                    <div className="market-impact-label">Market Impact // {update.market_impact.session || 'Analysis'}</div>
                                    <p>{update.market_impact.text || update.market_impact}</p>
                                  </div>
                                )}
                                {update.sources && update.sources.length > 0 && (
                                  <details className="sources-drawer">
                                    <summary className="sources-toggle">
                                      Sources <span className="sources-count">{update.sources.length}</span>
                                      <span className="sources-chevron">▾</span>
                                    </summary>
                                    <ul className="sources-list">
                                      {update.sources.map((source: any, sIdx: number) => (
                                        <li key={sIdx}>
                                          <span className="source-label">{source.label}</span><br />
                                          <a href={source.url} target="_blank" rel="noopener">{source.url}</a>
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
                      {narrative.tag && <span className={`tag ${getTagClass(narrative.tag)}`}>{narrative.tag}</span>}
                      {narrative.headline}
                    </h3>
                    <p>{narrative.body || narrative.summary}</p>
                    {narrative.market_impact && (
                      <div className="market-impact">
                        <div className="market-impact-label">Market Impact</div>
                        <p>{narrative.market_impact}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          <hr className="divider" />

          {/* Catalyst Calendar */}
          {intel.catalyst_calendar && (
            <section>
              <h2 className="section-title">Scheduled Catalysts</h2>
              <div className="timeline">
                {intel.catalyst_calendar.map((c: any, idx: number) => (
                  <div key={idx} className={`tl-item ${c.impact || 'low'}`}>
                    <div className="tl-date">{c.date_label}</div>
                    <div className="tl-title">
                      {c.event}
                      {c.flag && <span className="inline-update">{c.flag}</span>}
                    </div>
                    <div className="tl-body">{c.body}</div>
                    {c.tags && (
                      <div className="tl-tags">
                        {c.tags.map((tag: string, tIdx: number) => (
                          <span key={tIdx} className={`tag ${getTagClass(tag)}`}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <hr className="divider" />

          {/* Scenarios */}
          {intel.scenarios && (
            <section>
              <h2 className="section-title">Scenario Planning</h2>
              <div className="grid-2">
                {intel.scenarios.map((s: any, idx: number) => (
                  <div key={idx} className="scenario">
                    <div className="scenario-header">
                      <div className="scenario-icon" style={{ background: getColorDim(s.case), color: getColor(s.case) }}>
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
              </div>
            </section>
          )}

          {/* Key Questions */}
          {intel.key_questions && (
            <section>
              <h2 className="section-title">Key Questions</h2>
              <div className="question-block">
                {intel.key_questions.map((q: any, idx: number) => (
                  <p key={idx}>
                    <strong>{q.number || idx + 1}.</strong> {q.question}
                    <span className={`q-${q.status?.replace('_', '-') || 'unanswered'}`}>
                      {q.status?.replace('_', ' ') || 'Unanswered'}
                    </span>
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>
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
          padding-bottom: 100px;
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
        }
      `}</style>
    </div>
  );
}
