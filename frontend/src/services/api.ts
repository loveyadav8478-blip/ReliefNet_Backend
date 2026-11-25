/**
 * Single entry point for talking to the ReliefNet backend.
 *
 * Base URL is resolved at runtime, so a deployment can be re-pointed without a
 * rebuild:
 *   1. public/config.js  ->  window.__RELIEFNET_CONFIG__.apiUrl
 *   2. build-time VITE_API_URL
 *   3. the local Spring Boot server
 */

interface RuntimeConfig {
  apiUrl?: string;
}

const runtimeApiUrl = (window as unknown as { __RELIEFNET_CONFIG__?: RuntimeConfig })
  .__RELIEFNET_CONFIG__?.apiUrl?.trim();
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
export const API_BASE_URL = (runtimeApiUrl || env.VITE_API_URL || 'http://localhost:8081').replace(/\/$/, '');

const TOKEN_KEY = 'reliefnet_token';

/** Fired when an authenticated request is rejected because the session is no longer valid. */
export const UNAUTHORIZED_EVENT = 'reliefnet:unauthorized';

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type ApiRole = 'VOLUNTEER' | 'REPORTER' | 'COORDINATOR' | 'ADMIN';

export interface ApiAuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  name: string;
  email: string;
  role: ApiRole;
  volunteerId: number | null;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: ApiRole;
  isActive: boolean;
  volunteerId: number | null;
}

export interface ApiNeed {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  urgency: string | null;
  priorityScore: number | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  aiDetectedLocation: string | null;
  reporterName: string | null;
  reporterContact: string | null;
  aiReasoning: string | null;
  suggestedSkills: string | null;
  overallConfidence: number | null;
  confidenceLabel: string | null;
  peopleAffected: number | null;
  source: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ApiVolunteer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string | null;
  skillList: string[];
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  isAvailable: boolean;
  radiusKm: number | null;
}

export interface ApiTask {
  id: number;
  needId: number;
  needTitle: string;
  volunteerId: number;
  volunteerName: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
}

export interface ApiDashboardStats {
  totalNeeds: number;
  openNeeds: number;
  assignedNeeds: number;
  resolvedNeeds: number;
  criticalNeeds: number;
  highNeeds: number;
  totalVolunteers: number;
  availableVolunteers: number;
  activeTasks: number;
  completedTasks: number;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  auth?: boolean;
  /** Do not broadcast UNAUTHORIZED_EVENT for this call (used while bootstrapping a session). */
  silentAuthFailure?: boolean;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

function readErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const data = payload as { message?: string; error?: string; errors?: Record<string, string> };
    if (data.errors) {
      const details = Object.entries(data.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      if (details) return details;
    }
    if (data.message) return data.message;
    if (data.error) return data.error;
  }
  return `Request failed (HTTP ${status})`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, silentAuthFailure = false } = options;

  const headers: Record<string, string> = {};
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, `Cannot reach the backend at ${API_BASE_URL}. Is it running?`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    // Only an authenticated call proves the session went stale — a rejected
    // login/register attempt must not wipe an existing session.
    if (response.status === 401 && auth) {
      tokenStore.clear();
      if (!silentAuthFailure) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, readErrorMessage(payload, response.status));
  }

  return payload as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<ApiAuthResponse>('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      }),

    register: (payload: { name: string; email: string; password: string; role: 'VOLUNTEER' | 'REPORTER' }) =>
      request<ApiAuthResponse>('/api/auth/register', {
        method: 'POST',
        auth: false,
        body: payload,
      }),

    registerCoordinator: (payload: {
      name: string;
      email: string;
      password: string;
      inviteCode: string;
      volunteerId?: number;
    }) =>
      request<ApiAuthResponse>('/api/auth/register/coordinator', {
        method: 'POST',
        auth: false,
        body: payload,
      }),

    // Used to validate a cached token on startup; a failure here is expected and
    // handled by the caller, so it must not raise the global "session expired" notice.
    me: () => request<ApiUser>('/api/auth/me', { silentAuthFailure: true }),
  },

  needs: {
    list: (params?: Record<string, string | undefined>) =>
      request<ApiNeed[]>(`/api/needs${buildQuery(params)}`),

    /** Only the incidents this reporter filed (backend scopes it to created_by). */
    my: (status?: string) => request<ApiNeed[]>(`/api/needs/my${buildQuery({ status })}`),

    get: (id: number | string) => request<ApiNeed>(`/api/needs/${id}`),

    create: (payload: {
      title: string;
      description: string;
      locationName?: string;
      latitude?: number;
      longitude?: number;
      reporterName?: string;
      reporterContact?: string;
    }) => request<ApiNeed>('/api/needs', { method: 'POST', body: payload }),

    updateStatus: (id: number | string, status: string) =>
      request<ApiNeed>(`/api/needs/${id}/status`, { method: 'PATCH', body: { status } }),

    matches: (id: number | string) => request<unknown[]>(`/api/needs/${id}/matches`),
  },

  volunteers: {
    list: (availableOnly?: boolean) =>
      request<ApiVolunteer[]>(`/api/volunteers${buildQuery({ availableOnly })}`),

    get: (id: number | string) => request<ApiVolunteer>(`/api/volunteers/${id}`),

    setAvailability: (id: number | string, available: boolean) =>
      request<ApiVolunteer>(`/api/volunteers/${id}/availability`, {
        method: 'PATCH',
        body: { available },
      }),
  },

  tasks: {
    list: (status?: string) => request<ApiTask[]>(`/api/tasks${buildQuery({ status })}`),

    create: (payload: { needId: number; volunteerId: number; notes?: string }) =>
      request<ApiTask>('/api/tasks', { method: 'POST', body: payload }),

    updateStatus: (id: number | string, status: string) =>
      request<ApiTask>(`/api/tasks/${id}/status`, { method: 'PATCH', body: { status } }),

    byVolunteer: (volunteerId: number | string) =>
      request<ApiTask[]>(`/api/tasks/by-volunteer/${volunteerId}`),

    byNeed: (needId: number | string) => request<ApiTask[]>(`/api/tasks/by-need/${needId}`),
  },

  dashboard: {
    stats: () => request<ApiDashboardStats>('/api/dashboard/stats'),
  },
};
