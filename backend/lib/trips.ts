import { AppUser, Trip, TripInvite, TripMember } from '@/types/trip';
import { DatabaseShape, StoredTrip, StoredTripInvite, StoredTripMember, StoredUser } from '@/backend/types';

export function makeAvatar(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function publicUser(user: StoredUser): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: makeAvatar(user.name),
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    createdAt: user.createdAt,
  };
}

export function resolveMember(db: DatabaseShape, member: StoredTripMember): TripMember {
  const user = db.users.find((item) => item.id === member.userId);
  return {
    id: member.id,
    userId: member.userId,
    name: user?.name ?? 'Unknown User',
    email: user?.email ?? '',
    avatar: makeAvatar(user?.name ?? 'U'),
    role: member.role,
    joinedAt: member.joinedAt,
    preferencesSubmitted: member.preferencesSubmitted,
    preferences: member.preferences,
  };
}

export function resolveInvite(tripInvite: StoredTripInvite): TripInvite {
  return {
    ...tripInvite,
    inviteLink: `https://roamly.app/invite/${tripInvite.inviteToken}`,
  };
}

export function resolveTrip(db: DatabaseShape, trip: StoredTrip): Trip {
  const members = db.tripMembers
    .filter((member) => member.tripId === trip.id)
    .map((member) => resolveMember(db, member));

  const invites = db.tripInvites
    .filter((invite) => invite.tripId === trip.id)
    .map((invite) => resolveInvite(invite));

  return {
    id: trip.id,
    name: trip.tripName,
    destination: trip.destination,
    groupSize: trip.groupSize,
    constraints: trip.constraints,
    startDate: trip.startDate,
    endDate: trip.endDate,
    description: trip.description,
    createdBy: trip.createdBy,
    createdAt: trip.createdAt,
    members,
    invites,
    status: trip.status,
    plan: trip.plan,
    votes: trip.votes,
    finalized: trip.finalized,
  };
}

export function getTripMembership(db: DatabaseShape, tripId: string, userId: string): StoredTripMember | undefined {
  return db.tripMembers.find((member) => member.tripId === tripId && member.userId === userId);
}

export function requireTripMembership(db: DatabaseShape, tripId: string, userId: string): StoredTripMember {
  const membership = getTripMembership(db, tripId, userId);
  if (!membership) {
    throw new Error('You do not have access to this trip');
  }
  return membership;
}

export function requireTripEditPermission(db: DatabaseShape, tripId: string, userId: string): StoredTripMember {
  const membership = requireTripMembership(db, tripId, userId);
  if (membership.role === 'viewer') {
    throw new Error('You have read-only access to this trip');
  }
  return membership;
}

export function requireTripOwner(db: DatabaseShape, tripId: string, userId: string): StoredTripMember {
  const membership = requireTripMembership(db, tripId, userId);
  if (membership.role !== 'owner') {
    throw new Error('Only the trip owner can do this');
  }
  return membership;
}
