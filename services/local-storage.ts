import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import {
  AppUser,
  AuthResponse,
  FinalizedChoices,
  Trip,
  TripData,
  TripInvite,
  TripMember,
  TripMemberRole,
  TripPlan,
  UserPreferences,
} from '@/types/trip';

const TRIPS_KEY = 'roamly_trips';

const DUMMY_NAMES = [
  'Alex Rivera', 'Maya Chen', 'Jordan Lee', 'Priya Patel', 'Sam Brooks',
  'Olivia Kim', 'Marcus Johnson', 'Zara Ahmed', 'Tyler Nguyen', 'Chloe Davis',
  'Ethan Park', 'Sofia Martinez', 'Liam O\'Brien', 'Aisha Khan', 'Noah Williams',
  'Isabella Torres', 'Kai Nakamura', 'Emma Johansson', 'Diego Santos', 'Mia Thompson',
];

const AIRPORTS = ['JFK', 'LAX', 'ORD', 'ATL', 'SFO', 'MIA', 'DFW', 'SEA', 'BOS', 'DEN'];
const ACCOM_TYPES = ['hotel', 'airbnb', 'hostel', 'resort'];
const ACCOM_MUST_HAVES = ['wifi', 'pool', 'kitchen', 'parking', 'gym', 'washer', 'air conditioning', 'pet friendly'];
const ACTIVITY_INTERESTS = ['beach', 'hiking', 'nightlife', 'museums', 'food tours', 'shopping', 'water sports', 'photography', 'live music', 'spa', 'sightseeing', 'adventure sports'];
const DINING_STYLES = ['casual', 'fine dining', 'street food', 'mix of everything'];
const DIETARY = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'dairy-free', 'nut allergy'];
const BUDGET_FLEX = ['strict', 'flexible', 'very flexible'];
const FLIGHT_TIMES = ['morning', 'afternoon', 'evening'];
const NONSTOP_OPTIONS = ['yes', 'flexible'];
const MUST_HAVES = ['Good Wi-Fi everywhere', 'Beach access', 'Central location', 'Walkable area', 'Near nightlife', 'Quiet neighborhood', 'Great food scene', 'Nature nearby'];
const DEAL_BREAKERS = ['Shared bathrooms', 'No A/C', 'Far from city center', 'No public transit', 'Noisy area', 'Limited food options', 'Long layovers', 'No Wi-Fi'];
const MUST_DO_ACTIVITIES = ['Visit the main landmark', 'Try local street food', 'Sunset boat tour', 'Hike to the viewpoint', 'Visit the night market', 'Snorkeling trip', 'Cooking class', 'City walking tour'];
const WONT_DO_ACTIVITIES = ['Bungee jumping', 'Extreme heights', 'Long bus rides', 'Crowded tourist traps', 'Early morning tours', 'Camping', 'Cave diving', 'Nothing specific'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function generateDummyDates(startDate?: string, _endDate?: string): string[] {
  const count = randBetween(2, 3);
  const base = startDate ? new Date(startDate) : new Date();
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + randBetween(-2, 5));
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function generateDummyPreferences(startDate?: string, endDate?: string): UserPreferences {
  return {
    availableDates: generateDummyDates(startDate, endDate),
    flightAirport: pickRandom(AIRPORTS),
    flightNonstop: pickRandom(NONSTOP_OPTIONS),
    flightDepartTime: pickRandom(FLIGHT_TIMES),
    flightBudget: randBetween(200, 800),
    accommodationType: pickRandom(ACCOM_TYPES),
    accommodationNightlyBudget: randBetween(50, 300),
    accommodationMustHaves: pickRandomN(ACCOM_MUST_HAVES, 2, 3),
    needsRentalCar: pickRandom(['yes', 'no']),
    isDriver: pickRandom(['yes', 'no']),
    vehiclePreference: pickRandom(['sedan', 'suv', 'van', 'compact']),
    activityInterests: pickRandomN(ACTIVITY_INTERESTS, 2, 4),
    activityDailyBudget: randBetween(30, 150),
    activityMustDo: pickRandom(MUST_DO_ACTIVITIES),
    activityWontDo: pickRandom(WONT_DO_ACTIVITIES),
    diningStyle: pickRandom(DINING_STYLES),
    dietaryRestrictions: pickRandomN(DIETARY, 0, 2),
    foodDailyBudget: randBetween(30, 120),
    foodMustHaves: pickRandomN(['local cuisine', 'seafood', 'brunch spots', 'coffee shops', 'rooftop bars'], 1, 2),
    totalBudget: randBetween(1000, 5000),
    budgetFlexibility: pickRandom(BUDGET_FLEX),
    mustHave: pickRandom(MUST_HAVES),
    dealBreaker: pickRandom(DEAL_BREAKERS),
  };
}

function generateDummyMembers(count: number, startDate?: string, endDate?: string): TripMember[] {
  const shuffledNames = [...DUMMY_NAMES].sort(() => Math.random() - 0.5);
  const members: TripMember[] = [];
  for (let i = 0; i < count; i++) {
    const name = shuffledNames[i % shuffledNames.length];
    const emailName = name.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, '.');
    const uid = generateId();
    members.push({
      id: generateId(),
      userId: uid,
      name,
      email: `${emailName}@example.com`,
      avatar: '',
      role: 'editor',
      joinedAt: new Date().toISOString(),
      preferencesSubmitted: true,
      preferences: generateDummyPreferences(startDate, endDate),
    });
  }
  return members;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getTrips(): Promise<Trip[]> {
  const raw = await AsyncStorage.getItem(TRIPS_KEY);
  return raw ? (JSON.parse(raw) as Trip[]) : [];
}

async function saveTrips(trips: Trip[]): Promise<void> {
  await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

function supabaseUserToAppUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string }): AppUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? '',
    name: (meta.name as string) ?? (meta.full_name as string) ?? '',
    avatar: (meta.avatar as string) ?? '',
    hasCompletedOnboarding: (meta.has_completed_onboarding as boolean) ?? false,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

