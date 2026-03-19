import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthResponse,
  AppUser,
  FinalizedChoices,
  Trip,
  TripData,
  TripInvite,
  TripMember,
  TripMemberRole,
  TripPlan,
  UserPreferences,
} from '@/types/trip';

const USERS_KEY = 'roamly_users';
const TRIPS_KEY = 'roamly_trips';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? (JSON.parse(raw) as StoredUser[]) : [];
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function getTrips(): Promise<Trip[]> {
  const raw = await AsyncStorage.getItem(TRIPS_KEY);
  return raw ? (JSON.parse(raw) as Trip[]) : [];
}

async function saveTrips(trips: Trip[]): Promise<void> {
  await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

function toAppUser(u: StoredUser): AppUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    hasCompletedOnboarding: u.hasCompletedOnboarding,
    createdAt: u.createdAt,
  };
}

export const localApi = {
  async signup(input: { name: string; email: string; password: string }): Promise<AuthResponse> {
    console.log('localApi.signup', { email: input.email });
    const users = await getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists');
    }
    const newUser: StoredUser = {
      id: generateId(),
      name: input.name,
      email: input.email,
      password: input.password,
      avatar: '',
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    await saveUsers(users);
    const token = `local_${newUser.id}`;
    return { session: { token, user: toAppUser(newUser) } };
  },

  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    console.log('localApi.login', { email: input.email });
    const users = await getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase() && u.password === input.password,
    );
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const token = `local_${user.id}`;
    return { session: { token, user: toAppUser(user) } };
  },

  async me(token: string): Promise<{ user: AppUser }> {
    const userId = token.replace('local_', '');
    const users = await getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { user: toAppUser(user) };
  },

  async logout(_token: string): Promise<{ success: boolean }> {
    console.log('localApi.logout');
    return { success: true };
  },

  async completeOnboarding(token: string): Promise<{ user: AppUser }> {
    const userId = token.replace('local_', '');
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    users[idx].hasCompletedOnboarding = true;
    await saveUsers(users);
    return { user: toAppUser(users[idx]) };
  },

  async listTrips(token: string): Promise<{ trips: Trip[] }> {
    const userId = token.replace('local_', '');
    const trips = await getTrips();
    const userTrips = trips.filter(
      (t) => t.createdBy === userId || t.members.some((m) => m.userId === userId),
    );
    console.log('localApi.listTrips', { userId, count: userTrips.length });
    return { trips: userTrips };
  },

  async createTrip(token: string, tripData: TripData): Promise<{ trip: Trip }> {
    const userId = token.replace('local_', '');
    const users = await getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const ownerMember: TripMember = {
      id: generateId(),
      userId: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: 'owner',
      joinedAt: new Date().toISOString(),
      preferencesSubmitted: false,
    };

    const trip: Trip = {
      id: generateId(),
      name: tripData.name,
      destination: tripData.destination,
      groupSize: tripData.groupSize,
      constraints: tripData.constraints,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      description: tripData.description,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      members: [ownerMember],
      invites: [],
      status: 'collecting',
      plan: null,
      votes: [],
    };

    const trips = await getTrips();
    trips.push(trip);
    await saveTrips(trips);
    console.log('localApi.createTrip', { tripId: trip.id });
    return { trip };
  },

  async savePreferences(token: string, tripId: string, preferences: UserPreferences): Promise<{ trip: Trip }> {
    const userId = token.replace('local_', '');
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    const memberIdx = trips[idx].members.findIndex((m) => m.userId === userId);
    if (memberIdx === -1) throw new Error('You are not a member of this trip');

    trips[idx].members[memberIdx].preferences = preferences;
    trips[idx].members[memberIdx].preferencesSubmitted = true;
    await saveTrips(trips);
    console.log('localApi.savePreferences', { tripId, userId });
    return { trip: trips[idx] };
  },

  async savePlan(token: string, tripId: string, plan: TripPlan): Promise<{ trip: Trip }> {
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    trips[idx].plan = plan;
    trips[idx].status = 'planned';
    await saveTrips(trips);
    console.log('localApi.savePlan', { tripId });
    return { trip: trips[idx] };
  },

  async vote(token: string, tripId: string, itemId: string, vote: 'up' | 'down'): Promise<{ trip: Trip }> {
    const userId = token.replace('local_', '');
    const users = await getUsers();
    const user = users.find((u) => u.id === userId);
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    const existingIdx = trips[idx].votes.findIndex((v) => v.userId === userId && v.itemId === itemId);
    if (existingIdx !== -1) {
      trips[idx].votes[existingIdx].vote = vote;
    } else {
      trips[idx].votes.push({
        userId,
        userName: user?.name ?? 'Unknown',
        itemId,
        vote,
      });
    }
    await saveTrips(trips);
    console.log('localApi.vote', { tripId, itemId, vote });
    return { trip: trips[idx] };
  },

  async finalize(token: string, tripId: string, finalized: FinalizedChoices): Promise<{ trip: Trip }> {
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    trips[idx].finalized = finalized;
    trips[idx].status = 'finalized';
    await saveTrips(trips);
    console.log('localApi.finalize', { tripId });
    return { trip: trips[idx] };
  },

  async invite(token: string, tripId: string, email: string, role: TripMemberRole): Promise<{ trip: Trip; invite: TripInvite }> {
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    const users = await getUsers();
    const invitedUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    const invite: TripInvite = {
      id: generateId(),
      tripId,
      email,
      role,
      inviteToken: generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    trips[idx].invites.push(invite);

    if (invitedUser) {
      const alreadyMember = trips[idx].members.some((m) => m.userId === invitedUser.id);
      if (!alreadyMember) {
        trips[idx].members.push({
          id: generateId(),
          userId: invitedUser.id,
          name: invitedUser.name,
          email: invitedUser.email,
          avatar: invitedUser.avatar,
          role,
          joinedAt: new Date().toISOString(),
          preferencesSubmitted: false,
        });
        invite.status = 'accepted';
      }
    }

    await saveTrips(trips);
    console.log('localApi.invite', { tripId, email, role });
    return { trip: trips[idx], invite };
  },

  async acceptInvite(token: string, inviteToken: string): Promise<{ trip: Trip }> {
    const userId = token.replace('local_', '');
    const users = await getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const trips = await getTrips();
    for (const trip of trips) {
      const invite = trip.invites.find((inv) => inv.inviteToken === inviteToken && inv.status === 'pending');
      if (invite) {
        invite.status = 'accepted';
        const alreadyMember = trip.members.some((m) => m.userId === userId);
        if (!alreadyMember) {
          trip.members.push({
            id: generateId(),
            userId: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: invite.role,
            joinedAt: new Date().toISOString(),
            preferencesSubmitted: false,
          });
        }
        await saveTrips(trips);
        console.log('localApi.acceptInvite', { tripId: trip.id, userId });
        return { trip };
      }
    }
    throw new Error('Invite not found or already accepted');
  },
};
