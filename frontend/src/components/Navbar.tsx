import React from 'react';
import { ActiveTab } from '../types';
import { Radio, Shield, Users, PlusCircle, ArrowRight, Activity, Flame } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
  criticalCount: number;
  activeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenReportModal,
  criticalCount,
  activeCount
}) => {
  return (
    <header className="rn-navbar">
      <div className="rn-navbar-container">
        {/* Brand */}
        <div 
          className="rn-nav-brand" 
          onClick={() => onTabChange('landing')}
          style={{ cursor: 'pointer' }}
        >
          <div className="rn-brand-icon">
            <Radio size={18} className="rn-pulse-subtle" />
          </div>
          <span className="rn-brand-text">Relief<span>Net</span></span>
        </div>

        {/* Center Pill Menu (When in Landing view) */}
        {activeTab === 'landing' ? (
          <nav className="rn-nav-center-pill">
            <a href="#overview" className="rn-pill-link">Overview</a>
            <a href="#how-it-works" className="rn-pill-link">How It Works</a>
            <a href="#capabilities" className="rn-pill-link">Capabilities</a>
            <a href="#roles" className="rn-pill-link">Roles</a>
            <a href="#impact" className="rn-pill-link">Impact</a>
          </nav>
        ) : (
          <div className="rn-nav-center-status">
            <span className="rn-live-badge">OPERATIONS CONSOLE ACTIVE</span>
            <span className="rn-live-summary">
              {activeCount} Active Emergencies • {criticalCount} Critical
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="rn-nav-actions">
          {/* Quick View Switcher Pill */}
          <div className="rn-view-switcher">
            <button 
              type="button" 
              className={`rn-view-btn ${activeTab === 'landing' ? 'active' : ''}`}
              onClick={() => onTabChange('landing')}
            >
              Overview
            </button>
            <button 
              type="button" 
              className={`rn-view-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => onTabChange('dashboard')}
            >
              <Shield size={13} />
              <span>Coordinator</span>
            </button>
            <button 
              type="button" 
              className={`rn-view-btn ${activeTab === 'volunteer' ? 'active' : ''}`}
              onClick={() => onTabChange('volunteer')}
            >
              <Users size={13} />
              <span>Volunteer</span>
            </button>
          </div>

          {/* Emergency Report SOS Button */}
          <button 
            type="button" 
            className="rn-nav-sos-btn"
            onClick={onOpenReportModal}
            id="nav-report-sos-btn"
          >
            <PlusCircle size={15} />
            <span>Report Need</span>
          </button>

          {/* Primary CTA Button */}
          {activeTab === 'landing' ? (
            <button 
              type="button" 
              className="rn-nav-launch-btn"
              onClick={() => onTabChange('dashboard')}
            >
              <span>Launch Platform</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button 
              type="button" 
              className="rn-nav-home-btn"
              onClick={() => onTabChange('landing')}
            >
              <span>Public Overview</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
