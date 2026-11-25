import React, { useState, useEffect } from 'react';
import { 
  NeedReport, 
  Volunteer, 
  ActivityEvent 
} from '../types';
import { LiveMap } from './LiveMap';
import { 
  Radio, 
  Search, 
  Filter, 
  Layers, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Send, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  KeyRound,
  FileText,
  Star, 
  Crosshair, 
  Activity, 
  ChevronRight,
  TrendingUp,
  Flame,
  PlusCircle,
  Bell,
  Compass,
  BarChart3,
  Truck,
  Anchor,
  BatteryCharging,
  Wifi,
  PhoneCall,
  Check,
  Download,
  RefreshCw,
  Zap,
  Navigation,
  Terminal,
  Cpu,
  RotateCcw,
  Settings,
  Sliders,
  X,
  Info,
  Plus,
  Minus,
  Building
} from 'lucide-react';
import { INITIAL_ACTIVITY_LOG } from '../services/mockData';
import { ApiDashboardStats } from '../services/api';

interface CoordinatorDashboardProps {
  needs: NeedReport[];
  volunteers: Volunteer[];
  /** Live counters from /api/dashboard/stats. */
  stats?: ApiDashboardStats | null;
  onDispatchVolunteer: (needId: string, volunteerId: string) => void;
  onToggleVolunteerAvailability?: (volunteerId: string, available: boolean) => void;
  onOpenReportModal: () => void;
  onSwitchToLanding: () => void;
  onSwitchRole?: (role: 'coordinator' | 'volunteer' | 'reporter') => void;
  onOpenAuthModal?: () => void;
  activeSubTab?: 'operations' | 'incidents' | 'volunteers' | 'inventory' | 'geospatial' | 'analytics';
  onSubTabChange?: (tab: 'operations' | 'incidents' | 'volunteers' | 'inventory' | 'geospatial' | 'analytics') => void;
}

