import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Play, 
  Leaf, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  X, 
  FileText, 
  Compass 
} from 'lucide-react';
import { NeedReport, UserRole } from '../types';
import { ApiDashboardStats } from '../services/api';

interface LandingPageProps {
  onOpenDashboard: () => void;
  onOpenReportModal: () => void;
  onOpenVolunteerPortal: () => void;
  onOpenReporterPortal: () => void;
  onOpenAuthModal: (mode: 'signin' | 'register', role?: UserRole) => void;
  needs: NeedReport[];
  /** Live aggregate counters from /api/dashboard/stats. */
  stats?: ApiDashboardStats | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenDashboard,
  onOpenReportModal,
  onOpenVolunteerPortal,
  onOpenReporterPortal,
  onOpenAuthModal,
  needs,
  stats
}) => {
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const leafRef = useRef<HTMLDivElement>(null);

  // High-performance continuous 3D leaf roll without React component re-rendering
  useEffect(() => {
    let currentAngle = 0;
    let targetAngle = 0;
    let animId: number;

    const handleScroll = () => {
      // Continuous roll angle based on scroll
      targetAngle = window.scrollY * 0.38;
    };

    const updateFrame = () => {
      // Smooth lerp (linear interpolation) for zero-jitter, fluid 60-120fps physics
      currentAngle += (targetAngle - currentAngle) * 0.12;

      if (leafRef.current) {
        // Compound 3D tilt: rolls continuously on X-axis with fixed perspective yaw and roll
        leafRef.current.style.transform = `perspective(900px) rotateX(${currentAngle}deg) rotateY(16deg) rotateZ(-10deg)`;
      }

      animId = requestAnimationFrame(updateFrame);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    animId = requestAnimationFrame(updateFrame);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="rn-figma-landing">

      {/* =========================================================================
          HERO SECTION (Matching Figma Screenshot 1)
          - Left: Real-time community relief badge, Headline with green "relief."
          - Center-Right: Suspended Leaf that ROTATES/ROLLS on scroll + contour lines
          - Orbital rings with PEOPLE, HELP, COMMUNITY nodes
          ========================================================================= */}
      <section className="rn-figma-hero" id="hero">
        {/* Subtle dynamic background gradient and topography glow */}
        <div className="rn-hero-bg-glow" aria-hidden="true" />

        <div className="rn-figma-hero-grid">
          {/* Hero Left Content Column */}
          <div className="rn-hero-text-col">
            {/* Eyebrow with horizontal rule line */}
            <div className="rn-hero-eyebrow-line">
              <span className="rn-eyebrow-text">REAL-TIME COMMUNITY RELIEF</span>
              <span className="rn-eyebrow-hr" />
            </div>

            {/* Main Headline */}
            <h1 className="rn-figma-headline">
              Coordinate <span className="rn-leaf-green">relief.</span><br />
              Help where it matters.
            </h1>

            {/* Subtitle */}
            <p className="rn-figma-subtitle">
              ReliefNet connects people who need help with volunteers who can make a difference — quickly, locally, and simply.
            </p>

            {/* Dual CTA Buttons */}
            <div className="rn-figma-cta-row">
              <button
                type="button"
                className="rn-hero-btn-help"
                onClick={onOpenReportModal}
                id="hero-need-help-btn"
              >
                <span>I Need Help</span>
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="rn-hero-btn-volunteer"
                onClick={onOpenVolunteerPortal}
                id="hero-volunteer-btn"
              >
                <span>Volunteer</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          {/* Hero Right Visual: SUSPENDED LEAF WITH ROTATION ON SCROLL */}
          <div className="rn-hero-visual-col" aria-label="Interactive 3D Suspended Leaf with Dynamic Scroll Rotation">
            <div className="rn-leaf-stage-container">
              {/* Soft Ambient Emerald Glow Disk */}
              <div className="rn-leaf-ambient-aura" aria-hidden="true" />

              {/* Streamlined, Perfectly Round Orbital System (Clean & High Impact) */}
              <svg 
                className="rn-topo-contours-svg" 
                viewBox="0 0 440 440" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#059669" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.75" />
                  </linearGradient>
                </defs>

                {/* Primary Delicate Orbital Ring (Perfect Circle, r=180) */}
                <circle 
                  cx="220" 
                  cy="220" 
                  r="180" 
                  stroke="url(#orbitGrad)" 
                  strokeWidth="1.5" 
                  strokeDasharray="5 6" 
                  opacity="0.65" 
                />

                {/* Inner Harmonic Orbit (Perfect Circle, r=115) */}
                <circle 
                  cx="220" 
                  cy="220" 
                  r="115" 
                  stroke="#10b981" 
                  strokeWidth="1" 
                  strokeDasharray="3 4" 
                  opacity="0.32" 
                />

                {/* Organic Topographic Elevation Curves (Figma Reference Depth) */}
                <path 
                  d="M 50,170 C 110,130 180,140 270,100 C 330,70 370,90 400,120" 
                  stroke="#059669" 
                  strokeWidth="1" 
                  strokeDasharray="2 3" 
                  opacity="0.18" 
                />
                <path 
                  d="M 25,260 C 95,290 175,260 255,310 C 325,350 365,330 415,310" 
                  stroke="#059669" 
                  strokeWidth="1" 
                  strokeDasharray="2 3" 
                  opacity="0.18" 
                />
                <path 
                  d="M 80,360 C 150,380 220,350 310,390 C 360,410 390,390 420,370" 
                  stroke="#059669" 
                  strokeWidth="0.8" 
                  opacity="0.12" 
                />
              </svg>

              {/* Orbital Nodes (HELP, PEOPLE, COMMUNITY - Placed on the orbit) */}
              <div className="rn-orbit-anchors" aria-hidden="true">
                {/* Node: HELP (Top Right) */}
                <div className="rn-orbit-badge-node node-help">
                  <span className="rn-orbit-pulse-dot" />
                  <span className="rn-orbit-pill-text">HELP</span>
                </div>

                {/* Node: PEOPLE (Middle Left) */}
                <div className="rn-orbit-badge-node node-people">
                  <span className="rn-orbit-pulse-dot" />
                  <span className="rn-orbit-pill-text">PEOPLE</span>
                </div>

                {/* Node: COMMUNITY (Bottom Right) */}
                <div className="rn-orbit-badge-node node-community">
                  <span className="rn-orbit-pulse-dot" />
                  <span className="rn-orbit-pill-text">COMMUNITY</span>
                </div>
              </div>

              {/* REALISTIC GREEN LEAF WITH SMOOTH SCROLL-DRIVEN X-AXIS ROLL */}
              <div 
                ref={leafRef}
                className="rn-leaf-3d-wrapper"
                style={{
                  transform: 'perspective(900px) rotateX(0deg) rotateY(16deg) rotateZ(-10deg)',
                  transformOrigin: '50% 50%',
                  willChange: 'transform'
                }}
              >
                <img 
                  src="/images/hero-leaf.png" 
                  alt="ReliefNet Floating Dynamic Leaf" 
                  className="rn-hero-leaf-img"
                />
                {/* Luminous Vein Accent Overlay */}
                <div className="rn-leaf-glow-aura" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            HERO STATS BAR — live counts from the backend dashboard stats
            ===================================================================== */}
        <div className="rn-figma-stats-bar">
          <div className="rn-fstat-item">
            <div className="rn-fstat-icon"><Users size={20} /></div>
            <div className="rn-fstat-text">
              <strong>{stats ? stats.resolvedNeeds.toLocaleString() : '—'}</strong>
              <span>Requests helped</span>
            </div>
          </div>

          <div className="rn-fstat-item">
            <div className="rn-fstat-icon"><MapPin size={20} /></div>
            <div className="rn-fstat-text">
              <strong>{stats ? stats.availableVolunteers.toLocaleString() : '—'}</strong>
              <span>Active volunteers</span>
            </div>
          </div>

          <div className="rn-fstat-item">
            <div className="rn-fstat-icon"><Clock size={20} /></div>
            <div className="rn-fstat-text">
              <strong>24/7</strong>
              <span>Response coordination</span>
            </div>
          </div>

          <div 
            className="rn-fstat-scroll-explore" 
            onClick={() => {
              const el = document.getElementById('story-banner');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <ChevronDown size={18} className="rn-bounce-down" />
            <span>Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BANNER: "People. Communities. Stronger together." + WATCH STORY
          ========================================================================= */}
      <section className="rn-community-story-banner" id="story-banner">
        <div className="rn-banner-bg-wrap">
          <img 
            src="/images/hero-community-story.jpg" 
            alt="ReliefNet Disaster Response Team on the ground" 
            className="rn-banner-bg-img"
          />
          <div className="rn-banner-dark-overlay" />
        </div>

        <div className="rn-banner-content-row">
          <div className="rn-banner-headline">
            <h2>
              People.<br />
              Communities.<br />
              Stronger together.
            </h2>
          </div>

          <button
            type="button"
            className="rn-banner-watch-story-btn"
            onClick={() => setIsStoryModalOpen(true)}
            id="watch-story-hero-btn"
          >
            <div className="rn-watch-play-circle">
              <Play size={16} fill="#ffffff" color="#ffffff" />
            </div>
            <span>Watch story</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS SECTION: 3 STEP AUTONOMOUS DISPATCH PIPELINE
          ========================================================================= */}
      <section className="rn-how-it-works-section" id="how-it-works">
        <div className="rn-section-container">
          <div className="rn-roles-section-header">
            <span className="rn-kicker-tag">AUTONOMOUS EMERGENCY PIPELINE</span>
            <h2>How ReliefNet Coordinates Crisis in Seconds</h2>
            <p>
              Traditional emergency lines bottleneck during mass disasters. ReliefNet connects ground witnesses directly to verified responders using autonomous AI triage.
            </p>
          </div>

          <div className="rn-pipeline-three-steps">
            <div className="rn-pipe-step-card">
              <div className="rn-pipe-step-number">01</div>
              <div className="rn-pipe-step-icon blue">
                <FileText size={24} />
              </div>
              <h4>1. Ground Witness Reports</h4>
              <p>Civilians or scouts submit emergency needs via photo, voice, or text without mandatory logins. GPS location is captured instantly.</p>
            </div>

            <div className="rn-pipe-step-arrow">→</div>

            <div className="rn-pipe-step-card highlight">
              <div className="rn-pipe-step-number">02</div>
              <div className="rn-pipe-step-icon emerald">
                <Compass size={24} />
              </div>
              <h4>2. Autonomous AI Triage</h4>
              <p>Machine intelligence scores priority (1-100), extracts medical hazards, and matches certified volunteers within travel radius.</p>
            </div>

            <div className="rn-pipe-step-arrow">→</div>

            <div className="rn-pipe-step-card">
              <div className="rn-pipe-step-number">03</div>
              <div className="rn-pipe-step-icon green">
                <Users size={24} />
              </div>
              <h4>3. Rapid Field Deployment</h4>
              <p>Volunteers receive one-tap turn-by-turn dispatches, live responder comms, and track mission resolution in real time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3 ROLES BREAKDOWN: Dedicated Spaces for Volunteer, Coordinator, Reporter
          ========================================================================= */}
      <section className="rn-roles-overview-section" id="roles">
        <div className="rn-section-container">
          <div className="rn-roles-section-header">
            <span className="rn-kicker-tag">TAILORED WORKFLOWS FOR THREE CRITICAL STAKEHOLDERS</span>
            <h2>One Platform. Purpose-Built for Every Responder.</h2>
            <p>
              Unlike cluttered military dashboards, ReliefNet provides dedicated, clean, noise-free interfaces tailored specifically to each individual in the disaster relief chain.
            </p>
          </div>

          <div className="rn-roles-three-grid">
            {/* 1. Reporter Card */}
            <div className="rn-role-preview-card reporter-theme">
              <div className="rn-role-card-badge">FOR CIVILIANS &amp; SCOUTS</div>
              <div className="rn-role-icon-box">
                <FileText size={28} color="#0284c7" />
              </div>
              <h3>1. Ground Reporter</h3>
              <p>
                Fast emergency incident submission without tedious sign-ins. Report trapped citizens or medical emergencies via text or camera with instant AI urgency scoring.
              </p>
              <ul className="rn-role-features-ul">
                <li><CheckCircle2 size={16} color="#0284c7" /> Live 4-stage rescue progression tracker</li>
                <li><CheckCircle2 size={16} color="#0284c7" /> Direct communication channel with responder</li>
                <li><CheckCircle2 size={16} color="#0284c7" /> Instant access to nearest shelters &amp; helplines</li>
              </ul>
              <button
                type="button"
                className="rn-role-launch-btn"
                onClick={onOpenReporterPortal}
                id="enter-reporter-btn"
              >
                <span>Enter as Reporter</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 2. Coordinator Card */}
            <div className="rn-role-preview-card coordinator-theme featured">
              <div className="rn-role-card-badge">FOR NGO COMMAND &amp; DISASTER HQ</div>
              <div className="rn-role-icon-box">
                <Compass size={28} color="#10b981" />
              </div>
              <h3>2. HQ Coordinator</h3>
              <p>
                Tactical command hub with automated AI urgency triage, real-time crisis cluster mapping, smart volunteer dispatching, and equipment fleet tracking.
              </p>
              <ul className="rn-role-features-ul">
                <li><CheckCircle2 size={16} color="#10b981" /> Urgent incident triage &amp; priority score</li>
                <li><CheckCircle2 size={16} color="#10b981" /> 1-Click skill-matched volunteer dispatch</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Dynamic live map with crisis clusters</li>
              </ul>
              <button
                type="button"
                className="rn-role-launch-btn highlight"
                onClick={onOpenDashboard}
                id="enter-coordinator-btn"
              >
                <span>Enter as Coordinator</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 3. Volunteer Card */}
            <div className="rn-role-preview-card volunteer-theme">
              <div className="rn-role-card-badge">FOR FIELD RESPONDERS &amp; MEDICS</div>
              <div className="rn-role-icon-box">
                <Users size={28} color="#059669" />
              </div>
              <h3>3. Field Volunteer</h3>
              <p>
                Mobile-first field workspace without distracting tactical clutter. Receive dispatches matching your certified skills within your selected travel radius.
              </p>
              <ul className="rn-role-features-ul">
                <li><CheckCircle2 size={16} color="#059669" /> One-tap GPS navigation to incident scene</li>
                <li><CheckCircle2 size={16} color="#059669" /> Simple duty availability toggle (On/Off)</li>
                <li><CheckCircle2 size={16} color="#059669" /> Nearby emergency alerts radar</li>
              </ul>
              <button
                type="button"
                className="rn-role-launch-btn"
                onClick={onOpenVolunteerPortal}
                id="enter-volunteer-btn"
              >
                <span>Enter as Volunteer</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          WATCH STORY MODAL
          ========================================================================= */}
      {isStoryModalOpen && (
        <div className="rn-story-modal-overlay" onClick={() => setIsStoryModalOpen(false)}>
          <div className="rn-story-modal-box" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="rn-story-close-btn"
              onClick={() => setIsStoryModalOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="rn-story-media-view">
              <img 
                src="/images/hero-community-story.jpg" 
                alt="Humanitarian relief mission in action" 
                className="rn-story-image"
              />
              <div className="rn-story-play-overlay">
                <div className="rn-story-pulse-circle">
                  <Play size={24} fill="#ffffff" color="#ffffff" />
                </div>
              </div>
            </div>

            <div className="rn-story-details">
              <span className="rn-story-kicker">DISASTER DISPATCH REPORT • EAST VALLEY RESCUE</span>
              <h3>"Within 12 minutes, our water rescue unit was on the ground."</h3>
              <p>
                When flash floods isolated 45 families in the East Valley basin, traditional emergency switchboards were jammed. Through ReliefNet's autonomous AI triage and volunteer grid, 8 certified boat pilots and paramedics were deployed in under 15 minutes, rescuing every single civilian.
              </p>
              <div className="rn-story-quote-author">
                <strong>Dr. Sunita Sen</strong>
                <span>Senior Field Trauma Lead, Sector 4 Emergency Depot</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="rn-figma-footer" id="about">
        <div className="rn-footer-inner">
          <div className="rn-footer-col-left">
            <div className="rn-footer-brand">
              <Leaf size={18} color="#10b981" />
              <span>ReliefNet</span>
            </div>
            <p>Real-time community crisis coordination with artificial intelligence.</p>
          </div>

          <div className="rn-footer-col-right">
            <span>© 2026 ReliefNet Emergency Grid • Open Aid Humanitarian Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
