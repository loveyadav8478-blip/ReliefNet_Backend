import { NeedReport, Volunteer, ActivityEvent } from '../types';

export const INITIAL_NEEDS: NeedReport[] = [
  {
    id: 'RN-8941',
    title: 'Flash flood trapped elderly citizen group behind medical dispensary, Sector 4',
    description: 'Rapidly rising water levels have isolated 8-12 senior citizens on the elevated porch of the dispensary. Ground level water exceeds 4.5ft with swift currents.',
    category: 'Rescue',
    urgency: 'CRITICAL',
    priorityScore: 98,
    peopleCount: '8-12 people',
    riskLevel: 'Extreme Flood Level',
    targetEta: '< 15m',
    location: {
      lat: 28.6300,
      lng: 77.3620,
      address: 'Medical Dispensary, Block C, Sector 4',
      district: 'East Valley District'
    },
    status: 'SUBMITTED',
    reportedAt: '4m ago',
    reporterName: 'Sunita Sharma (Nurse)',
    reporterContact: '+91 98112 34567',
    imageUrl: '/images/flood-card.jpg',
    requiredSkills: ['Swift Water Rescue', 'Inflatable Boat', 'Hypothermia Kit'],
    aiConfidence: 97,
    aiClassificationNotes: 'High confidence (97%). Immediate water rescue & hypothermia kit required. Road 12 blocked; route through bypass 4B.',
    recommendedVolunteer: {
      id: 'VOL-101',
      name: 'Arjun Mehta',
      role: 'Water Rescue Lead',
      distance: '1.4 km away',
      rating: 4.9,
      completedMissions: 38,
      skills: ['Swift Water Rescue', 'First Aid', 'Boat Pilot']
    }
  },
  {
    id: 'RN-8940',
    title: 'Potable water purification failure at community evacuation shelter (350+ people)',
    description: 'Municipal pipeline backflow has contaminated main water reservoir. Shelter housing 350+ displaced residents has zero clean drinking water.',
    category: 'Food & Water',
    urgency: 'HIGH',
    priorityScore: 84,
    peopleCount: '350+ displaced',
    riskLevel: 'Contamination Hazard',
    targetEta: '< 30m',
    location: {
      lat: 28.6415,
      lng: 77.3410,
      address: 'Community Center Shelter, Sector 14',
      district: 'North Basin District'
    },
    status: 'SUBMITTED',
    reportedAt: '12m ago',
    reporterName: 'Dr. Rakesh Verma (Shelter Head)',
    reporterContact: '+91 98710 44321',
    requiredSkills: ['Water Filtration', 'Bulk Logistics', 'Sanitation'],
    aiConfidence: 93,
    aiClassificationNotes: 'Water contamination detected. Requires 200L clean reserves & rapid filtration units. High infant & pediatric vulnerability.',
    recommendedVolunteer: {
      id: 'VOL-102',
      name: 'Priya Sharma',
      role: 'Sanitation Engineer',
      distance: '2.1 km away',
      rating: 4.8,
      completedMissions: 29,
      skills: ['Water Filtration', 'Logistics']
    }
  },
  {
    id: 'RN-8938',
    title: 'Structural wall collapse blocking secondary supply corridor near sector 7 feeder',
    description: 'Retaining wall crumbled under heavy rains, blocking vehicular passage for ambulance and supply trucks heading to relief camps.',
    category: 'Shelter',
    urgency: 'MEDIUM',
    priorityScore: 62,
    peopleCount: 'Road Obstruction',
    riskLevel: 'Supply Choke Point',
    targetEta: '< 45m',
    location: {
      lat: 28.6520,
      lng: 77.3820,
      address: 'Feeder Road 7, Near Overpass',
      district: 'Central Corridor'
    },
    status: 'IN_PROGRESS',
    reportedAt: '28m ago',
    reporterName: 'Traffic Police Patrol',
    requiredSkills: ['Heavy Equipment', 'Debris Clearing'],
    assignedVolunteerId: 'VOL-103',
    aiConfidence: 89,
    aiClassificationNotes: 'Physical hazard. Debris clearance required. Route secondary convoy via Avenue 9 to avoid delay.'
  },
  {
    id: 'RN-8935',
    title: 'Baby formula & infant dry supplies delivered to 12 displaced families',
    description: 'Urgent nutritional assistance for 14 infants at temporary tent settlement in Sector 71.',
    category: 'Food & Water',
    urgency: 'LOW',
    priorityScore: 40,
    peopleCount: '12 families',
    riskLevel: 'Resolved',
    targetEta: 'Completed',
    location: {
      lat: 28.6189,
      lng: 77.3824,
      address: 'Camp B, Sector 71',
      district: 'South Ridge'
    },
    status: 'RESOLVED',
    reportedAt: '1h ago',
    reporterName: 'Seema Rao',
    requiredSkills: ['Community Distribution'],
    assignedVolunteerId: 'VOL-104',
    aiConfidence: 99,
    aiClassificationNotes: 'Mission successfully verified and closed. 150 kits distributed with photo proof.'
  },
  {
    id: 'RN-8932',
    title: 'Trauma first aid & oxygen cylinder distribution to field medical tent 3',
    description: 'Emergency respiratory support supplies provided for 6 critical patients awaiting hospital transfer.',
    category: 'Medical',
    urgency: 'HIGH',
    priorityScore: 82,
    peopleCount: '6 critical',
    riskLevel: 'Resolved',
    targetEta: 'Completed',
    location: {
      lat: 28.6380,
      lng: 77.3550,
      address: 'Field Hospital Alpha, Sector 12',
      district: 'East Valley District'
    },
    status: 'RESOLVED',
    reportedAt: '2h ago',
    reporterName: 'Paramedic Lead',
    requiredSkills: ['Trauma Care', 'Oxygen Transport'],
    assignedVolunteerId: 'VOL-105',
    aiConfidence: 96,
    aiClassificationNotes: 'Medical relief verified by attending triage physician.'
  }
];

