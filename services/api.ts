import { AuthResponse, AppUser, FinalizedChoices, Trip, TripData, TripInvite, TripPlan, TripMemberRole, UserPreferences } from '@/types/trip';

const API_BASE_URL = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_RORK_API_BASE_URL');
  }

  const normalizedBaseUrl = API_BASE_URL.endsWith('/api')
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;

  return `${normalizedBaseUrl}/api${path}`;
}

function parseResponseBody(text: string): Record<string, unknown> | null {
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    console.log('API response was not valid JSON', {
      message: error instanceof Error ? error.message : 'unknown',
      preview: text.slice(0, 160),
    });
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = getApiUrl(path);
  console.log('API request starting', { path, url, method: options.method ?? 'GET' });
  console.log('FULL API URL:', url, 'BASE:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = parseResponseBody(text);

  if (!response.ok) {
    const errorPayload = (data ?? {}) as ApiErrorPayload;
    const fallbackMessage = text.trim() || `Request failed with status ${response.status}`;
    throw new Error(errorPayload.error ?? errorPayload.message ?? fallbackMessage);
  }

  if (data === null) {
    throw new Error('The server returned an invalid response. Please try again.');
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
