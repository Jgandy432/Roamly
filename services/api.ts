import { AuthResponse, AppUser, FinalizedChoices, Trip, TripData, TripInvite, TripPlan, TripMemberRole, UserPreferences } from '@/types/trip';

const API_BASE_URL = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_RORK_API_BASE_URL');
  }
  return `${API_BASE_URL}/api${path}`;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) as Record<string, unknown> : {};

  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed');
  }

  return data as T;
}

export const api = {
  signup(input: { name: string; email: string; password: string }) {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  login(input: { email: string; password: string }) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  me(token: string) {
    return request<{ user: AppUser }>('/auth/me', {}, token);
  },
  logout(token: string) {
    return request<{ success: boolean }>('/auth/logout', { method: 'POST' }, token);
  },
  completeOnboarding(token: string) {
    return request<{ user: AppUser }>('/auth/onboarding', { method: 'PATCH' }, token);
  },
  listTrips(token: string) {
    return request<{ trips: Trip[] }>('/trips', {}, token);
  },
  createTrip(token: string, tripData: TripData) {
    return request<{ trip: Trip }>('/trips', {
      method: 'POST',
      body: JSON.stringify({
        tripName: tripData.name,
        destination: tripData.destination,
        startDate: tripData.startDate ?? '',
        endDate: tripData.endDate ?? '',
        description: tripData.description ?? '',
        groupSize: tripData.groupSize,
        constraints: tripData.constraints,
      }),
    }, token);
  },
  savePreferences(token: string, tripId: string, preferences: UserPreferences) {
    return request<{ trip: Trip }>(`/trips/${tripId}/preferences`, {
      method: 'POST',
      body: JSON.stringify(preferences),
    }, token);
  },
  savePlan(token: string, tripId: string, plan: TripPlan) {
    return request<{ trip: Trip }>(`/trips/${tripId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan, status: 'planned' }),
    }, token);
  },
  vote(token: string, tripId: string, itemId: string, vote: 'up' | 'down') {
    return request<{ trip: Trip }>(`/trips/${tripId}/votes`, {
      method: 'POST',
      body: JSON.stringify({ itemId, vote }),
    }, token);
  },
  finalize(token: string, tripId: string, finalized: FinalizedChoices) {
    return request<{ trip: Trip }>(`/trips/${tripId}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ finalized }),
    }, token);
  },
  invite(token: string, tripId: string, email: string, role: TripMemberRole) {
    return request<{ trip: Trip; invite: TripInvite }>(`/trips/${tripId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }, token);
  },
  acceptInvite(token: string, inviteToken: string) {
    return request<{ trip: Trip }>('/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ inviteToken }),
    }, token);
  },
};
