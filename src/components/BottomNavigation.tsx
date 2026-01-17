import React from 'react';
import './BottomNavigation.css';

interface BottomNavigationProps {
  activeTab: 'player' | 'download';
  onTabChange: (tab: 'player' | 'download') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="bottom-navigation">
      <button
        className={`nav-item ${activeTab === 'player' ? 'active' : ''}`}
        onClick={() => onTabChange('player')}
      >
        <div className="nav-icon">🎵</div>
        <span className="nav-label">Player</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'download' ? 'active' : ''}`}
        onClick={() => onTabChange('download')}
      >
        <div className="nav-icon">⬇️</div>
        <span className="nav-label">Download</span>
      </button>
    </nav>
  );
};