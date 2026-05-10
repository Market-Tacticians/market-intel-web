'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import ProfileColumn from './ProfileColumn';
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
    if (profiles.length === 0) return { prices: [], globalMaxCount: 0, interval: 0 };

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

    if (globalMin === Infinity) return { prices: [], globalMaxCount: 0, interval: 0 };

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
                {aggregatedProfiles.map((profile) => (
                  <ProfileColumn 
                    key={profile.id}
                    profile={profile}
                    baseTick={baseTick}
                    sharedAxis={sharedAxis}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
