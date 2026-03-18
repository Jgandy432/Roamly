import { FinalizedChoices, TripInvite, TripMember, TripPlan, TripStatus, UserPreferences, Vote } from '@/types/trip';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

export interface StoredTrip {
  id: string;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  constraints: string;
  groupSize: number;
  createdBy: string;
  createdAt: string;
  status: TripStatus;
  plan: TripPlan | null;
  votes: Vote[];
  finalized?: FinalizedChoices;
}

export interface StoredTripMember {
  id: string;
  tripId: string;
  userId: string;
  role: TripMember['role'];
  joinedAt: string;
  preferencesSubmitted: boolean;
  preferences?: UserPreferences;
}

export interface StoredTripInvite extends Omit<TripInvite, 'inviteLink'> {}

export interface DatabaseShape {
  users: StoredUser[];
  trips: StoredTrip[];
  tripMembers: StoredTripMember[];
  tripInvites: StoredTripInvite[];
}
