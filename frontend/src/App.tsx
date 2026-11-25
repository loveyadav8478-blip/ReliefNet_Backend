import React, { useState } from 'react';
import { ActiveTab, NeedReport, Volunteer, CurrentUser, UserRole } from './types';
import { api, tokenStore, UNAUTHORIZED_EVENT, ApiDashboardStats, ApiVolunteer } from './services/api';
import {
  assignmentsByNeed,
  completedMissionsByVolunteer,
  errorMessage,
  taskIdsByNeed,
  toCurrentUser,
  pickResponder,
  toNeedReport,
  toVolunteer,
  uiCategoryToApi,
  withRecommendations,
} from './services/adapters';
import { CurvedNavbar } from './components/CurvedNavbar';
import { LeftDockNavbar, CoordinatorSubTab, VolunteerSubTab, ReporterSubTab } from './components/LeftDockNavbar';
import { LandingPage } from './components/LandingPage';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { VolunteerPortal } from './components/VolunteerPortal';
import { ReporterPortal } from './components/ReporterPortal';
import { ReportNeedModal } from './components/ReportNeedModal';
import { AuthModal } from './components/AuthModal';

// Retrieve initial role tab from URL hash or localStorage
const getInitialTab = (): ActiveTab => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'coordinator' || hash === 'dashboard') return 'dashboard';
    if (hash === 'volunteer') return 'volunteer';
    if (hash === 'reporter') return 'reporter';

    const savedTab = localStorage.getItem('reliefnet_active_tab') as ActiveTab | null;
    if (savedTab && ['landing', 'dashboard', 'volunteer', 'reporter'].includes(savedTab)) {
      return savedTab;
    }
  }
  return 'landing';
};

