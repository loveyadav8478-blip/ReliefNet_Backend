/**
 * The UI speaks its own vocabulary (categories like "Rescue"/"Food & Water",
 * string ids, status "SUBMITTED"), while the backend uses enums and numeric ids.
 * These mappers keep that translation in one place.
 */

import { CurrentUser, NeedCategory, NeedReport, UrgencyLevel, Volunteer } from '../types';
import { ApiAuthResponse, ApiNeed, ApiTask, ApiUser, ApiVolunteer } from './api';

const UI_CATEGORY_BY_API: Record<string, NeedCategory> = {
  FOOD: 'Food & Water',
  WATER: 'Food & Water',
  SHELTER: 'Shelter',
  MEDICAL: 'Medical',
  OTHER: 'Logistics',
};

const API_CATEGORY_BY_UI: Record<NeedCategory, string> = {
  'Food & Water': 'FOOD',
  Sanitation: 'WATER',
  Shelter: 'SHELTER',
  Medical: 'MEDICAL',
  Rescue: 'OTHER',
  Logistics: 'OTHER',
};

const UI_STATUS_BY_API: Record<string, NeedReport['status']> = {
  OPEN: 'SUBMITTED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
};

const DEFAULT_SKILLS: Record<string, string[]> = {
  'Food & Water': ['Food Distribution', 'Bulk Logistics'],
  Sanitation: ['Water Treatment', 'Sanitation'],
  Shelter: ['Shelter Management', 'Construction'],
  Medical: ['First Aid', 'Triage'],
  Rescue: ['Swift Water Rescue', 'Boat Pilot'],
  Logistics: ['Logistics', 'Coordination'],
};

function splitSkills(skills?: string | null): string[] {
  if (!skills) return [];
  return skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function relativeTime(iso?: string | null): string {
  if (!iso) return 'just now';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'just now';

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function uiCategoryToApi(category: NeedCategory): string {
  return API_CATEGORY_BY_UI[category] ?? 'OTHER';
}

export function apiCategoryToUi(category?: string | null): NeedCategory {
  return UI_CATEGORY_BY_API[category ?? ''] ?? 'Logistics';
}

export function toNeedReport(need: ApiNeed, assignedVolunteerId?: string): NeedReport {
  const category = apiCategoryToUi(need.category);
  const skills = splitSkills(need.suggestedSkills);

  return {
    id: String(need.id),
    title: need.title || 'Untitled need',
    description: need.description ?? '',
    category,
    urgency: (need.urgency as UrgencyLevel) ?? 'MEDIUM',
    priorityScore: need.priorityScore ?? 0,
    peopleCount: need.peopleAffected ? `${need.peopleAffected} people` : undefined,
    riskLevel: need.confidenceLabel ? `${need.confidenceLabel} confidence` : undefined,
    location: {
      lat: need.latitude ?? 0,
      lng: need.longitude ?? 0,
      address: need.locationName || need.aiDetectedLocation || 'Location not specified',
    },
    status: UI_STATUS_BY_API[need.status] ?? 'SUBMITTED',
    reportedAt: relativeTime(need.createdAt),
    reporterName: need.reporterName ?? undefined,
    reporterContact: need.reporterContact ?? undefined,
    requiredSkills: skills.length ? skills : DEFAULT_SKILLS[category] ?? [],
    assignedVolunteerId,
    aiConfidence: need.overallConfidence != null ? Math.round(need.overallConfidence * 100) : undefined,
    aiClassificationNotes: need.aiReasoning ?? undefined,
  };
}

/**
 * `completedMissions` must come from real task history: the backend has no
 * ratings or ranking column, so nothing is invented here.
 */
export function toVolunteer(volunteer: ApiVolunteer, completedMissions = 0): Volunteer {
  const skills = volunteer.skillList?.length ? volunteer.skillList : splitSkills(volunteer.skills);

  return {
    id: String(volunteer.id),
    name: volunteer.name,
    role: skills[0] ? `${skills[0]} specialist` : 'Field Volunteer',
    phone: volunteer.phone ?? '',
    email: volunteer.email ?? '',
    skills,
    status: volunteer.isAvailable ? 'AVAILABLE' : 'DEPLOYED',
    location: {
      lat: volunteer.latitude ?? 0,
      lng: volunteer.longitude ?? 0,
      address: volunteer.locationName ?? 'Location unknown',
    },
    completedMissions,
    radiusKm: volunteer.radiusKm ?? undefined,
  };
}

/** volunteerId -> number of COMPLETED tasks, from the real task list. */
export function completedMissionsByVolunteer(tasks: ApiTask[]): Record<string, number> {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.status !== 'COMPLETED') return acc;
    const key = String(task.volunteerId);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function toCurrentUser(source: ApiAuthResponse | ApiUser): CurrentUser {
  const role = source.role.toLowerCase();
  return {
    id: String('userId' in source ? source.userId : source.id),
    name: source.name,
    email: source.email,
    role: role === 'admin' ? 'coordinator' : (role as CurrentUser['role']),
    volunteerId: source.volunteerId ?? undefined,
  };
}

/** needId -> volunteerId, so a need can render as dispatched. */
export function assignmentsByNeed(tasks: ApiTask[]): Record<string, string> {
  return tasks.reduce<Record<string, string>>((acc, task) => {
    acc[String(task.needId)] = String(task.volunteerId);
    return acc;
  }, {});
}

/** needId -> taskId, needed to patch a mission's status. */
export function taskIdsByNeed(tasks: ApiTask[]): Record<string, string> {
  return tasks.reduce<Record<string, string>>((acc, task) => {
    acc[String(task.needId)] = String(task.id);
    return acc;
  }, {});
}

/** Picks the best real volunteer for a need: available first, then skill overlap. */
export function pickResponder(need: NeedReport, volunteers: Volunteer[]): Volunteer | undefined {
  if (!volunteers.length) return undefined;

  const available = volunteers.filter((volunteer) => volunteer.status !== 'DEPLOYED');
  const pool = available.length ? available : volunteers;
  const wanted = need.requiredSkills.map((skill) => skill.toLowerCase());

  return pool
    .map((volunteer) => {
      const overlap = volunteer.skills.filter((skill) => {
        const own = skill.toLowerCase();
        return wanted.some((required) => required.includes(own) || own.includes(required));
      }).length;
      return { volunteer, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)[0].volunteer;
}

/** Attaches a real "best responder" to open needs so dispatch sends a real volunteer id. */
export function withRecommendations(needs: NeedReport[], volunteers: Volunteer[]): NeedReport[] {
  if (!volunteers.length) return needs;

  return needs.map((need) => {
    if (need.assignedVolunteerId || need.status === 'RESOLVED') return need;
    const responder = pickResponder(need, volunteers);
    if (!responder) return need;
    return {
      ...need,
      recommendedVolunteer: {
        id: responder.id,
        name: responder.name,
        role: responder.role,
        distance: responder.location.address,
        skills: responder.skills,
      },
    };
  });
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