export const INITIAL_VOLUNTEERS: Volunteer[] = [
  {
    id: 'VOL-101',
    name: 'Kavita Rao',
    role: 'Senior Paramedic & Drone Pilot',
    phone: '+91 98990 11223',
    email: 'kavita.rao@reliefnet.org',
    skills: ['First Aid', 'Triage', 'Offroad Driver', 'Drone Surveillance'],
    status: 'AVAILABLE',
    location: {
      lat: 28.6310,
      lng: 77.3600,
      address: 'Sector 4 Depot'
    },
    rating: 4.9,
    completedMissions: 42,
    distanceKm: 0.8,
    matchScore: 98,
    matchReason: 'Closest available paramedic with water rescue certification and rapid deployment equipment.'
  },
  {
    id: 'VOL-102',
    name: 'Arjun Mehta',
    role: 'Water Rescue Lead',
    phone: '+91 98114 55667',
    email: 'arjun.mehta@reliefnet.org',
    skills: ['Swift Water Rescue', 'Boat Pilot', 'Hypothermia Triage'],
    status: 'AVAILABLE',
    location: {
      lat: 28.6295,
      lng: 77.3670,
      address: 'Sector 62 Staging Post'
    },
    rating: 4.9,
    completedMissions: 38,
    distanceKm: 1.4,
    matchScore: 96,
    matchReason: 'Specialized motorboat pilot with rapid extraction certification.'
  },
  {
    id: 'VOL-103',
    name: 'Priya Sharma',
    role: 'Sanitation & Water Specialist',
    phone: '+91 98450 77889',
    email: 'priya.sharma@reliefnet.org',
    skills: ['Water Filtration', 'Bulk Logistics', 'Disaster Sanitation'],
    status: 'DEPLOYED',
    location: {
      lat: 28.6430,
      lng: 77.3390,
      address: 'Sector 14 Logistics Hub'
    },
    rating: 4.8,
    completedMissions: 29,
    distanceKm: 2.1,
    matchScore: 91
  },
  {
    id: 'VOL-104',
    name: 'Karun Pandey',
    role: 'Tactical Coordinator & Response Lead',
    phone: '+91 98100 23456',
    email: 'karun.pandey@reliefnet.org',
    skills: ['Crisis Triage', 'Logistics Management', 'First Aid', 'GIS Navigation'],
    status: 'AVAILABLE',
    location: {
      lat: 28.6325,
      lng: 77.3590,
      address: 'Central District Command Post'
    },
    rating: 5.0,
    completedMissions: 56,
    distanceKm: 0.5,
    matchScore: 99
  }
];

export const INITIAL_ACTIVITY_LOG: ActivityEvent[] = [
  {
    id: 'ACT-1',
    time: '14:52',
    title: 'Team Alpha reached Sector 4 checkpoint with inflatable rescue skiff',
    type: 'dispatch',
    sector: 'Sector 4'
  },
  {
    id: 'ACT-2',
    time: '14:48',
    title: 'AI verified distress call #RN-8941 from Sector 4 (Confidence 97%)',
    type: 'verification',
    sector: 'Sector 4'
  },
  {
    id: 'ACT-3',
    time: '14:41',
    title: '50 Emergency Trauma Medical Kits dispatched from Central Depot',
    type: 'delivery',
    sector: 'Depot'
  },
  {
    id: 'ACT-4',
    time: '14:35',
    title: 'Volunteer Karun Pandey marked mission #RN-8932 as Complete',
    type: 'resolved',
    sector: 'Sector 12'
  },
  {
    id: 'ACT-5',
    time: '14:20',
    title: 'Evacuation Corridor 4B cleared by Civil Engineering squad',
    type: 'alert',
    sector: 'Corridor 4B'
  }
];
