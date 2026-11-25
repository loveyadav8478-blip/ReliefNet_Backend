import React, { useState } from 'react';
import { 
  NeedReport, 
  CurrentUser 
} from '../types';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Send, 
  PlusCircle, 
  ShieldCheck, 
  LifeBuoy, 
  MessageSquare,
  FileText,
  ArrowLeft,
  KeyRound,
  Users,
  Compass
} from 'lucide-react';

interface ReporterPortalProps {
  currentUser: CurrentUser;
  needs: NeedReport[];
  onSubmitNewReport: (report: Partial<NeedReport>) => void;
  onOpenReportModal: () => void;
  onSwitchToLanding: () => void;
  onSwitchRole: (role: 'coordinator' | 'volunteer' | 'reporter') => void;
  onOpenAuthModal: () => void;
  activeSubTab?: 'tracking' | 'report_new' | 'shelters';
  onSubTabChange?: (tab: 'tracking' | 'report_new' | 'shelters') => void;
}

export const ReporterPortal: React.FC<ReporterPortalProps> = ({
  currentUser,
  needs,
  onSubmitNewReport,
  onOpenReportModal,
  onSwitchToLanding,
  onSwitchRole,
  onOpenAuthModal,
  activeSubTab,
  onSubTabChange
}) => {
  // Filter needs reported by this citizen or relevant to their sector
  const [internalTab, setInternalTab] = useState<'tracking' | 'report_new' | 'shelters'>('tracking');
  const activeTab = activeSubTab || internalTab;
  const setActiveTab = (tab: 'tracking' | 'report_new' | 'shelters') => {
    setInternalTab(tab);
    onSubTabChange?.(tab);
  };
  // Ensure the page always starts from the top on mount and tab switch
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const [liveChatNote, setLiveChatNote] = useState('');
  // Ground comms start empty: nothing is invented on a reporter's card.
  const [chatMessages, setChatMessages] = useState<Record<string, { sender: string; text: string; time: string }[]>>({});

  // This list already comes from /api/needs/my, which the backend scopes to the
  // signed-in reporter, so every card belongs to this person.
  const reportedNeeds = needs;

  const handleSendChatUpdate = (needId: string) => {
    if (!liveChatNote.trim()) return;
    setChatMessages(prev => ({
      ...prev,
      [needId]: [
        ...(prev[needId] || []),
        { sender: currentUser.name, text: liveChatNote.trim(), time: 'Just now' }
      ]
    }));
    setLiveChatNote('');
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 1;
      case 'ASSIGNED': return 2;
      case 'IN_PROGRESS': return 3;
      case 'RESOLVED': return 4;
      default: return 1;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'RESPONDER DISPATCHED';
      case 'IN_PROGRESS': return 'RESPONDER EN ROUTE';
      case 'RESOLVED': return 'INCIDENT RESOLVED';
      default: return 'AWAITING TRIAGE';
    }
  };

  return (
    <div className="rn-reporter-portal">
      {/* Top Welcome & Reporter Profile Bar */}
      <div className="rn-reporter-hero-header">
        <div className="rn-reporter-profile-info">
          <div className="rn-reporter-avatar-badge">
            <FileText size={24} color="#0284c7" />
          </div>
          <div>
            <div className="rn-reporter-role-badge">CIVILIAN SCOUT &amp; CITIZEN PORTAL</div>
            <h2>{currentUser.name}</h2>
            <div className="rn-reporter-meta-row">
              <span>📍 {currentUser.location?.address || 'Location not provided'}</span>
              <span>•</span>
              <span>📞 {currentUser.phone || 'Phone not provided'}</span>
              <span>•</span>
              <span className="rn-badge-verified">Verified Citizen Reporter</span>
            </div>
          </div>
        </div>

        <div className="rn-reporter-quick-actions">
          <button
            type="button"
            className="rn-btn-report-emergency-pulse"
            onClick={onOpenReportModal}
          >
            <PlusCircle size={18} />
            <span>Report Emergency Incident</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="rn-reporter-tabs-nav">
        <button
          type="button"
          className={`rn-rep-tab ${activeTab === 'tracking' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          <span>Live Incident Tracker</span>
          <span className="rn-tab-badge">{reportedNeeds.length}</span>
        </button>

        <button
          type="button"
          className={`rn-rep-tab ${activeTab === 'report_new' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('report_new')}
        >
          <span>Submit Ground SOS</span>
          <span className="rn-tab-badge is-urgent">NEW</span>
        </button>

        <button
          type="button"
          className={`rn-rep-tab ${activeTab === 'shelters' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('shelters')}
        >
          <span>Emergency Shelters &amp; Hotlines</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="rn-reporter-content-body">
        {activeTab === 'tracking' && (
          <div className="rn-reporter-tracking-flow">
            {reportedNeeds.length === 0 ? (
              <div className="rn-reporter-empty-state">
                <CheckCircle2 size={48} color="#10b981" />
                <h3>No Active Emergency Dispatches Reported</h3>
                <p>You have not logged any pending crisis incidents. If you or someone nearby is in danger, submit a report immediately.</p>
                <button
                  type="button"
                  className="rn-auth-primary-btn"
                  onClick={onOpenReportModal}
                >
                  <PlusCircle size={16} />
                  <span>Submit Ground Report</span>
                </button>
              </div>
            ) : (
              reportedNeeds.map(need => {
                const step = getStepIndex(need.status);
                const messages = chatMessages[need.id] || [];

                return (
                  <div key={need.id} className="rn-reporter-incident-card">
                    {/* Header with Urgency & Status */}
                    <div className="rn-inc-card-top">
                      <div className="rn-inc-badge-group">
                        <span className={`rn-urgency-pill urgency-${need.urgency.toLowerCase()}`}>
                          {need.urgency} SEVERITY
                        </span>
                        <span className="rn-inc-cat-tag">{need.category}</span>
                        <span className="rn-inc-id-tag">Case #{need.id}</span>
                        <span className={`rn-inc-status-tag is-${need.status.toLowerCase()}`}>
                          {statusLabel(need.status)}
                        </span>
                      </div>
                      <span className="rn-inc-time-tag">Reported {need.reportedAt}</span>
                    </div>

                    <h3 className="rn-inc-title">{need.title}</h3>
                    <p className="rn-inc-desc">{need.description}</p>

                    <div className="rn-inc-loc-strip">
                      <MapPin size={16} color="#ef4444" />
                      <span>{need.location.address}</span>
                      {need.peopleCount && (
                        <span className="rn-people-pill">👥 {need.peopleCount}</span>
                      )}
                    </div>

                    {/* LIVE 4-STAGE PROGRESSION TRACKER */}
                    <div className="rn-reporter-stepper-box">
                      <div className="rn-stepper-label">DISASTER RESPONSE TIMELINE</div>
                      <div className="rn-stepper-track">
                        {/* Step 1: Received */}
                        <div className={`rn-step-node ${step >= 1 ? 'completed' : ''}`}>
                          <div className="rn-step-circle">
                            {step > 1 ? <CheckCircle2 size={16} /> : '1'}
                          </div>
                          <span className="rn-step-name">Submitted</span>
                        </div>
                        <div className={`rn-step-connector ${step >= 2 ? 'filled' : ''}`} />

                        {/* Step 2: Triaged */}
                        <div className={`rn-step-node ${step >= 2 ? 'completed' : ''}`}>
                          <div className="rn-step-circle">
                            {step > 2 ? <CheckCircle2 size={16} /> : '2'}
                          </div>
                          <span className="rn-step-name">AI Triaged</span>
                        </div>
                        <div className={`rn-step-connector ${step >= 3 ? 'filled' : ''}`} />

                        {/* Step 3: Dispatched */}
                        <div className={`rn-step-node ${step >= 3 ? 'completed active-pulse' : ''}`}>
                          <div className="rn-step-circle">
                            {step > 3 ? <CheckCircle2 size={16} /> : '3'}
                          </div>
                          <span className="rn-step-name">Dispatched</span>
                        </div>
                        <div className={`rn-step-connector ${step >= 4 ? 'filled' : ''}`} />

                        {/* Step 4: Resolved */}
                        <div className={`rn-step-node ${step >= 4 ? 'completed' : ''}`}>
                          <div className="rn-step-circle">
                            {step >= 4 ? <CheckCircle2 size={16} /> : '4'}
                          </div>
                          <span className="rn-step-name">Resolved</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned responder banner — mirrors the dispatch the coordinator made */}
                    {need.status !== 'SUBMITTED' && (
                      <div className="rn-assigned-hero-box">
                        <div className="rn-ass-left">
                          <div className="rn-ass-avatar">
                            {(need.recommendedVolunteer?.name ?? 'HQ').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="rn-ass-role-tag">ASSIGNED RESCUE RESPONDER</div>
                            <h4>{need.recommendedVolunteer?.name ?? 'Responder assigned by HQ'}</h4>
                            <span className="rn-ass-sub">{need.recommendedVolunteer?.role ?? 'Field responder'}</span>
                          </div>
                        </div>
                        <div className="rn-ass-right">
                          <span className="rn-ass-sub">{statusLabel(need.status)}</span>
                        </div>
                      </div>
                    )}

                    {/* Direct Ground Comms Feed */}
                    <div className="rn-incident-comms-box">
                      <div className="rn-comms-header">
                        <MessageSquare size={14} color="#10b981" />
                        <span>Direct Ground Comms Channel with Responders</span>
                      </div>
                      
                      <div className="rn-comms-stream">
                        {messages.length === 0 && (
                          <p className="rn-comms-empty">No ground updates yet. Messages you send here are visible to the responding team.</p>
                        )}
                        {messages.map((m, idx) => (
                          <div key={idx} className={`rn-chat-msg ${m.sender === currentUser.name ? 'is-self' : ''}`}>
                            <div className="rn-chat-meta">
                              <strong>{m.sender}</strong>
                              <span>{m.time}</span>
                            </div>
                            <div className="rn-chat-text">{m.text}</div>
                          </div>
                        ))}
                      </div>

                      <div className="rn-chat-input-row">
                        <input
                          type="text"
                          placeholder="Send an update to responding team (e.g. water rising, moved to 2nd floor)..."
                          value={liveChatNote}
                          onChange={e => setLiveChatNote(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendChatUpdate(need.id)}
                        />
                        <button
                          type="button"
                          className="rn-chat-send-btn"
                          onClick={() => handleSendChatUpdate(need.id)}
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'shelters' && (
          <div className="rn-shelters-hotlines-grid">
            {/* 24/7 Helplines Card */}
            <div className="rn-info-card emergency-hotlines">
              <div className="rn-card-kicker">IMMEDIATE 24/7 EMERGENCY CONTACTS</div>
              <h3>Emergency Helplines</h3>
              <p>For immediate life-threatening distress, contact national agencies directly:</p>

              <div className="rn-hotlines-list">
                <a href="tel:112" className="rn-hotline-item">
                  <div className="rn-hl-icon red"><AlertTriangle size={18} /></div>
                  <div className="rn-hl-text">
                    <strong>National Emergency Unified Response</strong>
                    <span>112 (Police, Fire, Ambulance)</span>
                  </div>
                  <Phone size={16} />
                </a>

                <a href="tel:1078" className="rn-hotline-item">
                  <div className="rn-hl-icon orange"><ShieldCheck size={18} /></div>
                  <div className="rn-hl-text">
                    <strong>National Disaster Management Authority</strong>
                    <span>1078 (Disaster Helpline)</span>
                  </div>
                  <Phone size={16} />
                </a>

                <a href="tel:108" className="rn-hotline-item">
                  <div className="rn-hl-icon green"><LifeBuoy size={18} /></div>
                  <div className="rn-hl-text">
                    <strong>Disaster Medical &amp; Trauma Ambulance</strong>
                    <span>108 (Paramedic Dispatch)</span>
                  </div>
                  <Phone size={16} />
                </a>
              </div>
            </div>

            {/* Evacuation Shelters Card */}
            <div className="rn-info-card safe-shelters">
              <div className="rn-card-kicker">ACTIVATED EVACUATION CAMPS</div>
              <h3>Nearest Safe Shelters</h3>
              <p>Government &amp; NGO safe havens with food, clean drinking water, and medical care:</p>

              <div className="rn-shelters-list">
                <div className="rn-shelter-item">
                  <div className="rn-sh-badge available">OPEN • 120 BEDS FREE</div>
                  <h4>Sector 14 Community Center Evac Camp</h4>
                  <div className="rn-sh-meta">
                    <MapPin size={14} />
                    <span>1.2 km away • Sector 14 North Basin</span>
                  </div>
                  <div className="rn-sh-tags">
                    <span>Clean Water</span>
                    <span>Medical Tent</span>
                    <span>Infant Food</span>
                  </div>
                </div>

                <div className="rn-shelter-item">
                  <div className="rn-sh-badge available">OPEN • 85 BEDS FREE</div>
                  <h4>Government Polytechnic College Gymnasium</h4>
                  <div className="rn-sh-meta">
                    <MapPin size={14} />
                    <span>2.4 km away • Elevated Hillcrest Zone</span>
                  </div>
                  <div className="rn-sh-tags">
                    <span>Power Generator</span>
                    <span>Starlink Mesh</span>
                    <span>Restrooms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report_new' && (
          <div className="rn-subview-panel rn-reporter-new-report-card">
            <div className="rn-rn-header-strip">
              <div className="rn-rn-icon-sos">
                <AlertTriangle size={28} color="#ef4444" />
              </div>
              <div>
                <h3>Submit Immediate Ground SOS</h3>
                <p>Provide details for autonomous AI urgency scoring and priority volunteer dispatch.</p>
              </div>
            </div>

            <div className="rn-quick-sos-banner">
              <p>For urgent life-threatening rescue, launch the full emergency incident wizard directly:</p>
              <button
                type="button"
                className="rn-btn-report-emergency-pulse"
                onClick={onOpenReportModal}
              >
                <PlusCircle size={18} />
                <span>Launch SOS Reporting Wizard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
