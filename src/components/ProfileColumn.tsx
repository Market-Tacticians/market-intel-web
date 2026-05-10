import React from 'react';
import { format } from 'date-fns';

export interface SharedAxis {
  prices: number[];
  globalMaxCount: number;
  interval: number;
}

export interface ProfileColumnProps {
  profile: any;
  baseTick: number;
  sharedAxis: SharedAxis;
  titleOverride?: string;
  isSnapshot?: boolean;
}

export function getRegimeColorClass(regime: string | null | undefined) {
  if (!regime) return '';
  const lower = regime.toLowerCase();
  if (lower.includes('neutral')) return 'neutral';
  if (lower.includes('risk-on')) return 'risk-on';
  if (lower.includes('risk-off')) return 'risk-off';
  return '';
}

export function formatProfileDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'MMMM do, yyyy');
  } catch (e) {
    return dateStr;
  }
}

export function formatProfileDay(dateStr: string) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'EEEE');
  } catch (e) {
    return '';
  }
}

export default function ProfileColumn({ profile, baseTick, sharedAxis, titleOverride, isSnapshot }: ProfileColumnProps) {
  return (
    <div className={`profile-column ${isSnapshot ? 'is-snapshot' : ''}`}>
      <div className="profile-header mono">
        {titleOverride ? (
          <div className="day-header" style={{ marginBottom: 0, paddingBottom: 12, borderBottom: 'none' }}>
             <span className="text-accent text-[15px]">{titleOverride}</span>
             {profile.displayRegime && (
               <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-tighter">
                 <span className="text-muted">{profile.regimeLabel || 'Regime'}:</span>
                 <span className={`regime-badge ${getRegimeColorClass(profile.displayRegime)}`}>{profile.displayRegime}</span>
               </div>
             )}
          </div>
        ) : (
          <>
            <div className="day-header">{formatProfileDay(profile.session_date)}</div>
            <div className="flex justify-between items-center">
              <div className="date text-accent text-[15px]">{formatProfileDate(profile.session_date)}</div>
              <div className="status uppercase text-xs text-muted">
                {profile.is_complete ? 'Complete' : 'Developing'}
              </div>
            </div>
            
            <div className="regimes mt-3 flex justify-between text-[11px] uppercase tracking-wider">
              <div className="text-left">
                <span className="text-muted block mb-1">Open Regime</span>
                <span className={`regime-badge ${getRegimeColorClass(profile.open_regime)}`}>{profile.open_regime || 'N/A'}</span>
              </div>
              <div className="text-right">
                <span className="text-muted block mb-1">Close Regime</span>
                <span className={`regime-badge ${getRegimeColorClass(profile.close_regime)}`}>{profile.close_regime || 'N/A'}</span>
              </div>
            </div>
          </>
        )}

        <div className="stats mt-3 text-xs grid grid-cols-2 gap-1.5 border-t border-[rgba(255,255,255,0.1)] pt-2.5">
          <div>Open: {profile.open_price?.toFixed(baseTick < 1 ? 2 : 0)}</div>
          <div>High: {profile.high_price?.toFixed(baseTick < 1 ? 2 : 0)}</div>
          <div>Low: {profile.low_price?.toFixed(baseTick < 1 ? 2 : 0)}</div>
          <div>Close: {profile.close_price?.toFixed(baseTick < 1 ? 2 : 0)}</div>
          <div>POC: {profile.poc_price?.toFixed(baseTick < 1 ? 2 : 0)}</div>
          <div>Vol: {profile.total_volume?.toLocaleString()}</div>
          <div>VAH: {profile.vah_price?.toFixed(baseTick < 1 ? 2 : 0)}</div>
          <div>VAL: {profile.val_price?.toFixed(baseTick < 1 ? 2 : 0)}</div>
        </div>
      </div>
      <div className="histogram-wrapper">
        <div className="histogram-inner">
          {(() => {
            const rowCount = sharedAxis.prices.length;
            if (rowCount === 0) return null;

            const renderIndices = new Set<number>();
            const getIndex = (p: number | null | undefined) => {
              if (p === null || p === undefined) return -1;
              const maxP = sharedAxis.prices[0];
              const idx = Math.round((maxP - p) / sharedAxis.interval!);
              return (idx >= 0 && idx < rowCount) ? idx : -1;
            };

            Object.keys(profile.aggCounts || {}).forEach(priceStr => {
              const p = parseFloat(priceStr);
              const idx = getIndex(p);
              if (idx !== -1) renderIndices.add(idx);
            });

            [profile.aggPoc, profile.aggVah, profile.aggVal, profile.aggOpen, profile.aggClose, profile.aggHigh, profile.aggLow].forEach(p => {
              const idx = getIndex(p);
              if (idx !== -1) renderIndices.add(idx);
            });

            return Array.from(renderIndices).map(idx => {
              const priceKey = sharedAxis.prices[idx];
              const count = profile.aggCounts[parseFloat(priceKey.toFixed(6))] || 0;
              const widthPct = sharedAxis.globalMaxCount > 0 ? (count / sharedAxis.globalMaxCount) * 100 : 0;
              const isPoc = priceKey === profile.aggPoc;
              const isVah = priceKey === profile.aggVah;
              const isVal = priceKey === profile.aggVal;
              const isOpen = priceKey === profile.aggOpen;
              const isClose = priceKey === profile.aggClose;
              
              let classNames = ['row'];
              if (isPoc) classNames.push('is-poc');
              if (isVah) classNames.push('is-vah');
              if (isVal) classNames.push('is-val');
              if (isOpen) classNames.push('is-open');
              if (isClose) {
                if (profile.close_price > profile.open_price) {
                  classNames.push('is-close-up');
                } else if (profile.close_price < profile.open_price) {
                  classNames.push('is-close-down');
                } else {
                  classNames.push('is-close-flat');
                }
              }

              return (
                <div key={priceKey} className={classNames.join(' ')} style={{
                  position: 'absolute',
                  top: `${(idx / rowCount) * 100}%`,
                  height: `${(1 / rowCount) * 100}%`,
                  width: '100%'
                }}>
                  <div className="bar-container">
                    {count > 0 && (
                      <div className="bar" style={{ width: `${widthPct}%` }}></div>
                    )}
                    {count > 0 && (
                      <div className="count-tooltip">
                        {priceKey.toFixed(baseTick < 1 ? (baseTick < 0.01 ? 3 : 2) : 0)} | {count.toLocaleString()} TPO ({((count / profile.totalTpo) * 100).toFixed(1)}%)
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
          {(() => {
            const periods = Object.keys(profile.period_closes || {}).sort();
            if (periods.length < 2) return null;

            const maxP = sharedAxis.prices[0];
            const rowCount = sharedAxis.prices.length;

            const points = periods.map((period, i) => {
              const price = profile.period_closes![period];
              if (price === undefined || price === null) return null;
              const exactIdx = (maxP - price) / sharedAxis.interval!;
              const yPct = ((exactIdx + 0.5) / rowCount) * 100;
              const xPct = (i / (periods.length - 1)) * 100;
              return `${xPct},${yPct}`;
            }).filter(Boolean);

            if (points.length < 2) return null;

            const cutoffPeriod = periods.find(p => p.endsWith('07:00'));
            let cutoffPoint = null;
            if (cutoffPeriod) {
              const i = periods.indexOf(cutoffPeriod);
              const price = profile.period_closes[cutoffPeriod];
              const exactIdx = (maxP - price) / sharedAxis.interval!;
              cutoffPoint = {
                x: (i / (periods.length - 1)) * 100,
                y: ((exactIdx + 0.5) / rowCount) * 100
              };
            }

            return (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}>
                <polyline
                  points={points.join(' ')}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                {titleOverride === "Resolved Session" && cutoffPoint && (
                  <circle 
                    cx={cutoffPoint.x} 
                    cy={cutoffPoint.y} 
                    r="1.5" 
                    fill="var(--amber)" 
                    stroke="white" 
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
            );
          })()}
          {(() => {
            const periods = Object.keys(profile.period_closes || {}).sort();
            if (periods.length < 2) return null;

            return (
              <div className="time-axis">
                {periods.map((period, i) => {
                  const timePart = period.split(' ')[1];
                  const xPct = (i / (periods.length - 1)) * 100;
                  if (i % 4 !== 0 && i !== periods.length - 1) return null;

                  return (
                    <div key={period} className="time-label" style={{ left: `${xPct}%` }}>
                      {timePart}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