export interface DeployedAllocation {
  id: string;
  target: string;
  targetType: 'incident' | 'unit' | 'camp';
  quantity: number;
  deployedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  total: number;
  deployed: number;
  depot: string;
  status: 'OPERATIONAL' | 'HIGH DEMAND' | 'REPLENISHING';
  iconType: 'boat' | 'drone' | 'medical' | 'water' | 'mesh' | 'shelter' | 'vehicle' | 'power';
  unitLabel: string;
  deployments: DeployedAllocation[];
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-01',
    name: 'Inflatable Swiftwater Rescue Boats',
    category: 'Marine Evacuation',
    total: 6,
    deployed: 4,
    depot: 'Sector 4 Marine Staging Depot',
    status: 'HIGH DEMAND',
    iconType: 'boat',
    unitLabel: 'Boats',
    deployments: [
      { id: 'DEP-101', target: 'Incident #CR-401 (Riverside Flood Zone)', targetType: 'incident', quantity: 2, deployedAt: '25m ago' },
      { id: 'DEP-102', target: 'Sector 4 Marine Rescue Squad Alpha', targetType: 'unit', quantity: 2, deployedAt: '1h ago' }
    ]
  },
  {
    id: 'INV-02',
    name: 'Thermal Recon Surveillance Drones',
    category: 'Airborne Reconnaissance',
    total: 12,
    deployed: 8,
    depot: 'Squadron B Depot, Hillcrest',
    status: 'OPERATIONAL',
    iconType: 'drone',
    unitLabel: 'Drones',
    deployments: [
      { id: 'DEP-201', target: 'Incident #CR-404 (Highway 12 Mudslide)', targetType: 'incident', quantity: 4, deployedAt: '40m ago' },
      { id: 'DEP-202', target: 'Drone Recon Lead Vikram Malhotra', targetType: 'unit', quantity: 4, deployedAt: '2h ago' }
    ]
  },
  {
    id: 'INV-03',
    name: 'Level 4 Advanced Trauma Medical Kits',
    category: 'Emergency Medical',
    total: 85,
    deployed: 63,
    depot: 'Sector 4 Medical Stockpile',
    status: 'OPERATIONAL',
    iconType: 'medical',
    unitLabel: 'Medical Kits',
    deployments: [
      { id: 'DEP-301', target: 'Incident #CR-402 (Senior Care Center)', targetType: 'incident', quantity: 35, deployedAt: '50m ago' },
      { id: 'DEP-302', target: 'Field Hospital Camp Alpha Triage', targetType: 'camp', quantity: 28, deployedAt: '3h ago' }
    ]
  },
  {
    id: 'INV-04',
    name: 'High-Output Water Filtration Units',
    category: 'Civilian Sanitation',
    total: 15,
    deployed: 12,
    depot: 'North Basin Supply Compound',
    status: 'OPERATIONAL',
    iconType: 'water',
    unitLabel: 'Filtration Units',
    deployments: [
      { id: 'DEP-401', target: 'East Valley Community Shelter', targetType: 'camp', quantity: 7, deployedAt: '1h 15m ago' },
      { id: 'DEP-402', target: 'Sector 4 Evacuation Hub', targetType: 'camp', quantity: 5, deployedAt: '4h ago' }
    ]
  },
  {
    id: 'INV-05',
    name: 'Mobile Starlink Ground Mesh Terminals',
    category: 'Comms Infrastructure',
    total: 8,
    deployed: 8,
    depot: 'District Telecom Cell',
    status: 'HIGH DEMAND',
    iconType: 'mesh',
    unitLabel: 'Mesh Terminals',
    deployments: [
      { id: 'DEP-501', target: 'Incident Command Post Sector 4', targetType: 'camp', quantity: 3, deployedAt: '2h ago' },
      { id: 'DEP-502', target: 'Riverside Emergency Dispatch Post', targetType: 'camp', quantity: 3, deployedAt: '3h ago' },
      { id: 'DEP-503', target: 'Mobile Medical Van #02', targetType: 'unit', quantity: 2, deployedAt: '5h ago' }
    ]
  },
  {
    id: 'INV-06',
    name: 'Rapid Deploy Weather Shelters (10-Pax)',
    category: 'Evacuation Relief',
    total: 24,
    deployed: 18,
    depot: 'Central Evacuation Warehouse',
    status: 'HIGH DEMAND',
    iconType: 'shelter',
    unitLabel: 'Shelters',
    deployments: [
      { id: 'DEP-601', target: 'Sector 4 Relief Camp North', targetType: 'camp', quantity: 12, deployedAt: '1h ago' },
      { id: 'DEP-602', target: 'Riverbank Staging Ground', targetType: 'camp', quantity: 6, deployedAt: '2h 30m ago' }
    ]
  },
  {
    id: 'INV-07',
    name: 'High-Clearance 4x4 Evac Vehicles',
    category: 'All-Terrain Transport',
    total: 10,
    deployed: 7,
    depot: 'Transport Motor Pool 2',
    status: 'OPERATIONAL',
    iconType: 'vehicle',
    unitLabel: 'Vehicles',
    deployments: [
      { id: 'DEP-701', target: 'Incident #CR-404 Mudslide Extraction', targetType: 'incident', quantity: 4, deployedAt: '45m ago' },
      { id: 'DEP-702', target: 'S&R Evacuation Transport Team', targetType: 'unit', quantity: 3, deployedAt: '3h ago' }
    ]
  },
  {
    id: 'INV-08',
    name: 'Portable Generator & Solar Battery Banks',
    category: 'Emergency Power Grid',
    total: 30,
    deployed: 22,
    depot: 'Energy Depot East Valley',
    status: 'OPERATIONAL',
    iconType: 'power',
    unitLabel: 'Generators',
    deployments: [
      { id: 'DEP-801', target: 'Field Hospital Intensive Care Tent', targetType: 'camp', quantity: 14, deployedAt: '2h ago' },
      { id: 'DEP-802', target: 'Starlink Ground Station Alpha', targetType: 'camp', quantity: 8, deployedAt: '4h ago' }
    ]
  }
];

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  needs,
  volunteers,
  stats,
  onDispatchVolunteer,
  onToggleVolunteerAvailability,
  onOpenReportModal,
  onSwitchToLanding,
  onSwitchRole,
  onOpenAuthModal,
  activeSubTab,
  onSubTabChange
}) => {
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(needs[0]?.id || '');
  const [internalSidebarTab, setInternalSidebarTab] = useState<'operations' | 'incidents' | 'volunteers' | 'inventory' | 'geospatial' | 'analytics'>('operations');
  const sidebarActiveTab = activeSubTab || internalSidebarTab;
  const setSidebarActiveTab = (tab: 'operations' | 'incidents' | 'volunteers' | 'inventory' | 'geospatial' | 'analytics') => {
    setInternalSidebarTab(tab);
    onSubTabChange?.(tab);
  };
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>(INITIAL_ACTIVITY_LOG);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mission Workspace & Connecting Flowchart State
  const [missionMode, setMissionMode] = useState<'pipeline' | 'map' | 'personnel'>('pipeline');
  const [dispatchingNeedId, setDispatchingNeedId] = useState<string | null>(null);
  // Coordinator's explicit responder choice per need; empty means "use the recommendation".
  const [responderChoice, setResponderChoice] = useState<Record<string, string>>({});
  const [radarFilterLayer, setRadarFilterLayer] = useState<'all' | 'critical' | 'responders'>('all');
  
  const [digitalClock, setDigitalClock] = useState(() => {
    const now = new Date();
    return `${now.toLocaleTimeString('en-US', { hour12: false })} UTC`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDigitalClock(`${now.toLocaleTimeString('en-US', { hour12: false })} UTC`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Always reset scroll to top when changing subview
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [sidebarActiveTab]);

  // Connected Flowchart Pipeline Stages: real need status decides the column,
  // an explicit advance (before the coordinator saves it) overrides it.
  const [pipelineStages, setPipelineStages] = useState<Record<string, 'intake' | 'triage' | 'deployed' | 'resolved'>>({});

  const stageOf = (need: NeedReport): 'intake' | 'triage' | 'deployed' | 'resolved' => {
    const override = pipelineStages[need.id];
    if (override) return override;
    if (need.status === 'RESOLVED') return 'resolved';
    if (need.status === 'ASSIGNED' || need.status === 'IN_PROGRESS') return 'deployed';
    return need.priorityScore >= 60 ? 'triage' : 'intake';
  };

  const advancePipelineStage = (needId: string) => {
    const need = needs.find(n => n.id === needId);
    setPipelineStages(prev => {
      const current = prev[needId] ?? (need ? stageOf(need) : 'intake');
      const next = current === 'intake' ? 'triage' : current === 'triage' ? 'deployed' : 'resolved';
      showToast(`Incident #${needId} advanced to ${next.toUpperCase()} stage`);
      return { ...prev, [needId]: next };
    });
  };

  // Simulated Live Tactical Radio Comms Feed
  const [radioLogs] = useState<{ id: string; time: string; callsign: string; text: string; channel: string }[]>([
    { id: 'RL-1', time: '23:32:04', callsign: 'RESCUE-ARJUN', text: 'On-scene Sector 4. Water level rising +1.2m, deploying boat.', channel: 'CH-4' },
    { id: 'RL-2', time: '23:33:41', callsign: 'DRONE-VIKRAM', text: 'Thermal sweep confirmed 3 adults on rooftop grid.', channel: 'CH-8' },
    { id: 'RL-3', time: '23:34:15', callsign: 'MED-SUNITA', text: 'Trauma triage kit prepped at Sector 4 field tent.', channel: 'CH-2' },
    { id: 'RL-4', time: '23:35:50', callsign: 'HQ-COORDINATOR', text: 'Telemetry verified. Starlink link active.', channel: 'CH-1' }
  ]);

  // Roster is the real backend list — no invented responders.
  const volunteerRoster = volunteers;

  const [volunteerSkillFilter, setVolunteerSkillFilter] = useState<'ALL' | 'PARAMEDIC' | 'RESCUE' | 'DRONE' | 'DRIVER'>('ALL');
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [selectedSector, setSelectedSector] = useState<string>('Sector 04');

  // Resource Deployment & Capacity Management State
  const [deployModalItem, setDeployModalItem] = useState<InventoryItem | null>(null);
  const [deployTargetPlace, setDeployTargetPlace] = useState<string>('');
  const [deployQty, setDeployQty] = useState<number>(1);
  const [deployNotes, setDeployNotes] = useState<string>('Urgent Emergency Dispatch');

  const [adjustCapacityItem, setAdjustCapacityItem] = useState<InventoryItem | null>(null);
  const [newMaxCapacityVal, setNewMaxCapacityVal] = useState<number>(10);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const selectedNeed = needs.find(n => n.id === selectedIncidentId) || needs[0];

  // KPI cards read the backend counters, so the dashboard and the landing page
  // can never disagree about totals.
  const totalIncidents = stats?.totalNeeds ?? needs.length;
  const inProgressCount = stats?.assignedNeeds ?? 0;
  const criticalCount = stats?.criticalNeeds ?? needs.filter(n => n.urgency === 'CRITICAL' && n.status !== 'RESOLVED').length;
  const deployedVolunteers = volunteers.filter(v => v.status === 'DEPLOYED').length;
  const availableVolunteers = stats?.availableVolunteers ?? volunteers.filter(v => v.status === 'AVAILABLE').length;
  const resolvedRate = totalIncidents > 0
    ? `${Math.round(((stats?.resolvedNeeds ?? 0) / totalIncidents) * 100)}%`
    : '0%';
  const highIncidents = stats?.highNeeds ?? needs.filter(n => n.urgency === 'HIGH').length;
  const moderateIncidents = needs.filter(n => n.urgency === 'MEDIUM' || n.urgency === 'LOW').length;
  const resolvedIncidents = stats?.resolvedNeeds ?? needs.filter(n => n.status === 'RESOLVED').length;

  // Filter incidents
  const filteredNeeds = needs.filter(n => {
    if (urgencyFilter === 'CRITICAL' && n.urgency !== 'CRITICAL') return false;
    if (urgencyFilter === 'HIGH' && n.urgency !== 'HIGH') return false;
    if (urgencyFilter === 'MEDIUM' && n.urgency !== 'MEDIUM' && n.urgency !== 'LOW') return false;
    if (urgencyFilter === 'RESOLVED' && n.status !== 'RESOLVED') return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        n.id.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter volunteers for roster
  const filteredVolunteers = volunteerRoster.filter(v => {
    if (volunteerSkillFilter === 'PARAMEDIC' && !v.skills.some(s => s.toLowerCase().includes('first aid') || s.toLowerCase().includes('trauma') || s.toLowerCase().includes('triage'))) return false;
    if (volunteerSkillFilter === 'RESCUE' && !v.skills.some(s => s.toLowerCase().includes('rescue') || s.toLowerCase().includes('water') || s.toLowerCase().includes('boat'))) return false;
    if (volunteerSkillFilter === 'DRONE' && !v.skills.some(s => s.toLowerCase().includes('drone') || s.toLowerCase().includes('comms') || s.toLowerCase().includes('mapping'))) return false;
    if (volunteerSkillFilter === 'DRIVER' && !v.skills.some(s => s.toLowerCase().includes('driver') || s.toLowerCase().includes('logistics') || s.toLowerCase().includes('equipment'))) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.role.toLowerCase().includes(q) ||
        v.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Resolves which real volunteer a dispatch should send: the coordinator's pick,
  // then the recommendation, then any volunteer who is not already deployed.
  const chosenResponderId = (need: NeedReport): string => {
    // A dispatched need must keep showing the responder it actually went to —
    // that volunteer is now "On mission", so the recommendation would otherwise
    // fall through to the next available person and misreport the assignment.
    if (need.assignedVolunteerId) return need.assignedVolunteerId;
    const explicit = responderChoice[need.id];
    if (explicit && volunteers.some(v => v.id === explicit)) return explicit;
    const recommendedId = need.recommendedVolunteer?.id;
    if (recommendedId && volunteers.some(v => v.id === recommendedId)) return recommendedId;
    return (volunteers.find(v => v.status !== 'DEPLOYED') ?? volunteers[0])?.id ?? '';
  };

  const handleDispatch = (needId: string, volunteerId: string) => {
    onDispatchVolunteer(needId, volunteerId);
    
    const vol = volunteerRoster.find(v => v.id === volunteerId);
    const newLog: ActivityEvent = {
      id: `ACT-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: `Dispatched ${vol?.name || 'Volunteer Unit'} to Incident #${needId}`,
      type: 'dispatch',
      sector: 'Sector 4'
    };
    setActivityLog(prev => [newLog, ...prev]);

    showToast(`Dispatched ${vol?.name || 'Unit'} to Incident #${needId}`);
  };

  const handleToggleVolunteerDuty = (volId: string) => {
    const volunteer = volunteers.find(v => v.id === volId);
    const makeAvailable = volunteer?.status !== 'AVAILABLE';
    onToggleVolunteerAvailability?.(volId, makeAvailable);
    showToast(`${volunteer?.name || 'Volunteer'} marked ${makeAvailable ? 'AVAILABLE' : 'OFF DUTY'}`);
  };

  const handlePingRadio = (vol: Volunteer) => {
    showToast(`Radio check ping sent to ${vol.name} on Sector 4 Tactical Relay`);
  };

  // Open the Deploy to Location modal
  const handleOpenDeployModal = (item: InventoryItem) => {
    const available = item.total - item.deployed;
    if (available <= 0) {
      showToast(`All ${item.total} ${item.unitLabel} are currently deployed. Recall units or request a restock.`);
      return;
    }
    setDeployModalItem(item);
    const criticalNeed = needs.find(n => n.urgency === 'CRITICAL') || needs[0];
    setDeployTargetPlace(criticalNeed ? `Incident #${criticalNeed.id} (${criticalNeed.title})` : 'Camp Alpha - Riverside Field Base');
    setDeployQty(1);
    setDeployNotes('Urgent Emergency Dispatch');
  };

  // Confirm deployment to destination place/unit
  const handleConfirmDeploy = () => {
    if (!deployModalItem) return;
    const available = deployModalItem.total - deployModalItem.deployed;
    if (deployQty > available) {
      showToast(`Cannot deploy ${deployQty} units. Only ${available} available in depot.`);
      return;
    }
    if (!deployTargetPlace.trim()) {
      showToast('Please specify a destination incident or recipient responder unit.');
      return;
    }

    const newDep: DeployedAllocation = {
      id: `DEP-${Date.now()}`,
      target: deployTargetPlace.trim(),
      targetType: deployTargetPlace.toLowerCase().includes('incident') ? 'incident' : 'camp',
      quantity: deployQty,
      deployedAt: 'Just now'
    };

    setInventoryList(prev => prev.map(inv => {
      if (inv.id === deployModalItem.id) {
        const nextDeployed = inv.deployed + deployQty;
        const nextStatus = nextDeployed >= inv.total ? 'HIGH DEMAND' : inv.status;
        return {
          ...inv,
          deployed: nextDeployed,
          status: nextStatus,
          deployments: [newDep, ...inv.deployments]
        };
      }
      return inv;
    }));

    // Record in operational activity log
    const newLog: ActivityEvent = {
      id: `ACT-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: `Dispatched ${deployQty}x ${deployModalItem.unitLabel} (${deployModalItem.name}) to ${deployTargetPlace}`,
      type: 'dispatch',
      sector: 'Sector 4'
    };
    setActivityLog(prev => [newLog, ...prev]);

    showToast(`Dispatched ${deployQty} ${deployModalItem.unitLabel} to ${deployTargetPlace}`);
    setDeployModalItem(null);
  };

  // Recall a deployed unit from field back into base depot
  const handleRecallUnit = (itemId: string, depId: string) => {
    const item = inventoryList.find(i => i.id === itemId);
    if (!item) return;
    const dep = item.deployments.find(d => d.id === depId);
    if (!dep) return;

    setInventoryList(prev => prev.map(inv => {
      if (inv.id === itemId) {
        const nextDeployed = Math.max(0, inv.deployed - 1);
        const updatedDeployments = inv.deployments.map(d => {
          if (d.id === depId) {
            return { ...d, quantity: d.quantity - 1 };
          }
          return d;
        }).filter(d => d.quantity > 0);

        const nextStatus = (nextDeployed / inv.total) < 0.8 ? 'OPERATIONAL' : inv.status;
        return {
          ...inv,
          deployed: nextDeployed,
          status: nextStatus,
          deployments: updatedDeployments
        };
      }
      return inv;
    }));

    const newLog: ActivityEvent = {
      id: `ACT-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: `Recalled 1x ${item.unitLabel} from ${dep.target} back to ${item.depot}`,
      type: 'dispatch',
      sector: 'Sector 4'
    };
    setActivityLog(prev => [newLog, ...prev]);
    showToast(`Recalled 1 ${item.unitLabel} from ${dep.target} back to depot`);
  };

  // Open modal to adjust maximum fleet capacity
  const handleOpenAdjustCapacity = (item: InventoryItem) => {
    setAdjustCapacityItem(item);
    setNewMaxCapacityVal(item.total);
  };

  // Save new maximum fleet capacity
  const handleSaveAdjustCapacity = () => {
    if (!adjustCapacityItem) return;
    if (newMaxCapacityVal < adjustCapacityItem.deployed) {
      showToast(`Cannot set maximum fleet capacity below ${adjustCapacityItem.deployed} (units currently in active field deployment)`);
      return;
    }

    setInventoryList(prev => prev.map(inv => {
      if (inv.id === adjustCapacityItem.id) {
        const nextStatus = (inv.deployed / newMaxCapacityVal) >= 0.8 ? 'HIGH DEMAND' : 'OPERATIONAL';
        return {
          ...inv,
          total: newMaxCapacityVal,
          status: nextStatus
        };
      }
      return inv;
    }));

    const newLog: ActivityEvent = {
      id: `ACT-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: `Adjusted maximum fleet capacity for ${adjustCapacityItem.name} to ${newMaxCapacityVal} units`,
      type: 'alert',
      sector: 'Sector 4'
    };
    setActivityLog(prev => [newLog, ...prev]);
    showToast(`Max fleet capacity updated to ${newMaxCapacityVal} units`);
    setAdjustCapacityItem(null);
  };

  const handleRestockInventory = (item: InventoryItem) => {
    showToast(`Depot restock requisition order submitted for ${item.name} (+5 units requested)`);
  };

  // Helper for dynamic breadcrumbs & title
  const getBreadcrumb = () => {
    switch (sidebarActiveTab) {
      case 'incidents':
        return { section: 'Emergency Response', current: 'Priority Dispatch Queue' };
      case 'volunteers':
        return { section: 'Personnel Logistics', current: 'Certified Volunteer Roster' };
      case 'inventory':
        return { section: 'Asset Logistics', current: 'Critical Equipment & Supplies' };
      case 'geospatial':
        return { section: 'Tactical GIS', current: `${selectedSector} Live Telemetry Radar` };
      case 'analytics':
        return { section: 'Intelligence & Audit', current: 'Response Analytics & SLA' };
      case 'operations':
      default:
        return { section: 'District North', current: 'Real-time Dispatch' };
    }
  };

  const getTitle = () => {
    switch (sidebarActiveTab) {
      case 'incidents':
        return 'Incident Dispatch Console';
      case 'volunteers':
        return 'Volunteer Personnel Roster';
      case 'inventory':
        return 'Resource & Equipment Inventory';
      case 'geospatial':
        return 'Tactical Geospatial Grid';
      case 'analytics':
        return 'Operational Analytics & SLA';
      case 'operations':
      default:
        return 'Coordinator Dashboard';
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="rn-dash-layout">
      {/* MAIN DASHBOARD CONTENT AREA (Zero Redundant Left Sidebars) */}
      <main className="rn-dash-main">
        {/* 1. CLEAN TOP HEADER BAR WITH SEARCH & CONTROLS (NO DUPLICATE TABS) */}
        <div className="rn-clean-header">
          <div className="rn-ch-left">
            <div className="rn-ch-title-row">
              <h2 className="rn-ch-title">{getTitle()}</h2>
              <div className="rn-ch-live-pill">
                <span className="rn-ch-live-dot"></span>
                <span>OPS NOMINAL • {digitalClock}</span>
              </div>
            </div>
            <div className="rn-ch-subtitle">
              {breadcrumb.section} &gt; {breadcrumb.current} • Sector 04 East Valley
            </div>
          </div>

          <div className="rn-ch-center-search">
            <Search size={15} color="#059669" />
            <input 
              type="text" 
              placeholder="Search incidents, volunteers, resources..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rn-ch-right">
            <div className="rn-ch-tabs">
              <button 
                type="button" 
                className={`rn-ch-tab ${missionMode === 'pipeline' ? 'active' : ''}`}
                onClick={() => setMissionMode('pipeline')}
                title="Visual Connected Crisis Flowchart Pipeline"
              >
                <Zap size={14} />
                <span>Crisis Flowchart</span>
              </button>
              <button 
                type="button" 
                className={`rn-ch-tab ${missionMode === 'map' ? 'active' : ''}`}
                onClick={() => setMissionMode('map')}
                title="Interactive Map & Incident Queue"
              >
                <Compass size={14} />
                <span>Live Map &amp; Queue</span>
              </button>
              <button 
                type="button" 
                className={`rn-ch-tab ${missionMode === 'personnel' ? 'active' : ''}`}
                onClick={() => setMissionMode('personnel')}
                title="Field Responders & Fleet Matrix"
              >
                <Users size={14} />
                <span>Field Responders</span>
              </button>
            </div>

            <button 
              type="button" 
              className="rn-ch-report-btn"
              onClick={onOpenReportModal}
            >
              <PlusCircle size={15} />
              <span>Report Incident</span>
            </button>
          </div>
        </div>

        {/* SUBVIEW 1: OPERATIONS CENTER OVERVIEW */}
        {sidebarActiveTab === 'operations' && (
          <>
            {/* MODE 1: VISUAL CONNECTED CRISIS FLOWCHART PIPELINE (SPACIOUS & CLEAN) */}
            {missionMode === 'pipeline' && (
              <div className="rn-spacious-pipeline">
                <div className="rn-pipeline-summary-bar">
                  <div className="rn-ps-stats">
                    <div className="rn-ps-item">
                      <span>Active Incidents:</span>
                      <strong>{needs.length} Total</strong>
                    </div>
                    <div className="rn-ps-item">
                      <span>Pipeline Throughput:</span>
                      <strong style={{ color: '#34d399' }}>14.2 ops/hr</strong>
                    </div>
                    <div className="rn-ps-item">
                      <span>Average Transit SLA:</span>
                      <strong>11.4 min</strong>
                    </div>
                    <div className="rn-ps-item">
                      <span>System Readiness:</span>
                      <strong style={{ color: '#38bdf8' }}>99.8% Nominal</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Click &ldquo;Advance Stage ➔&rdquo; on any incident card to progress the workflow
                  </div>
                </div>

                <div className="rn-flowchart-grid">
                  {/* Flowchart connecting cables overlay */}
                  <svg className="rn-flowchart-cables" viewBox="0 0 1000 40" preserveAspectRatio="none">
                    <path className="rn-fc-wire" d="M 230 20 L 270 20" />
                    <circle className="rn-fc-particle" cx="250" cy="20" r="3.5" />
                    <path className="rn-fc-wire" d="M 480 20 L 520 20" />
                    <circle className="rn-fc-particle" cx="500" cy="20" r="3.5" />
                    <path className="rn-fc-wire" d="M 730 20 L 770 20" />
                    <circle className="rn-fc-particle" cx="750" cy="20" r="3.5" />
                  </svg>

                  {/* STAGE 1: SIGNAL INTAKE */}
                  <div className="rn-flow-col">
                    <div className="rn-fcol-header">
                      <div className="rn-fcol-title-group">
                        <span className="rn-fcol-step">STAGE 01</span>
                        <h4 className="rn-fcol-name">Signal Intake</h4>
                      </div>
                      <span className="rn-fcol-count">
                        {needs.filter(n => stageOf(n) === 'intake').length}
                      </span>
                    </div>

                    <div className="rn-fcol-cards">
                      {needs.filter(n => stageOf(n) === 'intake').slice(0, 5).map((need) => (
                        <div key={need.id} className="rn-flow-card">
                          <div className="rn-fc-top">
                            <span className="rn-fc-id">#{need.id}</span>
                            <span className={`rn-fc-urgency ${need.urgency === 'CRITICAL' ? 'crit' : need.urgency === 'HIGH' ? 'high' : 'med'}`}>
                              {need.urgency}
                            </span>
                          </div>
                          <div className="rn-fc-title">{need.title}</div>
                          <div className="rn-fc-desc">{need.description}</div>
                          <div className="rn-fc-location">
                            <MapPin size={12} />
                            <span>{need.location.address}</span>
                          </div>
                          <button 
                            type="button" 
                            className="rn-fc-action-btn"
                            onClick={() => advancePipelineStage(need.id)}
                          >
                            <span>Verify &amp; Triage</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      ))}
                      {needs.filter(n => stageOf(n) === 'intake').length === 0 && (
                        <div style={{ padding: '28px 12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          No incoming signals in queue
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STAGE 2: NEURAL TRIAGE */}
                  <div className="rn-flow-col">
                    <div className="rn-fcol-header">
                      <div className="rn-fcol-title-group">
                        <span className="rn-fcol-step">STAGE 02</span>
                        <h4 className="rn-fcol-name">Neural Triage</h4>
                      </div>
                      <span className="rn-fcol-count">
                        {needs.filter(n => stageOf(n) === 'triage').length}
                      </span>
                    </div>

                    <div className="rn-fcol-cards">
                      {needs.filter(n => stageOf(n) === 'triage').slice(0, 5).map((need) => (
                        <div key={need.id} className="rn-flow-card border-crit">
                          <div className="rn-fc-top">
                            <span className="rn-fc-id">#{need.id}</span>
                            <span className={`rn-fc-urgency ${need.urgency === 'CRITICAL' ? 'crit' : need.urgency === 'HIGH' ? 'high' : 'med'}`}>
                              {need.urgency}
                            </span>
                          </div>
                          <div className="rn-fc-title">{need.title}</div>
                          <div className="rn-fc-desc">
                            AI Match: <strong style={{ color: '#38bdf8' }}>{need.recommendedVolunteer?.name || 'Dr. Sunita Sen'}</strong> ({need.aiConfidence || 96}%)
                          </div>
                          <div className="rn-fc-location">
                            <MapPin size={12} />
                            <span>{need.location.address}</span>
                          </div>
                          <button 
                            type="button" 
                            className="rn-fc-action-btn"
                            style={{ background: 'rgba(56, 189, 248, 0.14)', borderColor: 'rgba(56, 189, 248, 0.32)', color: '#38bdf8' }}
                            onClick={() => advancePipelineStage(need.id)}
                          >
                            <span>Deploy Unit</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      ))}
                      {needs.filter(n => stageOf(n) === 'triage').length === 0 && (
                        <div style={{ padding: '28px 12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          All incidents triaged
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STAGE 3: FIELD DEPLOYED */}
                  <div className="rn-flow-col">
                    <div className="rn-fcol-header">
                      <div className="rn-fcol-title-group">
                        <span className="rn-fcol-step">STAGE 03</span>
                        <h4 className="rn-fcol-name">Field Deployed</h4>
                      </div>
                      <span className="rn-fcol-count">
                        {needs.filter(n => stageOf(n) === 'deployed').length}
                      </span>
                    </div>

                    <div className="rn-fcol-cards">
                      {needs.filter(n => stageOf(n) === 'deployed').slice(0, 5).map((need) => (
                        <div key={need.id} className="rn-flow-card border-high">
                          <div className="rn-fc-top">
                            <span className="rn-fc-id">#{need.id}</span>
                            <span className="rn-fc-urgency high">EN ROUTE</span>
                          </div>
                          <div className="rn-fc-title">{need.title}</div>
                          <div className="rn-fc-desc">
                            Unit: <strong style={{ color: '#fcd34d' }}>{need.recommendedVolunteer?.name || 'Rajesh Patel'}</strong> • ETA ~5m
                          </div>
                          <div className="rn-fc-location">
                            <MapPin size={12} />
                            <span>{need.location.address}</span>
                          </div>
                          <button 
                            type="button" 
                            className="rn-fc-action-btn"
                            style={{ background: 'rgba(245, 158, 11, 0.14)', borderColor: 'rgba(245, 158, 11, 0.32)', color: '#fcd34d' }}
                            onClick={() => advancePipelineStage(need.id)}
                          >
                            <span>Confirm Stabilized</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      ))}
                      {needs.filter(n => stageOf(n) === 'deployed').length === 0 && (
                        <div style={{ padding: '28px 12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          No active deployments in transit
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STAGE 4: STABILIZED */}
                  <div className="rn-flow-col">
                    <div className="rn-fcol-header">
                      <div className="rn-fcol-title-group">
                        <span className="rn-fcol-step">STAGE 04</span>
                        <h4 className="rn-fcol-name">Stabilized</h4>
                      </div>
                      <span className="rn-fcol-count">
                        {needs.filter(n => stageOf(n) === 'resolved').length}
                      </span>
                    </div>

                    <div className="rn-fcol-cards">
                      {needs.filter(n => stageOf(n) === 'resolved').slice(0, 5).map((need) => (
                        <div key={need.id} className="rn-flow-card" style={{ borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                          <div className="rn-fc-top">
                            <span className="rn-fc-id">#{need.id}</span>
                            <span className="rn-fc-urgency" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              STABILIZED
                            </span>
                          </div>
                          <div className="rn-fc-title">{need.title}</div>
                          <div className="rn-fc-desc" style={{ color: '#34d399' }}>
                            ✓ Golden Hour Handover Confirmed (SLA met)
                          </div>
                          <div className="rn-fc-location">
                            <MapPin size={12} />
                            <span>{need.location.address}</span>
                          </div>
                        </div>
                      ))}
                      {needs.filter(n => stageOf(n) === 'resolved').length === 0 && (
                        <div style={{ padding: '28px 12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          No stabilized incidents yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2: 2-COLUMN MAP & QUEUE WORKSPACE (SPACIOUS & UNOBSTRUCTED) */}
            {missionMode === 'map' && (
              <div className="rn-map-workspace">
                {/* Left Queue Column */}
                <div className="rn-mw-queue-col">
                  <div className="rn-mw-queue-header">
                    <div className="rn-mw-qh-top">
                      <span className="rn-mw-qh-title">Incident Queue ({filteredNeeds.length})</span>
                      <div className="rn-mw-pills">
                        <button 
                          type="button" 
                          className={`rn-mwp-btn ${urgencyFilter === 'ALL' ? 'active' : ''}`}
                          onClick={() => setUrgencyFilter('ALL')}
                        >
                          All
                        </button>
                        <button 
                          type="button" 
                          className={`rn-mwp-btn ${urgencyFilter === 'CRITICAL' ? 'active-crit' : ''}`}
                          onClick={() => setUrgencyFilter('CRITICAL')}
                        >
                          Critical ({criticalCount})
                        </button>
                        <button 
                          type="button" 
                          className={`rn-mwp-btn ${urgencyFilter === 'RESOLVED' ? 'active' : ''}`}
                          onClick={() => setUrgencyFilter('RESOLVED')}
                        >
                          Resolved
                        </button>
                      </div>
                    </div>

                    <div className="rn-mw-search">
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder="Filter incidents by title or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rn-mw-cards-list">
                    {filteredNeeds.map((need) => {
                      const isSelected = need.id === selectedIncidentId;
                      const isCrit = need.urgency === 'CRITICAL';
                      const isHigh = need.urgency === 'HIGH';

                      return (
                        <div 
                          key={need.id}
                          className={`rn-readable-card ${isSelected ? 'is-active' : ''}`}
                          onClick={() => setSelectedIncidentId(need.id)}
                        >
                          <div className="rn-rc-header">
                            <span className="rn-rc-id">#{need.id}</span>
                            <span className={`rn-fc-urgency ${isCrit ? 'crit' : isHigh ? 'high' : 'med'}`}>
                              {need.urgency}
                            </span>
                          </div>
                          <div className="rn-rc-title">{need.title}</div>
                          <div className="rn-rc-address">
                            <MapPin size={13} />
                            <span>{need.location.address}</span>
                          </div>
                          <div className="rn-rc-footer">
                            <div className="rn-rc-responder">
                              Recommended: <strong>{need.recommendedVolunteer?.name || 'Field Unit Alpha'}</strong>
                            </div>
                            {need.status === 'ASSIGNED' || need.status === 'RESOLVED' || dispatchingNeedId === need.id ? (
                              <span className="rn-rc-dispatched-tag">
                                <CheckCircle2 size={12} />
                                <span>En Route</span>
                              </span>
                            ) : (
                              <button 
                                type="button" 
                                className="rn-rc-dispatch-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const responderId = chosenResponderId(need);
                                  if (!responderId) {
                                    showToast('No volunteer available to dispatch');
                                    return;
                                  }
                                  setDispatchingNeedId(need.id);
                                  handleDispatch(need.id, responderId);
                                  setTimeout(() => setDispatchingNeedId(null), 1200);
                                }}
                              >
                                <Send size={12} />
                                <span>Dispatch</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Map Canvas (Spacious & Clean) */}
                <div className="rn-mw-map-col">
                  <div className="rn-mw-map-header">
                    <div className="rn-mw-mh-badge">
                      <span className="rn-ch-live-dot"></span>
                      <span>SECTOR 04 LIVE MAP • {filteredNeeds.length} INCIDENTS</span>
                    </div>
                  </div>
                  <LiveMap 
                    needs={filteredNeeds}
                    volunteers={volunteerRoster}
                    selectedNeed={selectedNeed}
                    onSelectNeed={(n) => setSelectedIncidentId(n.id)}
                  />
                </div>
              </div>
            )}

            {/* MODE 3: FIELD PERSONNEL & FLEET GRID */}
            {missionMode === 'personnel' && (
              <div className="rn-vol-grid">
                {volunteerRoster.map((vol) => (
                  <div key={vol.id} className="rn-vol-card">
                    <div>
                      <div className="rn-vc-top">
                        <div className="rn-vc-avatar">
                          {vol.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="rn-vc-info">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h4 className="rn-vc-name">{vol.name}</h4>
                            <span className={`rn-vc-status-pill status-${vol.status.toLowerCase()}`}>
                              {vol.status}
                            </span>
                          </div>
                          <div className="rn-vc-role">{vol.role}</div>
                          <div className="rn-vc-subline">
                            <span>{vol.completedMissions} Missions</span>
                            <span>•</span>
                            <span>📍 {vol.location.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rn-vc-skills" style={{ marginTop: '14px' }}>
                        {vol.skills.map(s => (
                          <span key={s} className="rn-vc-skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="rn-vc-radio-bar" style={{ marginBottom: '12px' }}>
                        <span>📻 Callsign: RESCUE-{vol.name.split(' ')[0].toUpperCase()}</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>142.8 MHz</span>
                      </div>

                      <div className="rn-vc-actions">
                        <button 
                          type="button" 
                          className="rn-vc-btn-radio"
                          onClick={() => handlePingRadio(vol)}
                        >
                          <PhoneCall size={14} />
                          <span>Radio Ping</span>
                        </button>

                        <button 
                          type="button" 
                          className="rn-vc-btn-duty"
                          onClick={() => handleToggleVolunteerDuty(vol.id)}
                        >
                          <span>Toggle Status</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* SUBVIEW 2: INCIDENT DISPATCH CONSOLE */}
        {sidebarActiveTab === 'incidents' && (
          <div className="rn-subview-wrapper">
            <div className="rn-subview-kpi-row">
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Immediate Triage</div>
                <div className="rn-skpi-value" style={{ color: '#ef4444' }}>{criticalCount}</div>
                <div className="rn-skpi-hint">Requires volunteer response &lt; 15m</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Active Field Dispatches</div>
                <div className="rn-skpi-value">{inProgressCount}</div>
                <div className="rn-skpi-hint">Volunteers currently on-scene</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Responders Available</div>
                <div className="rn-skpi-value">{availableVolunteers}</div>
                <div className="rn-skpi-hint">Off duty toggle set to available</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Incident Resolution Rate</div>
                <div className="rn-skpi-value">{resolvedRate}</div>
                <div className="rn-skpi-hint">Resolved share of all reported needs</div>
              </div>
            </div>

            <div className="rn-filter-bar">
              <div className="rn-filter-pills">
                <button 
                  type="button" 
                  className={`rn-fpill ${urgencyFilter === 'ALL' ? 'active-dark' : ''}`}
                  onClick={() => setUrgencyFilter('ALL')}
                >
                  All ({totalIncidents})
                </button>
                <button 
                  type="button" 
                  className={`rn-fpill fpill-critical ${urgencyFilter === 'CRITICAL' ? 'active-critical' : ''}`}
                  onClick={() => setUrgencyFilter('CRITICAL')}
                >
                  Critical ({criticalCount})
                </button>
                <button 
                  type="button" 
                  className={`rn-fpill ${urgencyFilter === 'HIGH' ? 'active-high' : ''}`}
                  onClick={() => setUrgencyFilter('HIGH')}
                >
                  High ({highIncidents})
                </button>
                <button 
                  type="button" 
                  className={`rn-fpill ${urgencyFilter === 'MEDIUM' ? 'active-medium' : ''}`}
                  onClick={() => setUrgencyFilter('MEDIUM')}
                >
                  Moderate ({moderateIncidents})
                </button>
                <button 
                  type="button" 
                  className={`rn-fpill ${urgencyFilter === 'RESOLVED' ? 'active-resolved' : ''}`}
                  onClick={() => setUrgencyFilter('RESOLVED')}
                >
                  Resolved ({resolvedIncidents})
                </button>
              </div>

              <div className="rn-filter-search">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Filter incident queue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="rn-incident-cards-list">
              {filteredNeeds.map((need) => {
                const responderId = chosenResponderId(need);
                const responder = volunteers.find(v => v.id === responderId);

                return (
                <div key={need.id} className="rn-dash-incident-card">
                  <div className="rn-dic-header">
                    <div className="rn-dic-meta-left">
                      <span className="rn-dic-id">#{need.id}</span>
                      <span className={`rn-dic-urgency-pill urgency-${need.urgency.toLowerCase()}`}>
                        {need.urgency} PRIORITY
                      </span>
                      <span className="rn-dic-time">Reported {need.reportedAt}</span>
                    </div>
                    <div className="rn-dic-score-badge">
                      <span>Severity {need.priorityScore}/100</span>
                    </div>
                  </div>

                  <h3 className="rn-dic-title">{need.title}</h3>
                  <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '12px' }}>
                    {need.description}
                  </p>

                  <div className="rn-dic-metrics-tags">
                    <span className="rn-dtag"><strong>Affects:</strong> {need.peopleCount || '8-12 people'}</span>
                    <span className="rn-dtag"><strong>Risk:</strong> {need.riskLevel || 'Severe hazard'}</span>
                    <span className="rn-dtag"><strong>Location:</strong> {need.location.address}</span>
                    <span className="rn-dtag"><strong>Skills Needed:</strong> {need.requiredSkills?.join(', ')}</span>
                  </div>

                  {need.aiClassificationNotes && (
                    <div className="rn-dic-ai-box">
                      <div className="rn-dic-ai-title">
                        <Sparkles size={13} />
                        <span>AI Triage Rationale (Confidence {need.aiConfidence || 95}%)</span>
                      </div>
                      <p className="rn-dic-ai-text">{need.aiClassificationNotes}</p>
                    </div>
                  )}

                  <div className="rn-dic-actions-row">
                    <div className="rn-dic-responder">
                      <div className="rn-dic-resp-avatar">
                        {responder ? responder.name.split(' ').map(n => n[0]).join('') : '—'}
                      </div>
                      <div className="rn-dic-responder-pick">
                        <label className="rn-dic-resp-label" htmlFor={`responder-${need.id}`}>
                          DISPATCH TO
                        </label>
                        <select
                          id={`responder-${need.id}`}
                          className="rn-dic-resp-select"
                          value={responderId}
                          onChange={(e) => setResponderChoice(prev => ({ ...prev, [need.id]: e.target.value }))}
                          disabled={need.status === 'ASSIGNED' || need.status === 'RESOLVED'}
                        >
                          {volunteers.length === 0 && <option value="">No volunteers on the roster</option>}
                          {volunteers.map(v => (
                            <option key={v.id} value={v.id} disabled={v.status === 'DEPLOYED'}>
                              {v.name} · {v.status === 'DEPLOYED' ? 'On mission' : v.status === 'AVAILABLE' ? 'Available' : v.status}
                            </option>
                          ))}
                        </select>
                        <div className="rn-dic-resp-dist">
                          {responder
                            ? `${responder.location.address || 'Location not set'}${responder.skills.length ? ' • ' + responder.skills.slice(0, 3).join(', ') : ''}`
                            : 'No volunteer selected'}
                        </div>
                      </div>
                    </div>

                    <div className="rn-dic-buttons">
                      {need.status !== 'RESOLVED' && need.status !== 'ASSIGNED' ? (
                        <button 
                          type="button" 
                          className="rn-dic-btn-dispatch"
                          onClick={() => {
                            if (!responderId) {
                              showToast('No volunteer available to dispatch');
                              return;
                            }
                            handleDispatch(need.id, responderId);
                          }}
                        >
                          <Send size={13} />
                          <span>Dispatch Responder</span>
                        </button>
                      ) : (
                        <span className="rn-dic-assigned-badge">
                          <CheckCircle2 size={13} />
                          <span>{need.status === 'RESOLVED' ? 'Incident Resolved' : 'Unit En Route'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBVIEW 3: VOLUNTEER PERSONNEL ROSTER */}
        {sidebarActiveTab === 'volunteers' && (
          <div className="rn-subview-wrapper">
            <div className="rn-subview-kpi-row">
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Registered Responders</div>
                <div className="rn-skpi-value">{volunteerRoster.length + 98}</div>
                <div className="rn-skpi-hint">100% background certified</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Ready on Standby</div>
                <div className="rn-skpi-value" style={{ color: '#059669' }}>
                  {volunteerRoster.filter(v => v.status === 'AVAILABLE').length + 68}
                </div>
                <div className="rn-skpi-hint">Avg arrival &lt; 9.2m</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Active on Mission</div>
                <div className="rn-skpi-value" style={{ color: '#2563eb' }}>
                  {volunteerRoster.filter(v => v.status === 'DEPLOYED').length + 32}
                </div>
                <div className="rn-skpi-hint">Operating in Sectors 2, 4, 14</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Mission Success Rate</div>
                <div className="rn-skpi-value">98.4%</div>
                <div className="rn-skpi-hint">1,420 citizens rescued</div>
              </div>
            </div>

            <div className="rn-vol-filters-row">
              <div className="rn-vol-filter-pills">
                <button 
                  type="button" 
                  className={`rn-vfp-btn ${volunteerSkillFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setVolunteerSkillFilter('ALL')}
                >
                  All Personnel ({volunteerRoster.length})
                </button>
                <button 
                  type="button" 
                  className={`rn-vfp-btn ${volunteerSkillFilter === 'PARAMEDIC' ? 'active' : ''}`}
                  onClick={() => setVolunteerSkillFilter('PARAMEDIC')}
                >
                  Paramedics &amp; Trauma
                </button>
                <button 
                  type="button" 
                  className={`rn-vfp-btn ${volunteerSkillFilter === 'RESCUE' ? 'active' : ''}`}
                  onClick={() => setVolunteerSkillFilter('RESCUE')}
                >
                  Swiftwater Rescue
                </button>
                <button 
                  type="button" 
                  className={`rn-vfp-btn ${volunteerSkillFilter === 'DRONE' ? 'active' : ''}`}
                  onClick={() => setVolunteerSkillFilter('DRONE')}
                >
                  Drone Pilots &amp; Comms
                </button>
                <button 
                  type="button" 
                  className={`rn-vfp-btn ${volunteerSkillFilter === 'DRIVER' ? 'active' : ''}`}
                  onClick={() => setVolunteerSkillFilter('DRIVER')}
                >
                  Heavy Logistics
                </button>
              </div>

              <div className="rn-filter-search" style={{ minWidth: '280px' }}>
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Search responder by name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="rn-vol-grid">
              {filteredVolunteers.map((vol) => (
                <div key={vol.id} className="rn-vol-card">
                  <div>
                    <div className="rn-vc-top">
                      <div className="rn-vc-avatar">
                        {vol.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="rn-vc-info">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 className="rn-vc-name">{vol.name}</h4>
                          <span className={`rn-vc-status-pill status-${vol.status.toLowerCase()}`}>
                            {vol.status}
                          </span>
                        </div>
                        <div className="rn-vc-role">{vol.role}</div>
                        <div className="rn-vc-subline">
                          <span>{vol.completedMissions} Missions</span>
                          <span>•</span>
                          <span>📍 {vol.location.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rn-vc-skills" style={{ marginTop: '14px' }}>
                      {vol.skills.map(s => (
                        <span key={s} className="rn-vc-skill-tag">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="rn-vc-radio-bar" style={{ marginBottom: '12px' }}>
                      <span>📻 Callsign: RESCUE-{vol.name.split(' ')[0].toUpperCase()}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>142.8 MHz</span>
                    </div>

                    <div className="rn-vc-actions">
                      <button 
                        type="button" 
                        className="rn-vc-btn-radio"
                        onClick={() => handlePingRadio(vol)}
                      >
                        <PhoneCall size={14} />
                        <span>Radio Ping</span>
                      </button>

                      <button 
                        type="button" 
                        className="rn-vc-btn-duty"
                        onClick={() => handleToggleVolunteerDuty(vol.id)}
                      >
                        <span>Toggle Status</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 4: RESOURCE & EQUIPMENT INVENTORY (REDESIGNED FOR ABSOLUTE CLARITY) */}
        {sidebarActiveTab === 'inventory' && (
          <div className="rn-subview-wrapper">
            {/* Dynamic Fleet Capacity & Allocation KPI Overview */}
            {(() => {
              const totalFleetCap = inventoryList.reduce((acc, it) => acc + it.total, 0);
              const totalActiveDeployed = inventoryList.reduce((acc, it) => acc + it.deployed, 0);
              const totalDepotAvailable = totalFleetCap - totalActiveDeployed;
              const highDemandCount = inventoryList.filter(it => it.status === 'HIGH DEMAND' || (it.deployed / it.total) >= 0.8).length;

              return (
                <div className="rn-subview-kpi-row">
                  <div className="rn-subview-kpi-card">
                    <div className="rn-skpi-label">Total Fleet Capacity</div>
                    <div className="rn-skpi-value">{totalFleetCap} Units</div>
                    <div className="rn-skpi-hint">Max authorized across 8 depots</div>
                  </div>
                  <div className="rn-subview-kpi-card">
                    <div className="rn-skpi-label">Active in Field</div>
                    <div className="rn-skpi-value" style={{ color: '#d97706' }}>{totalActiveDeployed} Units</div>
                    <div className="rn-skpi-hint">{Math.round((totalActiveDeployed / totalFleetCap) * 100)}% of total fleet deployed</div>
                  </div>
                  <div className="rn-subview-kpi-card">
                    <div className="rn-skpi-label">Available in Depots</div>
                    <div className="rn-skpi-value" style={{ color: '#059669' }}>{totalDepotAvailable} Units</div>
                    <div className="rn-skpi-hint">Ready for immediate dispatch</div>
                  </div>
                  <div className="rn-subview-kpi-card">
                    <div className="rn-skpi-label">High Demand Classes</div>
                    <div className="rn-skpi-value" style={{ color: highDemandCount > 0 ? '#b45309' : '#059669' }}>
                      {highDemandCount} Depots
                    </div>
                    <div className="rn-skpi-hint">Near max deployment (≥80%)</div>
                  </div>
                </div>
              );
            })()}

            {/* Inventory Cards Grid */}
            <div className="rn-inv-grid">
              {inventoryList.map((item) => {
                const available = item.total - item.deployed;
                const percent = Math.round((item.deployed / item.total) * 100);
                const isWarn = percent >= 80;

                return (
                  <div key={item.id} className="rn-inv-card">
                    <div>
                      {/* Card Header */}
                      <div className="rn-inv-top">
                        <div className="rn-inv-icon-box">
                          {item.iconType === 'boat' && <Anchor size={20} />}
                          {item.iconType === 'drone' && <Crosshair size={20} />}
                          {item.iconType === 'medical' && <PlusCircle size={20} />}
                          {item.iconType === 'water' && <Flame size={20} />}
                          {item.iconType === 'mesh' && <Wifi size={20} />}
                          {item.iconType === 'shelter' && <Layers size={20} />}
                          {item.iconType === 'vehicle' && <Truck size={20} />}
                          {item.iconType === 'power' && <BatteryCharging size={20} />}
                        </div>
                        <div className="rn-inv-badge-group">
                          <span className="rn-inv-category-tag">{item.category}</span>
                          <span className={`rn-inv-status ${item.status === 'HIGH DEMAND' ? 'high-demand' : 'operational'}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <h4 className="rn-inv-title">{item.name}</h4>
                      <div className="rn-inv-depot">
                        <MapPin size={13} style={{ color: '#059669', flexShrink: 0 }} />
                        <span>Base Depot: <strong>{item.depot}</strong></span>
                      </div>

                      {/* 3-Tile Capacity Breakdown */}
                      <div className="rn-inv-capacity-strip">
                        <div className="rn-inv-cap-tile available">
                          <span className="rn-cap-label">Available</span>
                          <span className="rn-cap-val">{available}</span>
                          <span className="rn-cap-sub">{item.unitLabel} Ready</span>
                        </div>
                        <div className="rn-inv-cap-tile deployed">
                          <span className="rn-cap-label">In Field</span>
                          <span className="rn-cap-val">{item.deployed}</span>
                          <span className="rn-cap-sub">{item.unitLabel} Active</span>
                        </div>
                        <div className="rn-inv-cap-tile max-cap">
                          <span className="rn-cap-label">Max Fleet</span>
                          <span className="rn-cap-val">{item.total}</span>
                          <span className="rn-cap-sub">Capacity Limit</span>
                        </div>
                      </div>

                      {/* Progress Meter with Human-Friendly Text */}
                      <div className="rn-inv-meter-box">
                        <div className="rn-inv-meter-labels">
                          <span>Fleet Deployment</span>
                          <span>{percent}% ({item.deployed} of {item.total} {item.unitLabel})</span>
                        </div>
                        <div className="rn-inv-meter-bar">
                          <div 
                            className={`rn-inv-meter-fill ${isWarn ? 'warn' : ''}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Active Field Deployments List */}
                      <div className="rn-inv-deployments-box">
                        <div className="rn-inv-dep-header">
                          <span className="rn-inv-dep-title">
                            <Navigation size={13} style={{ color: '#059669' }} />
                            Active Locations ({item.deployments.length})
                          </span>
                          {item.deployments.length > 0 && (
                            <span className="rn-inv-dep-count">{item.deployed} {item.unitLabel} deployed</span>
                          )}
                        </div>

                        {item.deployments.length === 0 ? (
                          <div className="rn-inv-empty-deploy">
                            <span>✓ All {item.total} units are staged at depot, ready for dispatch.</span>
                          </div>
                        ) : (
                          <div className="rn-inv-dep-list">
                            {item.deployments.map(dep => (
                              <div key={dep.id} className="rn-inv-dep-item">
                                <div className="rn-inv-dep-info">
                                  <span className="rn-inv-dep-target">{dep.target}</span>
                                  <span className="rn-inv-dep-meta">{dep.quantity} {item.unitLabel} • Dispatched {dep.deployedAt}</span>
                                </div>
                                <button
                                  type="button"
                                  className="rn-inv-recall-btn"
                                  onClick={() => handleRecallUnit(item.id, dep.id)}
                                  title={`Recall 1 ${item.unitLabel} back to ${item.depot}`}
                                >
                                  <RotateCcw size={11} />
                                  <span>Recall 1</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="rn-inv-actions-grid">
                      <button 
                        type="button" 
                        className="rn-inv-btn-deploy"
                        onClick={() => handleOpenDeployModal(item)}
                        disabled={available <= 0}
                        title={available <= 0 ? 'All units currently deployed' : `Deploy ${item.unitLabel} to an incident or base`}
                      >
                        <Send size={13} />
                        <span>{available <= 0 ? 'All Deployed' : 'Deploy to Place'}</span>
                      </button>
                      <button 
                        type="button" 
                        className="rn-inv-btn-capacity"
                        onClick={() => handleOpenAdjustCapacity(item)}
                        title="Adjust or set maximum fleet capacity for this depot"
                      >
                        <Settings size={13} />
                        <span>Set Max Units</span>
                      </button>
                      <button 
                        type="button" 
                        className="rn-inv-btn-restock"
                        onClick={() => handleRestockInventory(item)}
                        title="Order central depot restock"
                      >
                        <RefreshCw size={12} />
                        <span>Restock</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBVIEW 5: TACTICAL GEOSPATIAL GRID */}
        {sidebarActiveTab === 'geospatial' && (
          <div className="rn-geo-view">
            <div className="rn-geo-hud-bar">
              <div className="rn-geo-sector-selects">
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginRight: '6px' }}>
                  Active Sector:
                </span>
                {['Sector 01', 'Sector 02', 'Sector 03', 'Sector 04', 'Sector 05'].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    className={`rn-geo-sec-btn ${selectedSector === sec ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSector(sec);
                      showToast(`Tactical radar centered on ${sec}`);
                    }}
                  >
                    {sec}
                  </button>
                ))}
              </div>

              <div className="rn-geo-telemetry">
                <span>COORD: 28.6320° N, 77.3620° E</span>
                <span>•</span>
                <span>TARGETS: {filteredNeeds.length} Crisis</span>
                <span>•</span>
                <span>UNITS: {volunteerRoster.length} Active</span>
                <span>•</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>LINK: 99.8% MESH</span>
              </div>
            </div>

            <div className="rn-geo-canvas-card">
              <LiveMap 
                needs={filteredNeeds} 
                volunteers={volunteerRoster}
                selectedNeed={selectedNeed}
                onSelectNeed={(n) => setSelectedIncidentId(n.id)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredNeeds.slice(0, 4).map((need) => (
                <div 
                  key={need.id} 
                  className="rn-dash-incident-card"
                  style={{ padding: '14px', cursor: 'pointer' }}
                  onClick={() => setSelectedIncidentId(need.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="rn-dic-id">#{need.id}</span>
                    <span className={`rn-dic-urgency-pill urgency-${need.urgency.toLowerCase()}`}>
                      {need.urgency}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    {need.title}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>📍 {need.location.address}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 6: OPERATIONAL ANALYTICS & SLA */}
        {sidebarActiveTab === 'analytics' && (
          <div className="rn-ana-view">
            <div className="rn-subview-kpi-row">
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Target Dispatch SLA</div>
                <div className="rn-skpi-value" style={{ color: '#059669' }}>11.4m</div>
                <div className="rn-skpi-hint">Target &lt; 15.0m (24% ahead)</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">AI Triage Accuracy</div>
                <div className="rn-skpi-value">97.4%</div>
                <div className="rn-skpi-hint">Validated against field assessments</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Golden-Hour Extrication</div>
                <div className="rn-skpi-value">89.2%</div>
                <div className="rn-skpi-hint">142 high-risk citizens relocated</div>
              </div>
              <div className="rn-subview-kpi-card">
                <div className="rn-skpi-label">Mesh Network Uptime</div>
                <div className="rn-skpi-value">99.8%</div>
                <div className="rn-skpi-hint">Zero packet loss in Sector 4</div>
              </div>
            </div>

            <div className="rn-ana-grid-split">
              <div className="rn-ana-panel">
                <h4 className="rn-ana-panel-title">Avg Response Time by Emergency Category</h4>
                <p className="rn-ana-panel-sub">Time elapsed from community reporting to on-scene arrival</p>

                <div className="rn-ana-bar-row">
                  <div className="rn-ana-bar-item">
                    <div className="rn-ana-bar-meta">
                      <span>Swiftwater Flood Rescue</span>
                      <span>9.8 min (Target &lt; 15m)</span>
                    </div>
                    <div className="rn-ana-track">
                      <div className="rn-ana-fill" style={{ width: '65%' }}></div>
                    </div>
                  </div>

                  <div className="rn-ana-bar-item">
                    <div className="rn-ana-bar-meta">
                      <span>Medical &amp; Trauma Triage</span>
                      <span>8.2 min (Target &lt; 12m)</span>
                    </div>
                    <div className="rn-ana-track">
                      <div className="rn-ana-fill accent" style={{ width: '55%' }}></div>
                    </div>
                  </div>

                  <div className="rn-ana-bar-item">
                    <div className="rn-ana-bar-meta">
                      <span>Structural Collapse &amp; Trapped</span>
                      <span>13.5 min (Target &lt; 20m)</span>
                    </div>
                    <div className="rn-ana-track">
                      <div className="rn-ana-fill amber" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="rn-ana-bar-item">
                    <div className="rn-ana-bar-meta">
                      <span>Potable Water &amp; Food Relief</span>
                      <span>18.0 min (Target &lt; 30m)</span>
                    </div>
                    <div className="rn-ana-track">
                      <div className="rn-ana-fill rose" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rn-ana-panel">
                <h4 className="rn-ana-panel-title">Sector Incident Distribution</h4>
                <p className="rn-ana-panel-sub">Real-time concentration of active emergency calls</p>

                <div className="rn-ana-bar-row">
                  <div className="rn-ana-bar-item">
                    <div className="rn-ana-bar-meta">
                      <span>Sector 04 - East Valley (Flash Flood Zone)</span>
                      <span>42% (47 Incidents)</span>
                    </div>
                    <div className="rn-ana-track">
                      <div className="rn-ana-fill" style={{ width: '42%' }}></div>
                    </div>
                  </div>

                  <div className="rn-ana-bar-item">
                    <div className="rn-ana-bar-meta">
                      <span>Sector 02 - North Basin (Water Contamination)</span>
                      <span>26% (29 Incidents)</span>
                    </div>
                    <div className="rn-ana-track">
                      <div className="rn-ana-fill accent" style={{ width: '26%' }}></div>
                    </div>
                  </div>

                  <div className="rn-ana-bar-item">
                    <div className="rn-ana-bar-meta">
                      <span>Sector 01 - Industrial Ridge</span>
                      <span>18% (20 Incidents)</span>
                    </div>
                    <div className="rn-ana-track">
                      <div className="rn-ana-fill amber" style={{ width: '18%' }}></div>
                    </div>
                  </div>

                  <div className="rn-ana-bar-item">
                    <div className="rn-ana-bar-meta">
                      <span>All Other Sectors (Standby)</span>
                      <span>14% (16 Incidents)</span>
                    </div>
                    <div className="rn-ana-track">
                      <div className="rn-ana-fill rose" style={{ width: '14%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rn-ana-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h4 className="rn-ana-panel-title">Automated Incident Audit Telemetry</h4>
                  <p className="rn-ana-panel-sub" style={{ margin: 0 }}>Verified dispatch proof records logged to immutable operations ledger</p>
                </div>

                <button 
                  type="button" 
                  className="rn-header-landing-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => showToast('Exporting operations incident audit log (.CSV)...')}
                >
                  <Download size={14} />
                  <span>Export Audit (.CSV)</span>
                </button>
              </div>

              <table className="rn-ana-table">
                <thead>
                  <tr>
                    <th>Incident ID</th>
                    <th>Emergency Description</th>
                    <th>Sector</th>
                    <th>AI Confidence</th>
                    <th>Assigned Responder</th>
                    <th>SLA Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>#RN-8941</strong></td>
                    <td>Flash flood elderly evacuation</td>
                    <td>Sector 4</td>
                    <td>97%</td>
                    <td>Arjun Mehta (Lead)</td>
                    <td>8.4m</td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✓ Within SLA</span></td>
                  </tr>
                  <tr>
                    <td><strong>#RN-8940</strong></td>
                    <td>Water reservoir failure (350+ pax)</td>
                    <td>Sector 14</td>
                    <td>93%</td>
                    <td>Priya Sharma</td>
                    <td>14.2m</td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✓ Within SLA</span></td>
                  </tr>
                  <tr>
                    <td><strong>#RN-8939</strong></td>
                    <td>Power transformer fire &amp; sparks</td>
                    <td>Sector 2</td>
                    <td>89%</td>
                    <td>Kavita Rao</td>
                    <td>11.0m</td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✓ Within SLA</span></td>
                  </tr>
                  <tr>
                    <td><strong>#RN-8938</strong></td>
                    <td>Child diabetic insulin delivery</td>
                    <td>Sector 4</td>
                    <td>98%</td>
                    <td>Dr. Sunita Sen</td>
                    <td>6.5m</td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✓ Target Met</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: DEPLOY RESOURCE TO INCIDENT / RESPONDER UNIT */}
      {deployModalItem && (
        <div className="rn-inv-modal-overlay" onClick={() => setDeployModalItem(null)}>
          <div className="rn-inv-modal-card" onClick={e => e.stopPropagation()}>
            <div className="rn-inv-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="rn-inv-category-tag">{deployModalItem.category}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>• Depot Stock Active</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Deploy {deployModalItem.name}
                </h3>
              </div>
              <button 
                type="button" 
                className="rn-inv-modal-close"
                onClick={() => setDeployModalItem(null)}
                aria-label="Close Deploy Dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rn-inv-modal-body">
              {/* Depot Status Banner */}
              <div className="rn-inv-modal-banner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Base Depot: {deployModalItem.depot}</strong>
                  <span style={{ fontWeight: 800, color: '#059669' }}>
                    {deployModalItem.total - deployModalItem.deployed} {deployModalItem.unitLabel} Available
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#047857' }}>
                  Fleet capacity: {deployModalItem.total} Max Units • Currently deployed in field: {deployModalItem.deployed} Units
                </div>
              </div>

              {/* Destination Selector */}
              <div className="rn-inv-modal-field">
                <label className="rn-inv-modal-label">
                  <span>Target Destination / Unit</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Select incident or field camp</span>
                </label>

                {/* Preset Chips */}
                <div className="rn-inv-preset-chips">
                  {needs.slice(0, 3).map(need => (
                    <button
                      key={need.id}
                      type="button"
                      className={`rn-inv-preset-chip ${deployTargetPlace.includes(need.id) ? 'is-selected' : ''}`}
                      onClick={() => setDeployTargetPlace(`Incident #${need.id} (${need.title})`)}
                    >
                      #{need.id} {need.title.slice(0, 24)}...
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`rn-inv-preset-chip ${deployTargetPlace.includes('Camp Alpha') ? 'is-selected' : ''}`}
                    onClick={() => setDeployTargetPlace('Camp Alpha - Riverside Field Base')}
                  >
                    Camp Alpha Riverside Base
                  </button>
                  <button
                    type="button"
                    className={`rn-inv-preset-chip ${deployTargetPlace.includes('Medical Triage') ? 'is-selected' : ''}`}
                    onClick={() => setDeployTargetPlace('Sector 4 Medical Triage Staging')}
                  >
                    Sector 4 Medical Staging
                  </button>
                </div>

                <input
                  type="text"
                  className="rn-inv-modal-input"
                  value={deployTargetPlace}
                  onChange={e => setDeployTargetPlace(e.target.value)}
                  placeholder="Or enter custom incident, camp, or team name..."
                />
              </div>

              {/* Quantity to Deploy */}
              <div className="rn-inv-modal-field">
                <label className="rn-inv-modal-label">
                  <span>Quantity to Dispatch</span>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                    Max: {deployModalItem.total - deployModalItem.deployed} {deployModalItem.unitLabel}
                  </span>
                </label>
                <div className="rn-inv-stepper-wrap">
                  <button
                    type="button"
                    className="rn-inv-stepper-btn"
                    onClick={() => setDeployQty(q => Math.max(1, q - 1))}
                    disabled={deployQty <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    className="rn-inv-modal-input"
                    style={{ width: '80px', textAlign: 'center', fontWeight: 800, fontSize: '16px' }}
                    value={deployQty}
                    min={1}
                    max={deployModalItem.total - deployModalItem.deployed}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      const maxAvail = deployModalItem.total - deployModalItem.deployed;
                      setDeployQty(Math.max(1, Math.min(maxAvail, val)));
                    }}
                  />
                  <button
                    type="button"
                    className="rn-inv-stepper-btn"
                    onClick={() => setDeployQty(q => Math.min(deployModalItem.total - deployModalItem.deployed, q + 1))}
                    disabled={deployQty >= (deployModalItem.total - deployModalItem.deployed)}
                  >
                    <Plus size={14} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    {deployModalItem.unitLabel} will be dispatched
                  </span>
                </div>
              </div>

              {/* Priority & Protocol */}
              <div className="rn-inv-modal-field">
                <label className="rn-inv-modal-label">
                  <span>Deployment Urgency</span>
                </label>
                <select
                  className="rn-inv-modal-input"
                  value={deployNotes}
                  onChange={e => setDeployNotes(e.target.value)}
                >
                  <option value="Urgent Emergency Dispatch">🚨 Urgent Emergency Dispatch (Immediate transport)</option>
                  <option value="Standard Equipment Stationing">📦 Standard Equipment Stationing (Base operational supply)</option>
                  <option value="Pre-emptive Weather Staging">⛈️ Pre-emptive Weather Staging (Advance readiness)</option>
                </select>
              </div>
            </div>

            <div className="rn-inv-modal-footer">
              <button 
                type="button" 
                className="rn-inv-modal-cancel-btn"
                onClick={() => setDeployModalItem(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="rn-inv-modal-confirm-btn"
                onClick={handleConfirmDeploy}
              >
                <Send size={14} />
                <span>Confirm Dispatch ({deployQty} {deployModalItem.unitLabel})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST MAXIMUM FLEET CAPACITY */}
      {adjustCapacityItem && (
        <div className="rn-inv-modal-overlay" onClick={() => setAdjustCapacityItem(null)}>
          <div className="rn-inv-modal-card" onClick={e => e.stopPropagation()}>
            <div className="rn-inv-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="rn-inv-category-tag">{adjustCapacityItem.category}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>• Fleet Quota Setting</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Set Maximum Fleet Capacity
                </h3>
              </div>
              <button 
                type="button" 
                className="rn-inv-modal-close"
                onClick={() => setAdjustCapacityItem(null)}
                aria-label="Close Capacity Dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rn-inv-modal-body">
              {/* Explanation Note */}
              <div style={{ background: '#f8faf9', border: '1px solid #d2e4dc', borderRadius: '12px', padding: '12px 16px', fontSize: '12.5px', color: '#334155', lineHeight: '1.5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#042318', marginBottom: '4px' }}>
                  <Info size={15} color="#059669" />
                  <span>How Maximum Fleet Capacity is Defined</span>
                </div>
                The <strong>Maximum Fleet Capacity</strong> is the total authorized ceiling of units owned, leased, or allocated by crisis logistics to <strong>{adjustCapacityItem.depot}</strong>. Adjusting this value defines the upper bound for field utilization and depot reserves.
              </div>

              {/* Current Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Current Field Deployed</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>{adjustCapacityItem.deployed} {adjustCapacityItem.unitLabel}</div>
                  <div style={{ fontSize: '10.5px', color: '#047857' }}>Cannot set capacity below this</div>
                </div>
                <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Current Max Capacity</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{adjustCapacityItem.total} {adjustCapacityItem.unitLabel}</div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>Existing authorized ceiling</div>
                </div>
              </div>

              {/* Adjust Stepper */}
              <div className="rn-inv-modal-field">
                <label className="rn-inv-modal-label">
                  <span>New Maximum Authorized Units</span>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                    Resulting Depot Reserve: {Math.max(0, newMaxCapacityVal - adjustCapacityItem.deployed)} {adjustCapacityItem.unitLabel}
                  </span>
                </label>
                <div className="rn-inv-stepper-wrap">
                  <button
                    type="button"
                    className="rn-inv-stepper-btn"
                    onClick={() => setNewMaxCapacityVal(v => Math.max(adjustCapacityItem.deployed, v - 1))}
                    disabled={newMaxCapacityVal <= adjustCapacityItem.deployed}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    className="rn-inv-modal-input"
                    style={{ width: '100px', textAlign: 'center', fontWeight: 800, fontSize: '18px' }}
                    value={newMaxCapacityVal}
                    min={adjustCapacityItem.deployed}
                    onChange={e => {
                      const val = parseInt(e.target.value) || adjustCapacityItem.deployed;
                      setNewMaxCapacityVal(Math.max(adjustCapacityItem.deployed, val));
                    }}
                  />
                  <button
                    type="button"
                    className="rn-inv-stepper-btn"
                    onClick={() => setNewMaxCapacityVal(v => v + 1)}
                  >
                    <Plus size={14} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    Total {adjustCapacityItem.unitLabel} Cap
                  </span>
                </div>
              </div>
            </div>

            <div className="rn-inv-modal-footer">
              <button 
                type="button" 
                className="rn-inv-modal-cancel-btn"
                onClick={() => setAdjustCapacityItem(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="rn-inv-modal-confirm-btn"
                onClick={handleSaveAdjustCapacity}
              >
                <Settings size={14} />
                <span>Save Fleet Capacity ({newMaxCapacityVal} {adjustCapacityItem.unitLabel})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="rn-toast-notification">
          <CheckCircle2 size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