const getInitialUser = (): CurrentUser | null => {
  if (typeof window !== 'undefined') {
    // A cached profile without a token is a broken session, not a signed-in user.
    if (!tokenStore.get()) return null;
    const saved = localStorage.getItem('reliefnet_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore malformed cache
      }
    }
  }
  return null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);

  // Data now comes from the backend (no more mock arrays)
  const [needs, setNeeds] = useState<NeedReport[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [taskIds, setTaskIds] = useState<Record<string, string>>({});
  // Real backend counters: the landing page, auth modal and coordinator KPIs all
  // read from this one object, so no screen can show a different total.
  const [stats, setStats] = useState<ApiDashboardStats | null>(null);
  // The signed-in volunteer's own backend record (skills, location, radius).
  const [myVolunteer, setMyVolunteer] = useState<ApiVolunteer | null>(null);
  // Completed missions for the signed-in volunteer, counted from real tasks.
  const [myCompletedMissions, setMyCompletedMissions] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Current active individual (persisted across refresh)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getInitialUser);
  // A cached profile is only trusted once /api/auth/me confirms the stored token,
  // so no authenticated request is fired against a stale session.
  const [sessionReady, setSessionReady] = useState(() => !getInitialUser());

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>(null);

  // Active sub-page tabs for each role portal (restored from localStorage)
  const [coordinatorSubTab, setCoordinatorSubTab] = useState<CoordinatorSubTab>(() => {
    return (localStorage.getItem('reliefnet_coordinator_subtab') as CoordinatorSubTab) || 'operations';
  });
  const [volunteerSubTab, setVolunteerSubTab] = useState<VolunteerSubTab>(() => {
    return (localStorage.getItem('reliefnet_volunteer_subtab') as VolunteerSubTab) || 'active_mission';
  });
  const [reporterSubTab, setReporterSubTab] = useState<ReporterSubTab>(() => {
    return (localStorage.getItem('reliefnet_reporter_subtab') as ReporterSubTab) || 'tracking';
  });

  const isCoordinator = currentUser?.role === 'coordinator';
  const myVolunteerId = currentUser?.volunteerId != null ? String(currentUser.volunteerId) : null;

  // Every refresh gets a sequence number. Signing in/out bumps it so a response
  // that was already in flight for the previous account can never be written
  // into the new session's state.
  const refreshSeq = React.useRef(0);

  /** Drop everything that belonged to the previous account. */
  const resetRoleScopedState = React.useCallback(() => {
    refreshSeq.current += 1;
    setNeeds([]);
    setVolunteers([]);
    setTaskIds({});
    setMyVolunteer(null);
    setMyCompletedMissions(0);
    setSyncError(null);
    setIsSyncing(false);
  }, []);

  /** Pull needs (plus volunteers/tasks where the role allows) from the backend. */
  const refresh = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!currentUser) return;
    const silent = options?.silent === true;
    const seq = (refreshSeq.current += 1);
    if (!silent) setIsSyncing(true);
    try {
      // A reporter only ever sees the incidents they filed themselves.
      const needList =
        currentUser.role === 'reporter' ? await api.needs.my() : await api.needs.list();
      const dashboardStats = await api.dashboard.stats();

      const volunteerList = isCoordinator ? await api.volunteers.list() : [];

      let tasks: Awaited<ReturnType<typeof api.tasks.list>> = [];
      if (isCoordinator) {
        tasks = await api.tasks.list();
      } else if (myVolunteerId) {
        tasks = await api.tasks.byVolunteer(myVolunteerId);
      }

      // A volunteer cannot list the roster, but still needs their own real
      // profile (skills, location, radius) for the field header.
      let ownVolunteer: ApiVolunteer | null = null;
      if (!isCoordinator && myVolunteerId) {
        try {
          ownVolunteer = await api.volunteers.get(myVolunteerId);
        } catch {
          ownVolunteer = null;
        }
      }

      // The account changed while these requests were in flight, so this data
      // describes the previous role and must be discarded.
      if (seq !== refreshSeq.current) return;

      const assignments = assignmentsByNeed(tasks);
      const completed = completedMissionsByVolunteer(tasks);
      const realVolunteers = volunteerList.map((volunteer) =>
        toVolunteer(volunteer, completed[String(volunteer.id)] ?? 0),
      );

      setMyVolunteer(ownVolunteer);
      // Completed missions belong to whoever is signed in, never to the last session.
      setMyCompletedMissions(
        isCoordinator ? 0 : tasks.filter((task) => task.status === 'COMPLETED').length,
      );
      setNeeds(
        withRecommendations(
          needList.map((need) => toNeedReport(need, assignments[String(need.id)])),
          realVolunteers,
        ),
      );
      setVolunteers(realVolunteers);
      setStats(dashboardStats);
      // Replace the map: merging would keep task ids from a previous role,
      // letting this session patch a mission it does not own.
      setTaskIds(taskIdsByNeed(tasks));
      setSyncError(null);
    } catch (error) {
      if (seq !== refreshSeq.current) return;
      setSyncError(errorMessage(error));
    } finally {
      if (seq === refreshSeq.current && !silent) setIsSyncing(false);
    }
  }, [currentUser, isCoordinator, myVolunteerId]);

  // Public aggregate counters, so the signed-out landing page shows real numbers.
  const loadStats = React.useCallback(async () => {
    try {
      setStats(await api.dashboard.stats());
    } catch {
      // leave the previous numbers in place rather than blanking the page
    }
  }, []);

  React.useEffect(() => {
    if (!sessionReady) return;
    void loadStats();
  }, [loadStats, sessionReady]);

  // Live cross-portal sync: a newly reported need reaches the coordinator, and a
  // volunteer's status change reaches the coordinator and the reporter, without
  // anyone having to reload the page.
  React.useEffect(() => {
    if (!sessionReady || !currentUser) return;
    const timer = window.setInterval(() => void refresh({ silent: true }), 6000);
    return () => window.clearInterval(timer);
  }, [refresh, sessionReady, currentUser]);

  // Validate the cached session first; only then load data.
  React.useEffect(() => {
    if (sessionReady) return;
    api.auth
      .me()
      .then((user) => setCurrentUser(toCurrentUser(user)))
      .catch(() => {
        tokenStore.clear();
        localStorage.removeItem('reliefnet_current_user');
        setCurrentUser(null);
      })
      .finally(() => setSessionReady(true));
  }, [sessionReady]);

  React.useEffect(() => {
    if (sessionReady) void refresh();
  }, [refresh, sessionReady]);

  // Any authenticated request rejected with 401 means the session is gone:
  // drop the UI back to a signed-out state instead of leaving it half-signed-in.
  React.useEffect(() => {
    const handleUnauthorized = () => {
      resetRoleScopedState();
      setCurrentUser(null);
      setActiveTab('landing');
      setSyncError('Your session expired. Please sign in again.');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [resetRoleScopedState]);

  const criticalCount = needs.filter((n) => n.urgency === 'CRITICAL' && n.status !== 'RESOLVED').length;
  const activeVolunteersCount = volunteers.filter((v) => v.status === 'AVAILABLE' || v.status === 'DEPLOYED').length;
  const deployedVolunteersCount = volunteers.filter((v) => v.status === 'DEPLOYED').length;

  // A portal tab only renders when someone is signed in
  const effectiveTab: ActiveTab = currentUser ? activeTab : 'landing';

  // Disable browser automatic scroll restoration and force top on load & tab switch
  React.useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Sync activeTab to localStorage and URL hash
  React.useEffect(() => {
    localStorage.setItem('reliefnet_active_tab', activeTab);
    const hash = activeTab === 'dashboard' ? 'coordinator' : activeTab;
    if (window.location.hash.replace('#', '') !== hash) {
      window.history.replaceState(null, '', `#${hash}`);
    }
  }, [activeTab]);

  // Sync currentUser to localStorage
  React.useEffect(() => {
    if (currentUser) {
      localStorage.setItem('reliefnet_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('reliefnet_current_user');
    }
  }, [currentUser]);

  // Sync subtabs to localStorage
  React.useEffect(() => {
    localStorage.setItem('reliefnet_coordinator_subtab', coordinatorSubTab);
  }, [coordinatorSubTab]);

  React.useEffect(() => {
    localStorage.setItem('reliefnet_volunteer_subtab', volunteerSubTab);
  }, [volunteerSubTab]);

  React.useEffect(() => {
    localStorage.setItem('reliefnet_reporter_subtab', reporterSubTab);
  }, [reporterSubTab]);

  // Open Auth Modal helper
  const handleOpenAuth = (mode: 'signin' | 'register', role?: UserRole) => {
    setAuthModalMode(mode);
    setAuthInitialRole(role || null);
    setIsAuthModalOpen(true);
  };

  // Successful Login / Registration (token already stored by AuthModal)
  const homeTabForRole = (role: UserRole): ActiveTab =>
    role === 'coordinator' ? 'dashboard' : role === 'volunteer' ? 'volunteer' : 'reporter';

  const handleLoginSuccess = (user: CurrentUser) => {
    // Start the new account from a clean slate: nothing from the previous
    // session may survive the switch (roster, task ids, mission counts, errors).
    resetRoleScopedState();
    setSessionReady(true);
    setCurrentUser(user);
    void loadStats();
    setActiveTab(homeTabForRole(user.role));
  };

  const handleLogout = () => {
    tokenStore.clear();
    resetRoleScopedState();
    setCurrentUser(null);
    setActiveTab('landing');
    void loadStats();
  };

  // Switch Role from the navbars — requires a real session
  const handleSwitchRole = (role: UserRole) => {
    if (!role) {
      handleLogout();
      return;
    }

    if (currentUser?.role === role) {
      setActiveTab(role === 'coordinator' ? 'dashboard' : role === 'volunteer' ? 'volunteer' : 'reporter');
      return;
    }

    setAuthInitialRole(role);
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  // A deep link or restored tab can belong to another role (e.g. #coordinator
  // opened while a volunteer session is cached). Never show another role's portal.
  React.useEffect(() => {
    if (!currentUser) return;
    const home = homeTabForRole(currentUser.role);
    if (activeTab !== 'landing' && activeTab !== home) setActiveTab(home);
  }, [currentUser, activeTab]);

  // Listen to hash change (browser back/forward buttons or direct hash entry)
  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'coordinator' || hash === 'dashboard') {
        handleSwitchRole('coordinator');
      } else if (hash === 'volunteer') {
        handleSwitchRole('volunteer');
      } else if (hash === 'reporter') {
        handleSwitchRole('reporter');
      } else if (hash === 'landing' || hash === '') {
        setActiveTab('landing');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coordinator dispatches a volunteer to a need -> creates a real task
  const handleDispatchVolunteer = async (needId: string, volunteerId: string) => {
    // The dashboard may hand us an id from its own demo roster; only real ids are dispatchable.
    const need = needs.find((item) => item.id === needId);
    const target = volunteers.find((volunteer) => volunteer.id === volunteerId)
      ?? (need ? pickResponder(need, volunteers) : undefined);

    if (!target) {
      setSyncError('No real volunteer available to dispatch. Add volunteers in the backend first.');
      return;
    }

    try {
      const task = await api.tasks.create({
        needId: Number(needId),
        volunteerId: Number(target.id),
      });
      setTaskIds((prev) => ({ ...prev, [needId]: String(task.id) }));
      await refresh();
    } catch (error) {
      setSyncError(errorMessage(error));
    }
  };

  // Volunteer claims a need from the nearby list
  const handleVolunteerClaimNeed = async (needId: string) => {
    if (isCoordinator) {
      const candidate = volunteers.find((v) => v.status === 'AVAILABLE');
      if (!candidate) {
        setSyncError('No available volunteer to dispatch.');
        return;
      }
      await handleDispatchVolunteer(needId, candidate.id);
      return;
    }
    setSyncError('Only a coordinator can assign a mission. Ask HQ to dispatch you.');
  };

  // Add new reported need -> real POST, then refresh so the async AI analysis shows up
  const handleAddReport = async (newNeedData: Partial<NeedReport>) => {
    try {
      await api.needs.create({
        title: newNeedData.title?.trim() || 'Community emergency incident',
        description: newNeedData.description?.trim() || 'Reported through the ReliefNet app.',
        locationName: newNeedData.location?.address,
        latitude: newNeedData.location?.lat || undefined,
        longitude: newNeedData.location?.lng || undefined,
        reporterName: newNeedData.reporterName || currentUser?.name,
        reporterContact: newNeedData.reporterContact || currentUser?.phone,
      });
      await refresh();
      // The backend analyses new needs asynchronously; pick the result up shortly after
      window.setTimeout(() => void refresh(), 2500);
      window.setTimeout(() => void refresh(), 6000);
    } catch (error) {
      setSyncError(errorMessage(error));
    }
  };

  // Volunteer mission status update -> PATCH the task
  const handleVolunteerUpdateStatus = async (needId: string, newStatus: 'IN_PROGRESS' | 'RESOLVED') => {
    const taskId = taskIds[needId];
    if (!taskId) {
      setSyncError('No assignment found for this need yet.');
      return;
    }
    try {
      // Show the tap's effect immediately, then let the server response confirm it.
      setNeeds((prev) =>
        prev.map((need) => (need.id === needId ? { ...need, status: newStatus } : need)),
      );
      await api.tasks.updateStatus(taskId, newStatus === 'RESOLVED' ? 'COMPLETED' : 'IN_PROGRESS');
      await refresh();
    } catch (error) {
      setSyncError(errorMessage(error));
    }
  };

  const handleToggleVolunteerAvailability = async (volId: string, available?: boolean) => {
    // A signed-in volunteer can only change their own record: the portal passes the
    // profile id, which is a user id for volunteers, so resolve it to volunteerId.
    const idToUse = !isCoordinator && myVolunteerId ? myVolunteerId : volId;
    // Prefer the state the user actually clicked; only fall back to the roster
    // (coordinator view, where the volunteer list is loaded) when it is absent.
    const target = volunteers.find((v) => v.id === idToUse);
    const makeAvailable = available ?? target?.status !== 'AVAILABLE';
    try {
      await api.volunteers.setAvailability(Number(idToUse), makeAvailable);
      await refresh();
    } catch (error) {
      setSyncError(errorMessage(error));
    }
  };

  // The field header must describe the real volunteer record, not UI defaults.
  const volunteerProfile: CurrentUser | null = currentUser?.role === 'volunteer'
    ? {
        ...currentUser,
        phone: myVolunteer?.phone || currentUser.phone,
        skills: myVolunteer?.skillList?.length
          ? myVolunteer.skillList
          : myVolunteer?.skills
            ? myVolunteer.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
            : currentUser.skills,
        location: myVolunteer
          ? {
              lat: myVolunteer.latitude ?? 0,
              lng: myVolunteer.longitude ?? 0,
              address: myVolunteer.locationName ?? 'Location not set',
            }
          : currentUser.location,
        travelRadiusKm: myVolunteer?.radiusKm ?? currentUser.travelRadiusKm,
        completedMissions: myCompletedMissions,
      }
    : null;
  const reporterProfile: CurrentUser | null = currentUser?.role === 'reporter' ? currentUser : null;

  const landingPage = (
    <LandingPage
      onOpenDashboard={() => handleSwitchRole('coordinator')}
      onOpenReportModal={() => setIsReportModalOpen(true)}
      onOpenVolunteerPortal={() => handleSwitchRole('volunteer')}
      onOpenReporterPortal={() => handleSwitchRole('reporter')}
      onOpenAuthModal={handleOpenAuth}
      needs={needs}
      stats={stats}
    />
  );

  return (
    <div className="rn-app-root">
      {/* Left-Side Dedicated Workspace Role Dock */}
      <LeftDockNavbar
        activeTab={effectiveTab}
        currentUser={currentUser}
        coordinatorSubTab={coordinatorSubTab}
        onCoordinatorSubTabChange={setCoordinatorSubTab}
        volunteerSubTab={volunteerSubTab}
        onVolunteerSubTabChange={setVolunteerSubTab}
        reporterSubTab={reporterSubTab}
        onReporterSubTabChange={setReporterSubTab}
        criticalIncidentCount={criticalCount}
        activeVolunteerCount={activeVolunteersCount}
        deployedAssetCount={deployedVolunteersCount}
        completedMissionCount={isCoordinator ? (stats?.completedTasks ?? 0) : myCompletedMissions}
        nearbyAlertCount={needs.filter((n) => n.status === 'SUBMITTED').length}
        onTabChange={setActiveTab}
        onSwitchRole={handleSwitchRole}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Top Floating Curved Notch Navbar */}
      <CurvedNavbar
        activeTab={effectiveTab}
        currentUser={currentUser}
        onTabChange={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAuthModal={handleOpenAuth}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        isModalOpen={isReportModalOpen}
      />

      {/* Backend sync error banner (e.g. a 403 from the role rules) */}
      {syncError && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 84,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: '92vw',
            padding: '10px 14px',
            borderRadius: 12,
            background: '#7f1d1d',
            color: '#fff',
            fontSize: 13,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          <span>{syncError}</span>
          <button
            type="button"
            onClick={() => setSyncError(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main View Router with Smooth Page Transitions */}
      <main className="rn-main-viewport">
        <div key={effectiveTab} className="rn-page-transition-wrap">
          {/* VIEW 1: FIGMA HERO LANDING PAGE */}
          {effectiveTab === 'landing' && landingPage}

          {/* VIEW 2: COORDINATOR DASHBOARD (HQ Crisis Command Hub) */}
          {effectiveTab === 'dashboard' && isCoordinator && (
            <CoordinatorDashboard
              needs={needs}
              volunteers={volunteers}
              stats={stats}
              onToggleVolunteerAvailability={handleToggleVolunteerAvailability}
              activeSubTab={coordinatorSubTab}
              onSubTabChange={setCoordinatorSubTab}
              onDispatchVolunteer={handleDispatchVolunteer}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onSwitchToLanding={() => setActiveTab('landing')}
              onSwitchRole={handleSwitchRole}
              onOpenAuthModal={() => handleOpenAuth('signin')}
            />
          )}

          {/* VIEW 3: VOLUNTEER PORTAL (Field Responder View) */}
          {effectiveTab === 'volunteer' && volunteerProfile && (
            <div className="rn-subview-container">
              <VolunteerPortal
                currentVolunteer={volunteerProfile}
                assignedNeeds={needs.filter(
                  (n) =>
                    (myVolunteerId && n.assignedVolunteerId === myVolunteerId) ||
                    (n.status === 'ASSIGNED' && !n.assignedVolunteerId)
                )}
                unassignedNearbyNeeds={needs.filter((n) => n.status === 'SUBMITTED')}
                activeSubTab={volunteerSubTab}
                onSubTabChange={setVolunteerSubTab}
                onUpdateStatus={handleVolunteerUpdateStatus}
                onToggleAvailability={handleToggleVolunteerAvailability}
                onClaimNeed={handleVolunteerClaimNeed}
                onSwitchToLanding={() => setActiveTab('landing')}
                onSwitchRole={handleSwitchRole}
                onOpenAuthModal={() => handleOpenAuth('signin')}
              />
            </div>
          )}

          {/* VIEW 4: REPORTER PORTAL (Civilian & Scout Reporting Hub) */}
          {effectiveTab === 'reporter' && reporterProfile && (
            <div className="rn-subview-container">
              <ReporterPortal
                currentUser={reporterProfile}
                needs={needs}
                activeSubTab={reporterSubTab}
                onSubTabChange={setReporterSubTab}
                onSubmitNewReport={handleAddReport}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onSwitchToLanding={() => setActiveTab('landing')}
                onSwitchRole={handleSwitchRole}
                onOpenAuthModal={() => handleOpenAuth('signin')}
              />
            </div>
          )}
        </div>
      </main>

      {/* Auth & Role Selection Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onReportWithoutSignin={() => setIsReportModalOpen(true)}
        initialMode={authModalMode}
        initialRole={authInitialRole}
        stats={stats}
      />

      {/* Global Community Report Modal */}
      <ReportNeedModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleAddReport}
      />

      {/* Subtle sync indicator */}
      {isSyncing && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1500, fontSize: 12, opacity: 0.7 }}>
          Syncing…
        </div>
      )}
    </div>
  );
}
