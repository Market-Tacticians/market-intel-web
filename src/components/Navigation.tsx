'use client';

import React from 'react';
import './Navigation.css';

export type TabType = 'archive' | 'template';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'archive', label: 'Archive', icon: '🗄️' },
    { id: 'template', label: 'Template Mock Up', icon: '🧪' },
  ];

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
