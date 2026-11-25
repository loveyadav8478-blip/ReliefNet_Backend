import React, { useState } from 'react';
import { 
  Home, 
  Flame, 
  Users, 
  FileText, 
  Compass, 
  Leaf, 
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Activity,
  Layers,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  LifeBuoy,
  LogOut,
  Sparkles,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { ActiveTab, CurrentUser, UserRole } from '../types';

export type CoordinatorSubTab = 'operations' | 'incidents' | 'volunteers' | 'inventory' | 'geospatial' | 'analytics';
export type VolunteerSubTab = 'active_mission' | 'nearby_alerts' | 'history';
export type ReporterSubTab = 'tracking' | 'report_new' | 'shelters';

interface LeftDockNavbarProps {
  activeTab: ActiveTab;
  currentUser: CurrentUser | null;
  coordinatorSubTab?: CoordinatorSubTab;
  onCoordinatorSubTabChange?: (tab: CoordinatorSubTab) => void;
  volunteerSubTab?: VolunteerSubTab;
  onVolunteerSubTabChange?: (tab: VolunteerSubTab) => void;
  reporterSubTab?: ReporterSubTab;
  onReporterSubTabChange?: (tab: ReporterSubTab) => void;
  criticalIncidentCount?: number;
  activeVolunteerCount?: number;
  deployedAssetCount?: number;
  completedMissionCount?: number;
  nearbyAlertCount?: number;
  onTabChange: (tab: ActiveTab) => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenReportModal: () => void;
  onOpenAuthModal: (mode: 'signin' | 'register', role?: UserRole) => void;
  onLogout: () => void;
}

export const LeftDockNavbar: React.FC<LeftDockNavbarProps> = ({
  activeTab,
  currentUser,
  coordinatorSubTab = 'operations',
  onCoordinatorSubTabChange,
  volunteerSubTab = 'active_mission',
  onVolunteerSubTabChange,
  reporterSubTab = 'tracking',
  onReporterSubTabChange,
  criticalIncidentCount = 0,
  activeVolunteerCount = 0,
  deployedAssetCount = 0,
  completedMissionCount = 0,
  nearbyAlertCount = 0,
  onTabChange,
  onSwitchRole,
  onOpenReportModal,
  onOpenAuthModal,
  onLogout
}) => {
  // Collapsed vs expanded dock
  const [isExpanded, setIsExpanded] = useState(false);

  // Smooth scroll for landing anchor links
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 1. COORDINATOR WORKSPACE MAIN PAGES
  const coordinatorPages = [
    {
      id: 'operations' as CoordinatorSubTab,
      label: 'Operations Center',
      sublabel: 'Live Triage & Pulse',
      icon: Activity,
      badge: 'LIVE',
      badgeType: 'live'
    },
    {
      id: 'incidents' as CoordinatorSubTab,
      label: 'Incident Dispatch',
      sublabel: 'Priority Incident Queue',
      icon: ShieldAlert,
      badge: `${criticalIncidentCount} CRITICAL`,
      badgeType: 'critical'
    },
    {
      id: 'volunteers' as CoordinatorSubTab,
      label: 'Volunteer Roster',
      sublabel: 'Field Responder Network',
      icon: Users,
      badge: `${activeVolunteerCount} ACTIVE`,
      badgeType: 'neutral'
    },
    {
      id: 'inventory' as CoordinatorSubTab,
      label: 'Resource Inventory',
      sublabel: 'Depots & Deployments',
      icon: Layers,
      badge: `${deployedAssetCount} IN FIELD`,
      badgeType: 'warn'
    },
    {
      id: 'geospatial' as CoordinatorSubTab,
      label: 'Geospatial Radar',
      sublabel: 'Tactical Live Map Grid',
      icon: Compass,
      badge: 'RADAR',
      badgeType: 'live'
    },
    {
      id: 'analytics' as CoordinatorSubTab,
      label: 'Analytics & SLA',
      sublabel: 'Response Time & AI Audit',
      icon: BarChart3,
      badge: 'SLA',
      badgeType: 'neutral'
    }
  ];

  // 2. VOLUNTEER WORKSPACE MAIN PAGES
  const volunteerPages = [
    {
      id: 'active_mission' as VolunteerSubTab,
      label: 'Active Mission',
      sublabel: 'Assigned Field Dispatch',
      icon: Shield,
      badge: 'ASSIGNED',
      badgeType: 'critical'
    },
    {
      id: 'nearby_alerts' as VolunteerSubTab,
      label: 'Nearby Alerts',
      sublabel: 'Unclaimed Local Incidents',
      icon: AlertTriangle,
      badge: `${nearbyAlertCount} NEARBY`,
      badgeType: 'warn'
    },
    {
      id: 'history' as VolunteerSubTab,
      label: 'Mission History',
      sublabel: 'Completed Field Responses',
      icon: CheckCircle2,
      badge: `${completedMissionCount} DONE`,
      badgeType: 'neutral'
    }
  ];

  // 3. CITIZEN REPORTER WORKSPACE MAIN PAGES
  const reporterPages = [
    {
      id: 'tracking' as ReporterSubTab,
      label: 'Track Incidents',
      sublabel: 'Real-time Status & Chat',
      icon: Navigation,
      badge: 'ACTIVE',
      badgeType: 'live'
    },
    {
      id: 'report_new' as ReporterSubTab,
      label: 'Report Emergency',
      sublabel: 'Submit Ground SOS',
      icon: Flame,
      badge: 'SOS',
      badgeType: 'critical'
    },
    {
      id: 'shelters' as ReporterSubTab,
      label: 'Relief Shelters',
      sublabel: 'Nearby Safe Havens',
      icon: LifeBuoy,
      badge: 'SAFE ZONES',
      badgeType: 'neutral'
    }
  ];

  // 4. PUBLIC LANDING PAGE — DIRECT PORTAL LAUNCHERS (Zero Duplicate Section Links with Top Navbar)
  const portalLaunchers = [
    {
      id: 'dashboard' as ActiveTab,
      role: 'coordinator' as UserRole,
      label: 'Coordinator HQ',
      sublabel: 'Command Center & Triage',
      icon: Compass,
      badge: 'HQ',
      badgeType: 'live'
    },
    {
      id: 'volunteer' as ActiveTab,
      role: 'volunteer' as UserRole,
      label: 'Volunteer Portal',
      sublabel: 'Field Responder Network',
      icon: Users,
      badge: 'FIELD',
      badgeType: 'warn'
    },
    {
      id: 'reporter' as ActiveTab,
      role: 'reporter' as UserRole,
      label: 'Reporter Portal',
      sublabel: 'Civilian Ground SOS',
      icon: Flame,
      badge: 'CITIZEN',
      badgeType: 'critical'
    }
  ];

  // Current view role label & theme
  const getHeaderContext = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Coordinator', tag: 'HQ COMMAND', tagClass: 'coordinator' };
      case 'volunteer':
        return { title: 'Volunteer', tag: 'FIELD DESK', tagClass: 'volunteer' };
      case 'reporter':
        return { title: 'Reporter', tag: 'CITIZEN SOS', tagClass: 'reporter' };
      default:
        return { title: 'ReliefNet', tag: 'CRISIS GRID', tagClass: 'landing' };
    }
  };

  const headerContext = getHeaderContext();

  return (
    <aside 
      className={`rn-left-dock-container ${isExpanded ? 'is-expanded' : 'is-collapsed'}`} 
      aria-label="ReliefNet Workspace Navigation"
    >
      <div className="rn-left-dock-pill">
        {/* Top Header: Brand & Portal Indicator */}
        {isExpanded ? (
          <div className="rn-ldock-header-row">
            <div className="rn-ldock-brand-btn" title="Current Portal">
              <div className="rn-ldock-leaf-icon">
                <Leaf size={18} color="#10b981" />
              </div>
              <div className="rn-ldock-header-titles">
                <span className="rn-ldock-brand-name">{headerContext.title}</span>
                <span className={`rn-ldock-role-pill ${headerContext.tagClass}`}>{headerContext.tag}</span>
              </div>
            </div>

            <button
              type="button"
              className="rn-ldock-toggle-btn"
              onClick={() => setIsExpanded(false)}
              title="Collapse Navigation"
              aria-label="Collapse Navigation"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="rn-ldock-brand-btn is-collapsed-brand"
            onClick={() => setIsExpanded(true)}
            title="Click to Expand Navigation"
            aria-label="Click to Expand Navigation"
          >
            <div className="rn-ldock-leaf-icon">
              <Leaf size={18} color="#10b981" />
            </div>
          </button>
        )}

        <div className="rn-ldock-divider" />

        {/* =========================================================================
            CASE 1: COORDINATOR HQ PORTAL — DEDICATED MAIN COORDINATOR PAGES
            ========================================================================= */}
        {activeTab === 'dashboard' && (
          <nav className="rn-ldock-nav-items">
            {coordinatorPages.map((page) => {
              const Icon = page.icon;
              const isActive = coordinatorSubTab === page.id;

              return (
                <div key={page.id} className="rn-ldock-item-wrap">
                  <button
                    type="button"
                    className={`rn-ldock-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => onCoordinatorSubTabChange?.(page.id)}
                    aria-label={page.label}
                    title={!isExpanded ? `${page.label} — ${page.sublabel}` : undefined}
                  >
                    <div className="rn-ldock-icon-box">
                      <Icon size={19} />
                    </div>
                    {isExpanded && (
                      <div className="rn-ldock-label-box">
                        <span className="rn-ldock-main-title">{page.label}</span>
                        <span className="rn-ldock-subtitle">{page.sublabel}</span>
                      </div>
                    )}
                    {isExpanded && page.badge && (
                      <span className={`rn-ldock-badge ${page.badgeType}`}>{page.badge}</span>
                    )}
                  </button>

                  {!isExpanded && (
                    <div className="rn-ldock-tooltip">
                      <strong>{page.label}</strong>
                      <span>{page.sublabel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {/* =========================================================================
            CASE 2: VOLUNTEER FIELD PORTAL — DEDICATED VOLUNTEER PAGES
            ========================================================================= */}
        {activeTab === 'volunteer' && (
          <nav className="rn-ldock-nav-items">
            {volunteerPages.map((page) => {
              const Icon = page.icon;
              const isActive = volunteerSubTab === page.id;

              return (
                <div key={page.id} className="rn-ldock-item-wrap">
                  <button
                    type="button"
                    className={`rn-ldock-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => onVolunteerSubTabChange?.(page.id)}
                    aria-label={page.label}
                    title={!isExpanded ? `${page.label} — ${page.sublabel}` : undefined}
                  >
                    <div className="rn-ldock-icon-box">
                      <Icon size={19} />
                    </div>
                    {isExpanded && (
                      <div className="rn-ldock-label-box">
                        <span className="rn-ldock-main-title">{page.label}</span>
                        <span className="rn-ldock-subtitle">{page.sublabel}</span>
                      </div>
                    )}
                    {isExpanded && page.badge && (
                      <span className={`rn-ldock-badge ${page.badgeType}`}>{page.badge}</span>
                    )}
                  </button>

                  {!isExpanded && (
                    <div className="rn-ldock-tooltip">
                      <strong>{page.label}</strong>
                      <span>{page.sublabel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {/* =========================================================================
            CASE 3: CITIZEN REPORTER PORTAL — DEDICATED REPORTER PAGES
            ========================================================================= */}
        {activeTab === 'reporter' && (
          <nav className="rn-ldock-nav-items">
            {reporterPages.map((page) => {
              const Icon = page.icon;
              const isActive = reporterSubTab === page.id;

              return (
                <div key={page.id} className="rn-ldock-item-wrap">
                  <button
                    type="button"
                    className={`rn-ldock-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => onReporterSubTabChange?.(page.id)}
                    aria-label={page.label}
                    title={!isExpanded ? `${page.label} — ${page.sublabel}` : undefined}
                  >
                    <div className="rn-ldock-icon-box">
                      <Icon size={19} />
                    </div>
                    {isExpanded && (
                      <div className="rn-ldock-label-box">
                        <span className="rn-ldock-main-title">{page.label}</span>
                        <span className="rn-ldock-subtitle">{page.sublabel}</span>
                      </div>
                    )}
                    {isExpanded && page.badge && (
                      <span className={`rn-ldock-badge ${page.badgeType}`}>{page.badge}</span>
                    )}
                  </button>

                  {!isExpanded && (
                    <div className="rn-ldock-tooltip">
                      <strong>{page.label}</strong>
                      <span>{page.sublabel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {/* =========================================================================
            CASE 4: PUBLIC LANDING PAGE — SECTION QUICK JUMPS
            ========================================================================= */}
        {activeTab === 'landing' && (
          <nav className="rn-ldock-nav-items">
            {portalLaunchers.map((portal) => {
              const Icon = portal.icon;

              return (
                <div key={portal.id} className="rn-ldock-item-wrap">
                  <button
                    type="button"
                    className="rn-ldock-nav-btn"
                    onClick={() => {
                      onSwitchRole(portal.role);
                      onTabChange(portal.id);
                    }}
                    aria-label={portal.label}
                    title={!isExpanded ? `${portal.label} — ${portal.sublabel}` : undefined}
                  >
                    <div className="rn-ldock-icon-box">
                      <Icon size={19} />
                    </div>
                    {isExpanded && (
                      <div className="rn-ldock-label-box">
                        <span className="rn-ldock-main-title">{portal.label}</span>
                        <span className="rn-ldock-subtitle">{portal.sublabel}</span>
                      </div>
                    )}
                    {isExpanded && portal.badge && (
                      <span className={`rn-ldock-badge ${portal.badgeType}`}>{portal.badge}</span>
                    )}
                  </button>

                  {!isExpanded && (
                    <div className="rn-ldock-tooltip">
                      <strong>{portal.label}</strong>
                      <span>{portal.sublabel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {/* Bottom Action Section: Return to Public Grid or Resume Session */}
        <div className="rn-ldock-divider" />

        <div className="rn-ldock-footer-section">
          {activeTab !== 'landing' ? (
            <button
              type="button"
              className="rn-ldock-exit-btn"
              onClick={() => onTabChange('landing')}
              title={!isExpanded ? 'Exit to Public Crisis Grid' : undefined}
              aria-label="Exit to Public Crisis Grid"
            >
              <div className="rn-ldock-icon-box">
                <ArrowLeft size={17} />
              </div>
              {isExpanded && (
                <div className="rn-ldock-label-box">
                  <span className="rn-ldock-main-title">Exit to Public Grid</span>
                  <span className="rn-ldock-subtitle">ReliefNet Main Feed</span>
                </div>
              )}
            </button>
          ) : (
            currentUser ? (
              <button
                type="button"
                className="rn-ldock-exit-btn is-resume"
                onClick={() => {
                  if (currentUser.role === 'coordinator') onTabChange('dashboard');
                  else if (currentUser.role === 'volunteer') onTabChange('volunteer');
                  else onTabChange('reporter');
                }}
                title={!isExpanded ? `Resume ${currentUser.role} Portal` : undefined}
                aria-label={`Resume ${currentUser.role} Portal`}
              >
                <div className="rn-ldock-icon-box">
                  <Compass size={17} color="#10b981" />
                </div>
                {isExpanded && (
                  <div className="rn-ldock-label-box">
                    <span className="rn-ldock-main-title" style={{ color: '#34d399' }}>Resume {currentUser.role}</span>
                    <span className="rn-ldock-subtitle">Active Workspace</span>
                  </div>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="rn-ldock-exit-btn"
                onClick={() => onOpenAuthModal('signin')}
                title={!isExpanded ? 'Sign In / Authenticate' : undefined}
                aria-label="Sign In / Authenticate"
              >
                <div className="rn-ldock-icon-box">
                  <KeyRound size={17} />
                </div>
                {isExpanded && (
                  <div className="rn-ldock-label-box">
                    <span className="rn-ldock-main-title">Sign In</span>
                    <span className="rn-ldock-subtitle">Access Role Portals</span>
                  </div>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </aside>
  );
};
