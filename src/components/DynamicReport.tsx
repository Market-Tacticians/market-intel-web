'use client';

import React, { useState } from 'react';
import './DynamicReport.css';

interface DynamicReportProps {
  data: any;
}

export default function DynamicReport({ data }: DynamicReportProps) {
  const [userNote, setUserNote] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [inspectedItems, setInspectedItems] = useState<Set<string>>(new Set());

  if (!data) return <div className="p-20 text-center mono opacity-40">NO INTEL DATA LOADED</div>;

  const handleInspect = (id: string) => {
    setInspectedItems(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

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

  // --- TOC Calculation ---
  const navItems = [];
  const generatedAt = intel.meta?.generated;

  if (intel.dominant_narratives && intel.dominant_narratives.length > 0) {
    const narrativeItems = intel.dominant_narratives.map((n: any) => ({
      id: `narrative-${n.tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label: n.tag,
      hasUpdate: n.updates && n.updates.length > 0
    }));
    const uniqueTags = new Map();
    narrativeItems.forEach((item: any) => {
      if (!uniqueTags.has(item.label)) uniqueTags.set(item.label, item);
      else if (item.hasUpdate) uniqueTags.get(item.label).hasUpdate = true;
    });
    navItems.push({
      id: 'narratives-section',
      label: 'Dominant Narratives',
      hasUpdate: Array.from(uniqueTags.values()).some(t => t.hasUpdate),
      children: Array.from(uniqueTags.values())
    });
  }

  if (intel.catalyst_calendar && intel.catalyst_calendar.length > 0) {
    const dayGroups = new Map();
    intel.catalyst_calendar.forEach((c: any) => {
      const key = c.date;
      const label = c.date_label.split(' — ')[0];
      const hasUpdate = c.updates && c.updates.length > 0;
      if (!dayGroups.has(key)) {
        dayGroups.set(key, { id: `catalyst-${key}`, label, hasUpdate });
      } else if (hasUpdate) {
        dayGroups.get(key).hasUpdate = true;
      }
    });
    navItems.push({
      id: 'catalyst-calendar',
      label: 'Catalyst Calendar',
      hasUpdate: Array.from(dayGroups.values()).some(d => d.hasUpdate),
      children: Array.from(dayGroups.values())
    });
  }

  if (intel.market_snapshot) {
    navItems.push({
      id: 'market-snapshot',
      label: 'Market Snapshot',
      hasUpdate: intel.market_snapshot.as_of && intel.market_snapshot.as_of !== generatedAt,
      children: []
    });
  }

  if (intel.stories_to_track) {
    navItems.push({
      id: 'stories-to-track',
      label: 'Stories to Track',
      hasUpdate: intel.stories_to_track.as_of && intel.stories_to_track.as_of !== generatedAt,
      children: []
    });
  }

  if (intel.scenarios && intel.scenarios.length > 0) {
    navItems.push({
      id: 'scenarios',
      label: 'Scenario Planning',
      hasUpdate: intel.scenarios.some((s: any) => s.updates && s.updates.length > 0),
      children: []
    });
  }

  if (intel.key_questions && intel.key_questions.length > 0) {
    navItems.push({
      id: 'key-questions',
      label: 'Key Questions',
      hasUpdate: intel.key_questions.some((q: any) => q.updates && q.updates.length > 0),
      children: []
    });
  }

  return (
    <div className="report-root">
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
              <div id="narratives-section" className="section-title">Dominant Narratives</div>
              {intel.dominant_narratives.map((narrative: any, idx: number) => {
                const hasUpdates = narrative.updates && narrative.updates.length > 0;
                const tagSlug = narrative.tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const isFirstOfTag = intel.dominant_narratives.findIndex((n: any) => n.tag === narrative.tag) === idx;
                
                if (hasUpdates) {
                  const originalTray = {
                    is_original: true,
                    label: 'Original Brief',
                    timestamp: intel.meta?.generated || intel.meta?.last_updated || '',
                    headline: narrative.headline,
                    body: narrative.body,
                    bullets: narrative.bullets,
                    market_impact: narrative.market_impact,
                    sources: narrative.sources
                  };
                  
                  const allTrays = [originalTray, ...narrative.updates];

                  return (
                    <div key={idx} id={isFirstOfTag ? `narrative-${tagSlug}` : undefined} className="story-thread">
                      <div className="narrative-card condensed">
                        <h3>
                          <span className={`tag ${getTagClass(narrative.tag)}`}>{narrative.tag}</span>
                          {narrative.headline}
                        </h3>
                        {narrative.summary ? (
                          <p className="narrative-summary mb-3" style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                            {narrative.summary}
                          </p>
                        ) : (
                          <p>{narrative.body}</p>
                        )}
                      </div>

                      <div className="update-timeline">
                        <div className="update-timeline-rail">
                          {allTrays.map((tray: any, tIdx: number) => {
                            const isLive = tIdx === allTrays.length - 1;
                            const updateLabel = tray.label || (isLive ? 'LIVE UPDATE' : `UPDATE ${tIdx}`);
                            const tsStr = tray.is_original ? tray.timestamp : (tray.timestamp ? new Date(tray.timestamp).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).replace(/,/g, '') : '');

                            return (
                              <details key={tIdx} className="update-entry" open={isLive}>
                                <summary className="update-trigger">
                                  <div className="update-trigger-top">
                                    <div className={`update-dot ${isLive ? 'live' : ''}`} />
                                    <span className="update-badge">
                                      {isLive && <span className="pulse" />}
                                      {updateLabel}
                                    </span>
                                    {tsStr && <span className="update-timestamp">{tsStr}</span>}
                                    <span className="update-chevron">▾</span>
                                  </div>
                                  {!tray.is_original && tray.headline && (
                                    <div className="update-trigger-headline">{tray.headline}</div>
                                  )}
                                </summary>
                                <div className="update-body">
                                  <p>{tray.body}</p>
                                  {tray.bullets && tray.bullets.length > 0 && (
                                    <ul className="bullet-list">
                                      {tray.bullets.map((b: string, bIdx: number) => (
                                        <li key={bIdx}>{b}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {tray.market_impact && (
                                    <div className="market-impact">
                                      <div className="market-impact-label">Market Impact — {tray.market_impact.session}</div>
                                      <p>{tray.market_impact.text}</p>
                                    </div>
                                  )}
                                  {tray.sources && tray.sources.length > 0 && (
                                    <details className="sources-drawer">
                                      <summary className="sources-toggle">
                                        Sources <span className="sources-count">{tray.sources.length}</span>
                                        <span className="sources-chevron">▾</span>
                                      </summary>
                                      <ul className="sources-list">
                                        {tray.sources.map((s: any, sIdx: number) => (
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
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} id={isFirstOfTag ? `narrative-${tagSlug}` : undefined} className="narrative-card">
                    <h3>
                      <span className={`tag ${getTagClass(narrative.tag)}`}>{narrative.tag}</span>
                      {narrative.headline}
                    </h3>
                    {narrative.summary && (
                      <p className="narrative-summary mb-3" style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                        {narrative.summary}
                      </p>
                    )}
                    <p>{narrative.body}</p>
                    
                    {narrative.bullets && narrative.bullets.length > 0 && (
                      <ul className="bullet-list">
                        {narrative.bullets.map((b: string, bIdx: number) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                    
                    {narrative.market_impact && (
                      <div className="market-impact">
                        <div className="market-impact-label">Market Impact — {narrative.market_impact.session}</div>
                        <p>{narrative.market_impact.text}</p>
                      </div>
                    )}
                    
                    {narrative.sources && narrative.sources.length > 0 && (
                      <details className="sources-drawer">
                        <summary className="sources-toggle">
                          Sources <span className="sources-count">{narrative.sources.length}</span>
                          <span className="sources-chevron">▾</span>
                        </summary>
                        <ul className="sources-list">
                          {narrative.sources.map((s: any, sIdx: number) => (
                            <li key={sIdx}>
                              <span className="source-label">{s.label}</span><br />
                              <a href={s.url} target="_blank" rel="noopener">{s.url}</a>
                            </li>
                          ))}
                        </ul>
                      </details>
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
              <div id="catalyst-calendar" className="section-title">Catalyst Calendar</div>
              <div className="timeline">
                {intel.catalyst_calendar.map((c: any, idx: number) => {
                  const isFirstOfDay = intel.catalyst_calendar.findIndex((cal: any) => cal.date === c.date) === idx;
                  return (
                  <div key={idx} id={isFirstOfDay ? `catalyst-${c.date}` : undefined} className={`tl-item ${c.impact}`}>
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
                    {c.updates && c.updates.map((upd: any, uIdx: number) => (
                      <div key={uIdx} className="tl-update-note">
                        {upd.text}
                      </div>
                    ))}
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          <hr className="divider" />

          {/* Market Snapshot */}
          {intel.market_snapshot && (
            <section>
              <div id="market-snapshot" className="section-title">
                Market Snapshot
                {intel.market_snapshot.as_of && (
                  <span style={{ marginLeft: 'auto', fontSize: '.65rem', color: 'var(--text-dim)', fontWeight: 'normal', letterSpacing: '1px' }}>
                    AS OF: {new Date(intel.market_snapshot.as_of).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).replace(/,/g, '')}
                  </span>
                )}
              </div>
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
              <div id="stories-to-track" className="section-title">
                Stories to Track
                {intel.stories_to_track.as_of && (
                  <span style={{ marginLeft: 'auto', fontSize: '.65rem', color: 'var(--text-dim)', fontWeight: 'normal', letterSpacing: '1px' }}>
                    AS OF: {new Date(intel.stories_to_track.as_of).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).replace(/,/g, '')}
                  </span>
                )}
              </div>
              <div className="grid-2">
                <div className="card">
                  <h4>Geopolitical & Macro</h4>
                  {intel.stories_to_track.geopolitical_macro?.map((row: any, i: number) => (
                    <div key={i} className="watchlist-item">
                      <div className={`w-dot ${row.direction}`}></div>
                      <div className="w-label">
                        <div>{row.label}</div>
                        {row.updates && row.updates.map((u: any, uIdx: number) => (
                          <div key={uIdx} style={{ fontSize: '.72rem', color: 'var(--amber)', marginTop: 4, lineHeight: 1.4 }}>
                            ↳ {u.text}
                          </div>
                        ))}
                      </div>
                      <span className="w-status">{row.status}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h4>Sector & Stock Signals</h4>
                  {intel.stories_to_track.sector_stock_signals?.map((row: any, i: number) => (
                    <div key={i} className="watchlist-item">
                      <div className={`w-dot ${row.direction}`}></div>
                      <div className="w-label">
                        <div>{row.label}</div>
                        {row.updates && row.updates.map((u: any, uIdx: number) => (
                          <div key={uIdx} style={{ fontSize: '.72rem', color: 'var(--amber)', marginTop: 4, lineHeight: 1.4 }}>
                            ↳ {u.text}
                          </div>
                        ))}
                      </div>
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
              <div id="scenarios" className="section-title">Scenarios</div>
              {intel.scenarios.map((s: any, idx: number) => (
                <div key={idx} className="scenario">
                  <div className="scenario-header">
                    <div className="scenario-icon" style={{ background: getColorDim(s.color), color: getColor(s.color) }}>
                      {s.label}
                    </div>
                    <h4>{s.case} Case: {s.headline}</h4>
                  </div>
                  <p>{s.body}</p>
                  {s.updates && s.updates.map((upd: any, uIdx: number) => {
                    return (
                      <div key={uIdx} className="scenario-update-note" style={{ background: getColorDim(s.color), borderColor: getColorDim(s.color), borderLeftColor: getColor(s.color) }}>
                        <div className="scenario-update-label" style={{ color: getColor(s.color) }}>{upd.headline}</div>
                        <p>{upd.body}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </section>
          )}

          <hr className="divider" />

          {/* Key Questions */}
          {intel.key_questions && (
            <section>
              <div id="key-questions" className="section-title">Key Questions</div>
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
                      {q.updates && q.updates.map((upd: any, uIdx: number) => {
                        const tsStr = upd.timestamp ? new Date(upd.timestamp).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).replace(/,/g, '') : '';
                        return (
                          <span key={`upd-${idx}-${uIdx}`} className="q-answer partial">
                            {tsStr ? <strong style={{color:'var(--amber)', marginRight: 4}}>{tsStr}:</strong> : null}{upd.text}
                          </span>
                        );
                      })}
                      {q.answer && <span className={`q-answer ${q.status !== 'answered' ? 'partial' : ''}`}>{q.answer}</span>}
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

      <div className="navigation-sidebar">
        <div className="nav-header">NAVIGATION</div>
        <ul className="nav-list">
          {navItems.map((item: any) => {
            const hasUninspectedChildUpdate = item.children && item.children.some((c: any) => c.hasUpdate && !inspectedItems.has(c.id));
            const showParentDot = item.hasUpdate && !inspectedItems.has(item.id) && (item.children.length === 0 || hasUninspectedChildUpdate);

            return (
            <li key={item.id} className="nav-group">
              <a href={`#${item.id}`} className="nav-link parent" onClick={() => handleInspect(item.id)}>
                {item.label}
                {showParentDot && <span className="update-dot-amber"><span className="pulse" /></span>}
              </a>
              {item.children.length > 0 && (
                <ul className="nav-sublist">
                  {item.children.map((child: any) => (
                    <li key={child.id}>
                      <a href={`#${child.id}`} className="nav-link child" onClick={() => handleInspect(child.id)}>
                        {child.label}
                        {child.hasUpdate && !inspectedItems.has(child.id) && <span className="update-dot-amber"><span className="pulse" /></span>}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            );
          })}
        </ul>
      </div>

      <style jsx>{`
        .report-root {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          width: 100%;
          min-height: 100%;
          background: var(--bg);
          scroll-behavior: smooth;
        }

        .briefing-container {
          flex: 1;
          min-width: 0;
          padding-bottom: 40px;
        }

        .navigation-sidebar {
          position: sticky;
          top: 0;
          width: 240px;
          flex-shrink: 0;
          padding: 32px 16px 16px 24px;
          border-left: 1px solid var(--border);
          height: 100vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .nav-header {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-bottom: 16px;
          letter-spacing: 1px;
        }

        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-group {
          margin-bottom: 12px;
        }

        .nav-sublist {
          display: none;
          list-style: none;
          padding-left: 12px;
          margin-top: 6px;
          border-left: 1px solid var(--border);
        }

        .nav-group:hover .nav-sublist {
          display: block;
        }

        .nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          color: var(--text-dim);
          font-size: 13px;
          padding: 4px 0;
          transition: color 0.2s;
        }

        .nav-link.parent {
          font-weight: 600;
          color: var(--text);
        }

        .nav-link:hover {
          color: var(--text-bright);
        }

        .update-dot-amber {
          width: 8px;
          height: 8px;
          background: var(--amber);
          border-radius: 50%;
          display: inline-block;
          position: relative;
        }

        .update-dot-amber .pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: var(--amber);
          animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
            flex-direction: column-reverse;
          }
          .navigation-sidebar {
            position: static;
            width: 100%;
            height: auto;
            border-left: none;
            border-bottom: 1px solid var(--border);
            padding: 16px;
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
