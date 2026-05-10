'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import './ProfileModal.css';

interface ProfileModalProps {
  symbol: string;
  onClose: () => void;
}

interface ProfileRow {
  id: string;
  instrument: string;
  session_date: string;
  session_open: string;
  session_close: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  total_volume: number;
  poc_price: number;
  vah_price: number;
  val_price: number;
  open_regime: string;
  close_regime: string;
  tpo_profile: Record<string, number>;
  period_closes?: Record<string, number>;
  is_complete: boolean;
}

const TICK_CONFIG: Record<string, number> = {
  'ES': 0.25,
  'NQ': 0.25,
  'YM': 1.00,
  'RTY': 0.10,
  'GC': 0.10,
  'CL': 0.01,
  'SI': 0.005
};

export default function ProfileModal({ symbol, onClose }: ProfileModalProps) {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Aggregation state: 'raw' is 1 tick. Others are tick multipliers: 5, 10, 20, 50, 100.
  const [tickAgg, setTickAgg] = useState<number>(1);

  const baseTick = TICK_CONFIG[symbol] || 0.25;

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('market_profiles')
          .select('*')
          .eq('instrument', symbol)
          .order('session_date', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        // Reverse so the oldest is on the left, newest on the right
        setProfiles((data || []).reverse());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [symbol]);

  // Compute shared price axis based on global min/max across all 5 profiles and aggregation level
  const sharedAxis = useMemo(() => {
    if (profiles.length === 0) return { prices: [], globalMaxCount: 0 };

    let globalMin = Infinity;
    let globalMax = -Infinity;
    let globalMaxCount = 0;

    const interval = baseTick * tickAgg;

    // Step 1: Find raw global min/max
    profiles.forEach(p => {
      const keys = Object.keys(p.tpo_profile).map(Number);
      if (keys.length > 0) {
        const min = Math.min(...keys);
        const max = Math.max(...keys);
        if (min < globalMin) globalMin = min;
        if (max > globalMax) globalMax = max;
      }
    });

    if (globalMin === Infinity) return { prices: [], globalMaxCount: 0 };

    // Step 2: Snap global min/max to the new aggregation interval
    // We floor the min and ceil the max to ensure the range covers everything
    const snapMin = Math.floor(globalMin / interval) * interval;
    const snapMax = Math.ceil(globalMax / interval) * interval;

    // Step 3: Create the shared array of prices
    const prices: number[] = [];
    for (let p = snapMax; p >= snapMin - 0.000001; p -= interval) {
      prices.push(parseFloat(p.toFixed(6)));
    }

    // Step 4: Find global max count for scaling the bars visually relative to each other
    profiles.forEach(p => {
      // We must aggregate each profile to find its max count
      const aggCounts: Record<number, number> = {};
      Object.entries(p.tpo_profile).forEach(([priceStr, count]) => {
        const pNum = parseFloat(priceStr);
        const bucket = Math.floor(pNum / interval) * interval;
        // Fix float precision issues for map keys
        const bucketKey = parseFloat(bucket.toFixed(6));
        aggCounts[bucketKey] = (aggCounts[bucketKey] || 0) + count;
      });
      const maxCount = Math.max(0, ...Object.values(aggCounts));
      if (maxCount > globalMaxCount) globalMaxCount = maxCount;
    });

    return { prices, globalMaxCount, interval };
  }, [profiles, tickAgg, baseTick]);

  // Compute aggregated data for each profile so we don't recalculate in render
  const aggregatedProfiles = useMemo(() => {
    const { interval } = sharedAxis;
    if (!interval) return [];

    return profiles.map(p => {
      const aggCounts: Record<number, number> = {};
      let totalTpo = 0;
      let pocCount = -1;
      let pocPrice = 0;

      Object.entries(p.tpo_profile).forEach(([priceStr, count]) => {
        const pNum = parseFloat(priceStr);
        const bucket = Math.floor(pNum / interval) * interval;
        const bucketKey = parseFloat(bucket.toFixed(6));
        aggCounts[bucketKey] = (aggCounts[bucketKey] || 0) + count;
        totalTpo += count;
      });

      const getBucket = (p: number | null | undefined) => {
        if (p === undefined || p === null) return null;
        return parseFloat((Math.floor(p / interval + 0.000001) * interval).toFixed(6));
      };

      return {
        ...p,
        aggCounts,
        totalTpo,
        aggPoc: getBucket(p.poc_price),
        aggVah: getBucket(p.vah_price),
        aggVal: getBucket(p.val_price),
        aggOpen: getBucket(p.open_price),
        aggClose: getBucket(p.close_price),
        aggHigh: getBucket(p.high_price),
        aggLow: getBucket(p.low_price)
      };
    });
  }, [profiles, sharedAxis]);

  const getRegimeColorClass = (regime: string | null | undefined) => {
    if (!regime) return '';
    const lower = regime.toLowerCase();
    if (lower.includes('neutral')) return 'neutral';
    if (lower.includes('risk-on')) return 'risk-on';
    if (lower.includes('risk-off')) return 'risk-off';
    return '';
  };

  const formatProfileDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'MMMM do, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const formatProfileDay = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'EEEE');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <div className="modal-title">
            <span className="text-accent font-bold text-xl">{symbol}</span>
            <span className="text-secondary ml-4">Market Profiles (Last {profiles.length} Sessions)</span>
          </div>
          
          <div className="modal-controls">
            <label className="text-xs text-muted mono uppercase">Aggregation</label>
            <select 
              className="agg-select mono" 
              value={tickAgg} 
              onChange={e => setTickAgg(Number(e.target.value))}
            >
              <option value={1}>Raw Ticks ({baseTick})</option>
              <option value={5}>5 Ticks ({(baseTick * 5).toFixed(2)})</option>
              <option value={10}>10 Ticks ({(baseTick * 10).toFixed(2)})</option>
              <option value={20}>20 Ticks ({(baseTick * 20).toFixed(2)})</option>
              <option value={50}>50 Ticks ({(baseTick * 50).toFixed(2)})</option>
              <option value={100}>100 Ticks ({(baseTick * 100).toFixed(2)})</option>
            </select>
            <button className="btn mono text-xs ml-4" onClick={onClose}>CLOSE</button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="p-20 text-center mono animate-pulse">FETCHING PROFILE DATA...</div>
          ) : error ? (
            <div className="p-20 text-center mono text-danger">ERROR: {error}</div>
          ) : profiles.length === 0 ? (
            <div className="p-20 text-center mono text-secondary">NO PROFILE DATA AVAILABLE FOR THIS SYMBOL.</div>
          ) : (
            <div className="profiles-container">
              {/* Left Price Axis */}
              <div className="price-axis">
                <div className="histogram-inner">
                  {(() => {
                    const rowCount = sharedAxis.prices.length;
                    if (rowCount === 0) return null;
                    const labelHeight = 14; 
                    const containerHeight = 650;
                    const labelStep = Math.max(1, Math.ceil((labelHeight * rowCount) / containerHeight));
                    const decimals = baseTick < 0.01 ? 3 : baseTick < 0.1 ? 2 : 2;
                    const dispDecimals = sharedAxis.interval! >= 1 ? 0 : decimals;
                    
                    const labels = [];
                    for (let i = 0; i < rowCount; i++) {
                      if (i % labelStep === 0 || i === 0 || i === rowCount - 1) {
                        labels.push(
                          <div key={sharedAxis.prices[i]} className="axis-label" style={{ 
                            position: 'absolute',
                            top: `${(i / rowCount) * 100}%`,
                            height: `${(1 / rowCount) * 100}%`,
                            width: '100%'
                          }}>
                            {sharedAxis.prices[i].toFixed(dispDecimals)}
                          </div>
                        );
                      }
                    }
                    return labels;
                  })()}
                </div>
              </div>

              {/* Profiles Grid */}
              <div className="profiles-grid" style={{ gridTemplateColumns: `repeat(${aggregatedProfiles.length}, 1fr)` }}>
                {aggregatedProfiles.map((profile, pIdx) => (
                  <div key={profile.id} className="profile-column">
                    <div className="profile-header mono">
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
                            // Safe index calculation
                            const maxP = sharedAxis.prices[0];
                            const idx = Math.round((maxP - p) / sharedAxis.interval!);
                            return (idx >= 0 && idx < rowCount) ? idx : -1;
                          };

                          Object.keys(profile.aggCounts).forEach(priceStr => {
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
                            // Fix float issues
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

                          return (
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}>
                              <polyline
                                points={points.join(' ')}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.8)"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                              />
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
                                // Show every 4th label to avoid crowding, plus the very last one
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
