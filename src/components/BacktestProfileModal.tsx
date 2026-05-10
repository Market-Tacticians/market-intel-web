'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import ProfileColumn from './ProfileColumn';
import './ProfileModal.css';

interface BacktestProfileModalProps {
  symbol: string;
  archiveDate: string; // YYYY-MM-DD
  onClose: () => void;
}

export default function BacktestProfileModal({ symbol, archiveDate, onClose }: BacktestProfileModalProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [tickAgg, setTickAgg] = useState<number>(1);

  const TICK_CONFIG: Record<string, number> = {
    'ES': 0.25,
    'NQ': 0.25,
    'YM': 1.00,
    'RTY': 0.10,
    'GC': 0.10,
    'CL': 0.01,
    'SI': 0.005
  };
  const baseTick = TICK_CONFIG[symbol] || 0.25;

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true);
        // Fetch up to 5 sessions ending on the archive date
        const { data, error } = await supabase
          .from('market_profiles')
          .select('*')
          .eq('instrument', symbol)
          .lte('session_date', archiveDate)
          .order('session_date', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        const rawData = (data || []).reverse();

        // Transform the data to insert the snapshot column
        const finalProfiles: any[] = [];
        
        rawData.forEach(row => {
          if (row.session_date === archiveDate && row.snapshot_730) {
             // Create the partial 7:30 AM snapshot profile
             finalProfiles.push({
               ...row,
               id: row.id + '-snapshot',
               isSnapshot: true,
               ...row.snapshot_730,
               displayRegime: row.snapshot_730.regime || row.open_regime,
               regimeLabel: 'Open Regime'
             });
          }
          finalProfiles.push({ 
            ...row, 
            isSnapshot: false,
            displayRegime: row.session_date === archiveDate ? row.close_regime : null,
            regimeLabel: row.session_date === archiveDate ? 'Close Regime' : null
          });
        });

        setProfiles(finalProfiles);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [symbol, archiveDate]);

  const sharedAxis = useMemo(() => {
    if (profiles.length === 0) return { prices: [], globalMaxCount: 0, interval: 0 };

    let globalMin = Infinity;
    let globalMax = -Infinity;
    let globalMaxCount = 0;

    const interval = baseTick * tickAgg;

    profiles.forEach(p => {
      const keys = Object.keys(p.tpo_profile || {}).map(Number);
      if (keys.length > 0) {
        const min = Math.min(...keys);
        const max = Math.max(...keys);
        if (min < globalMin) globalMin = min;
        if (max > globalMax) globalMax = max;
      }
    });

    if (globalMin === Infinity) return { prices: [], globalMaxCount: 0, interval: 0 };

    const snapMin = Math.floor(globalMin / interval) * interval;
    const snapMax = Math.ceil(globalMax / interval) * interval;

    const prices: number[] = [];
    for (let p = snapMax; p >= snapMin - 0.000001; p -= interval) {
      prices.push(parseFloat(p.toFixed(6)));
    }

    profiles.forEach(p => {
      const aggCounts: Record<number, number> = {};
      Object.entries(p.tpo_profile || {}).forEach(([priceStr, count]) => {
        const pNum = parseFloat(priceStr);
        const bucket = Math.floor(pNum / interval) * interval;
        const bucketKey = parseFloat(bucket.toFixed(6));
        aggCounts[bucketKey] = (aggCounts[bucketKey] || 0) + (count as number);
      });
      const maxCount = Math.max(0, ...Object.values(aggCounts));
      if (maxCount > globalMaxCount) globalMaxCount = maxCount;
    });

    return { prices, globalMaxCount, interval };
  }, [profiles, tickAgg, baseTick]);

  const aggregatedProfiles = useMemo(() => {
    const { interval } = sharedAxis;
    if (!interval) return [];

    return profiles.map(p => {
      const aggCounts: Record<number, number> = {};
      let totalTpo = 0;

      Object.entries(p.tpo_profile || {}).forEach(([priceStr, count]) => {
        const pNum = parseFloat(priceStr);
        const bucket = Math.floor(pNum / interval) * interval;
        const bucketKey = parseFloat(bucket.toFixed(6));
        const c = count as number;
        aggCounts[bucketKey] = (aggCounts[bucketKey] || 0) + c;
        totalTpo += c;
      });

      const getBucket = (val: number | null | undefined) => {
        if (val === undefined || val === null) return null;
        return parseFloat((Math.floor(val / interval + 0.000001) * interval).toFixed(6));
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

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '95vw' }}>
        <div className="modal-header" style={{ borderBottomColor: 'var(--amber)' }}>
          <div className="modal-title">
            <span className="text-amber font-bold text-xl">{symbol}</span>
            <span className="text-secondary ml-4 uppercase">Backtest Mode (7:30 AM ET)</span>
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
            <div className="p-20 text-center mono animate-pulse text-amber">FETCHING BACKTEST DATA...</div>
          ) : error ? (
            <div className="p-20 text-center mono text-danger">ERROR: {error}</div>
          ) : profiles.length === 0 ? (
            <div className="p-20 text-center mono text-secondary">NO PROFILE DATA AVAILABLE FOR THIS SYMBOL/DATE.</div>
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
                {aggregatedProfiles.map((profile, idx) => {
                  let titleOverride = undefined;
                  if (profile.isSnapshot) {
                    titleOverride = "Snapshot (7:30 AM ET)";
                  } else if (profile.session_date === archiveDate) {
                    titleOverride = "Resolved Session";
                  }
                  
                  return (
                    <ProfileColumn 
                      key={profile.id}
                      profile={profile}
                      baseTick={baseTick}
                      sharedAxis={sharedAxis}
                      titleOverride={titleOverride}
                      isSnapshot={profile.isSnapshot}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
