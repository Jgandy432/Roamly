import { useState, useCallback, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { Trip, TripData, TripPlan, TripMember, AppUser, UserPreferences } from '@/types/trip';
import { generateId, generateInviteCode } from '@/utils/helpers';
import { generateFallbackPlan } from '@/utils/fallback-plan';

const STORAGE_KEY_USER = 'roamly_user';
const STORAGE_KEY_TRIPS = 'roamly_trips';

const tripPlanSchema = z.object({
  summary: z.object({
    destination: z.string(),
    recommended_dates: z.string(),
    total_nights: z.number(),
    group_size: z.number(),
    compatibility_score: z.number(),
    estimated_cost_per_person: z.object({ low: z.number(), high: z.number() }),
  }),
  lodging: z.array(z.object({
    name: z.string(),
    type: z.string(),
    area: z.string(),
    description: z.string(),
    price_per_night: z.number(),
    price_per_person_per_night: z.number(),
    highlights: z.array(z.string()),
    fits_all_budgets: z.boolean(),
    recommended: z.boolean(),
  })),
  flights: z.array(z.object({
    member_name: z.string(),
    airport: z.string(),
    airline: z.string(),
    departure_time: z.string(),
    type: z.string(),
    price_roundtrip: z.number(),
    notes: z.string(),
  })),
  itinerary: z.array(z.object({
    day: z.number(),
    date: z.string(),
    title: z.string(),
    morning: z.object({ time: z.string(), activity: z.string(), description: z.string(), cost: z.string() }),
    afternoon: z.object({ time: z.string(), activity: z.string(), description: z.string(), cost: z.string() }),
    evening: z.object({ time: z.string(), activity: z.string(), description: z.string(), cost: z.string() }),
  })),
  restaurants: z.array(z.object({
    name: z.string(),
    cuisine: z.string(),
    price_range: z.string(),
    meal: z.string(),
    description: z.string(),
    must_try_dish: z.string(),
    reservation_needed: z.boolean(),
  })),
  pro_tips: z.array(z.string()),
});

export const [TripProvider, useTrips] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [activeTripPlan, setActiveTripPlan] = useState<TripPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genProgress, setGenProgress] = useState<string>('');

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_USER);
      return stored ? JSON.parse(stored) as AppUser : null;
    },
  });

  const tripsQuery = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_TRIPS);
      return stored ? JSON.parse(stored) as Trip[] : [];
    },
  });

  const trips = tripsQuery.data ?? [];

  useEffect(() => {
    if (userQuery.data && !currentUser) {
      setCurrentUser(userQuery.data);
    }
  }, [userQuery.data]);

  const saveUser = useMutation({
    mutationFn: async (user: AppUser) => {
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.setQueryData(['user'], user);
    },
  });

  const saveTrips = useMutation({
    mutationFn: async (updatedTrips: Trip[]) => {
      await AsyncStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(updatedTrips));
      return updatedTrips;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['trips'], data);
    },
  });

  const login = useCallback((email: string, name: string) => {
    const user: AppUser = {
      id: generateId(),
      email,
      name,
      avatar: name.charAt(0).toUpperCase(),
    };
    saveUser.mutate(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    AsyncStorage.removeItem(STORAGE_KEY_USER);
    queryClient.setQueryData(['user'], null);
  }, []);

  const createTrip = useCallback((tripData: TripData): Trip => {
    if (!currentUser) throw new Error('Not logged in');
    const newTrip: Trip = {
      ...tripData,
      id: generateId(),
      inviteCode: generateInviteCode(),
      leaderId: currentUser.id,
      leaderName: currentUser.name,
      members: [{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: 'leader',
        preferencesSubmitted: false,
      }],
      status: 'collecting',
      createdAt: new Date().toISOString(),
      plan: null,
    };
    const updated = [...trips, newTrip];
    saveTrips.mutate(updated);
    setActiveTrip(newTrip);
    return newTrip;
  }, [currentUser, trips]);

  const joinTrip = useCallback((code: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Not logged in' };
    const trip = trips.find((t) => t.inviteCode === code);
    if (!trip) return { success: false, message: 'Invalid invite code' };
    if (trip.members.find((m) => m.id === currentUser.id)) {
      return { success: false, message: "You're already in this trip!" };
    }
    const updatedTrip: Trip = {
      ...trip,
      members: [...trip.members, {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: 'member',
        preferencesSubmitted: false,
      }],
    };
    const updated = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
    saveTrips.mutate(updated);
    setActiveTrip(updatedTrip);
    return { success: true, message: `Joined "${trip.name}"!` };
  }, [currentUser, trips]);

  const submitPreferences = useCallback((prefs: UserPreferences) => {
    if (!activeTrip || !currentUser) return;
    const updatedMembers = activeTrip.members.map((m) =>
      m.id === currentUser.id ? { ...m, preferencesSubmitted: true, preferences: prefs } : m
    );
    const updatedTrip: Trip = { ...activeTrip, members: updatedMembers };
    const updated = trips.map((t) => (t.id === activeTrip.id ? updatedTrip : t));
    saveTrips.mutate(updated);
    setActiveTrip(updatedTrip);
  }, [activeTrip, currentUser, trips]);

  const addDemoMembers = useCallback(() => {
    if (!activeTrip) return;
    const demoMembers: TripMember[] = [
      { id: generateId(), name: 'Sarah K.', email: 'sarah@demo.com', avatar: 'S', role: 'member', preferencesSubmitted: true,
        preferences: { budgetMin: 800, budgetMax: 1500, airport: "ORD - Chicago O'Hare", dateStart: '2026-11-15', dateEnd: '2026-11-18', interests: ['food', 'beaches', 'shopping', 'wellness'] } },
      { id: generateId(), name: 'Mike R.', email: 'mike@demo.com', avatar: 'M', role: 'member', preferencesSubmitted: true,
        preferences: { budgetMin: 1000, budgetMax: 2000, airport: 'LAX - Los Angeles', dateStart: '2026-11-14', dateEnd: '2026-11-18', interests: ['nightlife', 'adventure', 'food', 'beaches'] } },
      { id: generateId(), name: 'Dan P.', email: 'dan@demo.com', avatar: 'D', role: 'member', preferencesSubmitted: true,
        preferences: { budgetMin: 600, budgetMax: 1200, airport: 'EWR - Newark', dateStart: '2026-11-14', dateEnd: '2026-11-19', interests: ['hiking', 'food', 'photography', 'history'] } },
      { id: generateId(), name: 'Jess T.', email: 'jess@demo.com', avatar: 'J', role: 'member', preferencesSubmitted: true,
        preferences: { budgetMin: 900, budgetMax: 1800, airport: 'BOS - Boston Logan', dateStart: '2026-11-13', dateEnd: '2026-11-18', interests: ['beaches', 'nightlife', 'wellness', 'wine'] } },
    ];
    const updatedTrip: Trip = { ...activeTrip, members: [...activeTrip.members, ...demoMembers] };
    const updated = trips.map((t) => (t.id === activeTrip.id ? updatedTrip : t));
    saveTrips.mutate(updated);
    setActiveTrip(updatedTrip);
  }, [activeTrip, trips]);

  const generatePlan = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!activeTrip) return { success: false, message: 'No active trip' };
    setIsGenerating(true);
    setGenProgress('Analyzing group preferences...');
    setActiveTripPlan(null);

    const members = activeTrip.members.filter((m) => m.preferencesSubmitted);
    const memberSummary = members.map((m) => ({
      name: m.name,
      budget: `$${m.preferences?.budgetMin}-$${m.preferences?.budgetMax}`,
      airport: m.preferences?.airport ?? 'Unknown',
      dates: `${m.preferences?.dateStart} to ${m.preferences?.dateEnd}`,
      interests: m.preferences?.interests?.join(', ') ?? 'None',
    }));

    const tripPrefs = [
      activeTrip.budget ? `BUDGET PER PERSON: ${activeTrip.budget}` : '',
      activeTrip.tripTypes?.length ? `TRIP TYPES: ${activeTrip.tripTypes.join(', ')}${activeTrip.tripTypeOther ? `, ${activeTrip.tripTypeOther}` : ''}` : '',
      activeTrip.vibe ? `VIBE: ${activeTrip.vibe}` : '',
      activeTrip.accommodation ? `ACCOMMODATION PREFERENCE: ${activeTrip.accommodation}` : '',
      activeTrip.dietaryNeeds?.length ? `DIETARY NEEDS: ${activeTrip.dietaryNeeds.join(', ')}${activeTrip.dietaryOther ? `, ${activeTrip.dietaryOther}` : ''}` : '',
      activeTrip.mustHave ? `MUST HAVE: ${activeTrip.mustHave}` : '',
      activeTrip.dealBreaker ? `DEAL BREAKERS: ${activeTrip.dealBreaker}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `You are Roamly, an AI group trip planner. Generate a complete trip plan.

TRIP: "${activeTrip.name}"
DESTINATION: ${activeTrip.destination || "Recommend based on group preferences"}
DATE WINDOW: ${activeTrip.dateStart || "Flexible"} to ${activeTrip.dateEnd || "Flexible"}
CONSTRAINTS: ${activeTrip.constraints || "None"}
${tripPrefs ? `\n${tripPrefs}` : ''}

GROUP:
${memberSummary.map((m) => `- ${m.name}: Budget ${m.budget}, Airport: ${m.airport}, Available: ${m.dates}, Interests: ${m.interests}`).join('\n')}

Generate a COMPLETE trip plan with real place names, realistic prices, practical timing. Include 3 lodging options, flights for each member, a full day-by-day itinerary, at least 8 restaurants, and 5 pro tips.`;

    try {
      setGenProgress('Finding best lodging options...');

      const plan = await generateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: tripPlanSchema,
      });

      setActiveTripPlan(plan);
      const updatedTrip: Trip = { ...activeTrip, status: 'planned', plan };
      const updated = trips.map((t) => (t.id === activeTrip.id ? updatedTrip : t));
      saveTrips.mutate(updated);
      setActiveTrip(updatedTrip);
      setIsGenerating(false);
      setGenProgress('');
      return { success: true, message: 'Trip plan generated!' };
    } catch (err) {
      console.error('Generation error:', err);
      const fallback = generateFallbackPlan(activeTrip);
      setActiveTripPlan(fallback);
      const updatedTrip: Trip = { ...activeTrip, status: 'planned', plan: fallback };
      const updated = trips.map((t) => (t.id === activeTrip.id ? updatedTrip : t));
      saveTrips.mutate(updated);
      setActiveTrip(updatedTrip);
      setIsGenerating(false);
      setGenProgress('');
      return { success: false, message: 'Using sample plan (AI unavailable)' };
    }
  }, [activeTrip, trips]);

  return {
    currentUser,
    trips,
    activeTrip,
    activeTripPlan,
    isGenerating,
    genProgress,
    isLoading: userQuery.isLoading || tripsQuery.isLoading,
    login,
    logout,
    createTrip,
    joinTrip,
    submitPreferences,
    addDemoMembers,
    generatePlan,
    setActiveTrip,
    setActiveTripPlan,
  };
});
