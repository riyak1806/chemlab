import React from 'react';
import { FlaskConical, RotateCcw, Activity } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onResetLab, containerCount, ambientTemp }) {
  return (
    <header className="app-header">
      <div className="brand">
        <FlaskConical className="brand-icon" />
        <span>ChemLab UI</span>
      </div>

      <nav className="nav-links">
        {['Lab', 'Experiments', 'Learn', 'Profile'].map((tab) => (
          <button
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="header-status">
        <span className="status-badge">
          <Activity size={12} /> Live Engine
        </span>
        <span>Temp: {ambientTemp}°C</span>
        <span>Containers: {containerCount}</span>
        <button className="btn-reset-header" onClick={onResetLab}>
          <RotateCcw size={14} /> Reset Lab
        </button>
      </div>
    </header>
  );
}