export const localApi = {
  async signup(input: { name: string; email: string; password: string }): Promise<AuthResponse> {
    console.log('localApi.signup via Supabase', { email: input.email });
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          full_name: input.name,
          avatar: '',
          has_completed_onboarding: false,
        },
      },
    });

    if (error) {
      console.log('Supabase signup error:', error.message);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Signup succeeded but no user was returned');
    }

    if (!data.session) {
      console.log('Supabase signup: no session returned, email confirmation may be required');
      const appUser = supabaseUserToAppUser(data.user);
      return { session: { token: `pending_${data.user.id}`, user: appUser } };
    }

    const appUser = supabaseUserToAppUser(data.user);
    console.log('Supabase signup success', { userId: data.user.id });
    return { session: { token: data.session.access_token, user: appUser } };
  },

  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    console.log('localApi.login via Supabase', { email: input.email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      console.log('Supabase login error:', error.message);
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login succeeded but no session was returned');
    }

    const appUser = supabaseUserToAppUser(data.user);
    console.log('Supabase login success', { userId: data.user.id });
    return { session: { token: data.session.access_token, user: appUser } };
  },

  async me(_token: string): Promise<{ user: AppUser }> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      console.log('Supabase getUser error:', error?.message);
      throw new Error('User not found');
    }
    return { user: supabaseUserToAppUser(data.user) };
  },

  async logout(_token: string): Promise<{ success: boolean }> {
    console.log('localApi.logout via Supabase');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('Supabase signOut error:', error.message);
    }
    return { success: true };
  },

  async completeOnboarding(_token: string): Promise<{ user: AppUser }> {
    console.log('localApi.completeOnboarding via Supabase');
    const { data, error } = await supabase.auth.updateUser({
      data: { has_completed_onboarding: true },
    });

    if (error || !data.user) {
      console.log('Supabase updateUser error:', error?.message);
      throw new Error('Failed to complete onboarding');
    }

    return { user: supabaseUserToAppUser(data.user) };
  },

  async listTrips(_token: string): Promise<{ trips: Trip[] }> {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) {
      console.log('localApi.listTrips: no authenticated user');
      return { trips: [] };
    }

    const trips = await getTrips();
    const userTrips = trips.filter(
      (t) => t.createdBy === userId || t.members.some((m) => m.userId === userId),
    );
    console.log('localApi.listTrips', { userId, count: userTrips.length });
    return { trips: userTrips };
  },

  async createTrip(_token: string, tripData: TripData): Promise<{ trip: Trip }> {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) throw new Error('Not authenticated');

    const appUser = supabaseUserToAppUser(user);

    const ownerMember: TripMember = {
      id: generateId(),
      userId: appUser.id,
      name: appUser.name,
      email: appUser.email,
      avatar: appUser.avatar,
      role: 'owner',
      joinedAt: new Date().toISOString(),
      preferencesSubmitted: false,
    };

    const dummyCount = Math.max(0, (tripData.groupSize || 1) - 1);
    const dummyMembers = dummyCount > 0
      ? generateDummyMembers(dummyCount, tripData.startDate, tripData.endDate)
      : [];
    console.log('localApi.createTrip generating', dummyCount, 'dummy members');

    const trip: Trip = {
      id: generateId(),
      name: tripData.name,
      destination: tripData.destination,
      groupSize: tripData.groupSize,
      constraints: tripData.constraints,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      description: tripData.description,
      createdBy: appUser.id,
      createdAt: new Date().toISOString(),
      members: [ownerMember, ...dummyMembers],
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

  async savePreferences(_token: string, tripId: string, preferences: UserPreferences): Promise<{ trip: Trip }> {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) throw new Error('Not authenticated');

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

  async savePlan(_token: string, tripId: string, plan: TripPlan): Promise<{ trip: Trip }> {
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    trips[idx].plan = plan;
    trips[idx].status = 'planned';
    await saveTrips(trips);
    console.log('localApi.savePlan', { tripId });
    return { trip: trips[idx] };
  },

  async vote(_token: string, tripId: string, itemId: string, vote: 'up' | 'down'): Promise<{ trip: Trip }> {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    const userId = user?.id;
    if (!userId) throw new Error('Not authenticated');

    const appUser = supabaseUserToAppUser(user);
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    const existingIdx = trips[idx].votes.findIndex((v) => v.userId === userId && v.itemId === itemId);
    if (existingIdx !== -1) {
      trips[idx].votes[existingIdx].vote = vote;
    } else {
      trips[idx].votes.push({
        userId,
        userName: appUser.name ?? 'Unknown',
        itemId,
        vote,
      });
    }
    await saveTrips(trips);
    console.log('localApi.vote', { tripId, itemId, vote });
    return { trip: trips[idx] };
  },

  async finalize(_token: string, tripId: string, finalized: FinalizedChoices): Promise<{ trip: Trip }> {
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    trips[idx].finalized = finalized;
    trips[idx].status = 'finalized';
    await saveTrips(trips);
    console.log('localApi.finalize', { tripId });
    return { trip: trips[idx] };
  },

  async invite(_token: string, tripId: string, email: string, role: TripMemberRole): Promise<{ trip: Trip; invite: TripInvite }> {
    const trips = await getTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

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
    await saveTrips(trips);
    console.log('localApi.invite', { tripId, email, role });
    return { trip: trips[idx], invite };
  },

  async acceptInvite(_token: string, inviteToken: string): Promise<{ trip: Trip }> {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) throw new Error('Not authenticated');

    const appUser = supabaseUserToAppUser(user);
    const trips = await getTrips();
    for (const trip of trips) {
      const invite = trip.invites.find((inv) => inv.inviteToken === inviteToken && inv.status === 'pending');
      if (invite) {
        invite.status = 'accepted';
        const alreadyMember = trip.members.some((m) => m.userId === appUser.id);
        if (!alreadyMember) {
          trip.members.push({
            id: generateId(),
            userId: appUser.id,
            name: appUser.name,
            email: appUser.email,
            avatar: appUser.avatar,
            role: invite.role,
            joinedAt: new Date().toISOString(),
            preferencesSubmitted: false,
          });
        }
        await saveTrips(trips);
        console.log('localApi.acceptInvite', { tripId: trip.id, userId: appUser.id });
        return { trip };
      }
    }
    throw new Error('Invite not found or already accepted');
  },
};
