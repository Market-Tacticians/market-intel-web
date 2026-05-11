'use client';

import React from 'react';
import './Navigation.css';
import { useLatestCorrelations } from '../hooks/useLatestCorrelations';

export type TabType = 'archive' | 'template';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onSymbolSelect: (symbol: string) => void;
}

export default function Navigation({ activeTab, onTabChange, onSymbolSelect }: NavigationProps) {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'archive', label: 'Archive', icon: '🗄️' },
    { id: 'template', label: 'Template Mock Up', icon: '🧪' },
  ];

  const symbols = ['ES', 'NQ', 'YM', 'RTY', 'GC', 'CL', 'SI'];
  const { correlations } = useLatestCorrelations();

  const getAlignmentClass = (alignment?: string) => {
    if (!alignment) return '';
    if (alignment === 'correlated') return 'correlated';
    if (alignment === 'non_correlated') return 'non-correlated';
    if (alignment === 'neutral') return 'neutral';
    return '';
  };

  return (
    <nav className="nav-sidebar glass-panel">
      <div className="nav-brand">
        <div className="brand-logo pulse" />
        <div className="brand-text">
          <span className="brand-main">Market</span>
          <span className="brand-sub">Tactician</span>
        </div>
      </div>

      <div className="nav-items">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label uppercase">{tab.label}</span>
            {activeTab === tab.id && <div className="nav-indicator" />}
          </button>
        ))}
        
        <div className="nav-section-title uppercase mt-6">Market Profiles</div>
        <div className="symbol-grid">
          {symbols.map(sym => {
            const alignment = correlations[sym]?.regime_alignment;
            const alignClass = getAlignmentClass(alignment);
            
            return (
              <button 
                key={sym} 
                className={`symbol-btn mono ${alignClass}`}
                onClick={() => onSymbolSelect(sym)}
                title={alignment ? `Regime Alignment: ${alignment.replace(/_/g, ' ')}` : undefined}
              >
                {sym}
              </button>
            );
          })}
        </div>
      </div>

      <div className="nav-footer">
        <div className="status-indicator">
          <div className="status-dot online" />
          <span className="status-text mono uppercase">System Online</span>
        </div>
      </div>
    </nav>
  );
}
