export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type NeedCategory = 'Rescue' | 'Medical' | 'Food & Water' | 'Shelter' | 'Sanitation' | 'Logistics';
export type NeedStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
export type ActiveTab = 'landing' | 'dashboard' | 'volunteer' | 'reporter';
export type UserRole = 'coordinator' | 'volunteer' | 'reporter' | null;

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'coordinator' | 'volunteer' | 'reporter';
  phone?: string;
  skills?: string[];
  location?: LocationCoordinates;
  travelRadiusKm?: number;
  completedMissions?: number;
  rating?: number;
  organization?: string;
  /** Backend volunteer profile id (only for volunteers). */
  volunteerId?: number;
}


export interface LocationCoordinates {
  lat: number;
  lng: number;
  address: string;
  district?: string;
}

export interface RecommendedVolunteer {
  id: string;
  name: string;
  role: string;
  distance: string;
  rating?: number;
  completedMissions?: number;
  skills: string[];
}

export interface NeedReport {
  id: string;
  title: string;
  description: string;
  category: NeedCategory;
  urgency: UrgencyLevel;
  priorityScore: number; // 1 to 100
  peopleCount?: string;
  riskLevel?: string;
  targetEta?: string;
  location: LocationCoordinates;
  status: NeedStatus;
  reportedAt: string;
  reporterName?: string;
  reporterContact?: string;
  imageUrl?: string;
  requiredSkills: string[];
  assignedVolunteerId?: string;
  aiConfidence?: number;
  aiClassificationNotes?: string;
  recommendedVolunteer?: RecommendedVolunteer;
}

export interface Volunteer {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  skills: string[];
  status: 'AVAILABLE' | 'DEPLOYED' | 'OFFLINE';
  location: LocationCoordinates;
  rating?: number;
  completedMissions: number;
  /** Dispatch radius in km, straight from the volunteer record. */
  radiusKm?: number;
  distanceKm?: number;
  matchScore?: number;
  matchReason?: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  title: string;
  type: 'dispatch' | 'verification' | 'delivery' | 'resolved' | 'alert';
  sector?: string;
}
