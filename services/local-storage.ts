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
      createdBy: userId,
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
