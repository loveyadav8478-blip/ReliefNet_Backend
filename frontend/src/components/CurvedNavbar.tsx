import React, { useState } from 'react';
import { 
  Leaf, 
  Flame, 
  Shield, 
  Users, 
  FileText, 
  Compass, 
  ChevronDown, 
  LogOut, 
  KeyRound, 
  PlusCircle, 
  Radio, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { ActiveTab, CurrentUser, UserRole } from '../types';

interface CurvedNavbarProps {
  activeTab: ActiveTab;
  currentUser: CurrentUser | null;
  onTabChange: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
  onOpenAuthModal: (mode: 'signin' | 'register', role?: UserRole) => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  isModalOpen?: boolean;
}

export const CurvedNavbar: React.FC<CurvedNavbarProps> = ({
  activeTab,
  currentUser,
  onTabChange,
  onOpenReportModal,
  onOpenAuthModal,
  onSwitchRole,
  onLogout,
  isModalOpen = false
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (activeTab !== 'landing') {
      onTabChange('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="rn-top-app-header" aria-label="Main Navigation Bar">
      <div className="rn-top-nav-container">
        {/* Brand with Logo & Live Grid Status */}
        <div 
          className="rn-nav-brand-group"
          onClick={() => {
            onTabChange('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          role="button"
          tabIndex={0}
          title="ReliefNet Home"
        >
          <div className="rn-brand-logo-icon">
            <Leaf size={20} color="#10b981" />
          </div>
          <div className="rn-brand-titles">
            <span className="rn-brand-text">Relief<span>Net</span></span>
            <span className="rn-brand-sub">CRISIS GRID</span>
          </div>
        </div>

        {/* Center Dynamic Capsule */}
        <div className="rn-nav-center-area">
          {activeTab === 'landing' ? (
            <nav className="rn-landing-nav-capsule" aria-label="Landing Page Navigation">
              <button 
                type="button" 
                className="rn-nav-capsule-link is-active"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Overview
              </button>
              <button 
                type="button" 
                className="rn-nav-capsule-link"
                onClick={() => scrollToSection('how-it-works')}
              >
                How It Works
              </button>
              <button 
                type="button" 
                className="rn-nav-capsule-link"
                onClick={() => scrollToSection('roles')}
              >
                Roles &amp; Portals
              </button>
              <button 
                type="button" 
                className="rn-nav-capsule-link"
                onClick={() => scrollToSection('story-banner')}
              >
                Impact Story
              </button>
              <button 
                type="button" 
                className="rn-nav-capsule-link"
                onClick={() => scrollToSection('about')}
              >
                About
              </button>
            </nav>
          ) : null}
        </div>

        {/* Right Actions: SOS Report Button & User Account / Sign In */}
        <div className="rn-nav-right-actions">
          {/* Emergency SOS Report Button */}
          <button
            type="button"
            className="rn-nav-sos-trigger-btn"
            onClick={onOpenReportModal}
            id="top-nav-sos-btn"
            title="Submit Emergency Need Incident"
          >
            <Flame size={16} fill="#ffffff" color="#ffffff" className="rn-sos-flame-icon" />
            <span>Report Need</span>
          </button>

          {/* User Account / Sign In Dropdown */}
          {currentUser ? (
            <div className="rn-user-profile-menu-wrap">
              <button
                type="button"
                className="rn-user-pill-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
              >
                <div className={`rn-user-avatar is-${currentUser.role}`}>
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="rn-user-pill-labels">
                  <span className="rn-user-pill-name">{currentUser.name.split(' ')[0]}</span>
                  <span className={`rn-user-pill-badge is-${currentUser.role}`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {isUserMenuOpen && (
                <div className="rn-user-dropdown-panel">
                  <div className="rn-udrop-header">
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.email}</span>
                    <span className="rn-udrop-role-tag">{currentUser.role.toUpperCase()} ACCOUNT</span>
                  </div>

                  <div className="rn-udrop-divider" />

                  {/* Switch to other roles quickly */}
                  <div className="rn-udrop-section-title">SWITCH ACTIVE VIEW</div>
                  <button
                    type="button"
                    className="rn-udrop-item"
                    onClick={() => {
                      onSwitchRole('reporter');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <FileText size={15} color="#0284c7" />
                    <span>Reporter Portal</span>
                  </button>
                  <button
                    type="button"
                    className="rn-udrop-item"
                    onClick={() => {
                      onSwitchRole('volunteer');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <Users size={15} color="#059669" />
                    <span>Volunteer Portal</span>
                  </button>
                  <button
                    type="button"
                    className="rn-udrop-item"
                    onClick={() => {
                      onSwitchRole('coordinator');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <Compass size={15} color="#10b981" />
                    <span>Coordinator Dashboard</span>
                  </button>

                  <div className="rn-udrop-divider" />

                  <button
                    type="button"
                    className="rn-udrop-item"
                    onClick={() => {
                      onOpenAuthModal('signin');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <KeyRound size={15} color="#10b981" />
                    <span>Switch User / Relogin</span>
                  </button>

                  <button
                    type="button"
                    className="rn-udrop-item danger"
                    onClick={() => {
                      onLogout();
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rn-guest-auth-actions">
              <button
                type="button"
                className="rn-guest-signin-btn"
                onClick={() => onOpenAuthModal('signin')}
              >
                Sign In
              </button>

              <button
                type="button"
                className="rn-guest-help-btn"
                onClick={() => onOpenAuthModal('signin', 'reporter')}
              >
                <span>Get Help</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
