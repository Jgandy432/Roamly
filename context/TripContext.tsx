import { useState, useCallback, useEffect, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

import { api } from '@/services/api';
import { generateFallbackPlan } from '@/utils/fallback-plan';
import { AppUser, AuthSession, FinalizedChoices, Trip, TripData, TripMember, TripPlan, TripMemberRole, UserPreferences } from '@/types/trip';

const STORAGE_KEY_SESSION = 'roamly_session';

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

function formatMemberPrefs(member: TripMember): string {
  const prefs = member.preferences;
  if (!prefs) {
    return `- ${member.name}: No preferences submitted`;
  }

  const lines: string[] = [`- ${member.name}:`];
  if (prefs.availableDates.length) lines.push(`  Available dates: ${prefs.availableDates.join(', ')}`);
  if (prefs.flightAirport) lines.push(`  Airport: ${prefs.flightAirport}`);
  if (prefs.flightNonstop) lines.push(`  Nonstop preference: ${prefs.flightNonstop}`);
  if (prefs.flightDepartTime) lines.push(`  Departure time: ${prefs.flightDepartTime}`);
  if (prefs.flightBudget) lines.push(`  Flight budget: $${prefs.flightBudget}`);
  if (prefs.accommodationType) lines.push(`  Accommodation: ${prefs.accommodationType}`);
  if (prefs.accommodationNightlyBudget) lines.push(`  Nightly budget: $${prefs.accommodationNightlyBudget}/person`);
  if (prefs.accommodationMustHaves.length) lines.push(`  Accommodation must-haves: ${prefs.accommodationMustHaves.join(', ')}`);
  if (prefs.activityInterests.length) lines.push(`  Activity interests: ${prefs.activityInterests.join(', ')}`);
  if (prefs.activityDailyBudget) lines.push(`  Daily activity budget: $${prefs.activityDailyBudget}`);
  if (prefs.dietaryRestrictions.length) lines.push(`  Dietary restrictions: ${prefs.dietaryRestrictions.join(', ')}`);
  if (prefs.foodDailyBudget) lines.push(`  Daily food budget: $${prefs.foodDailyBudget}`);
  if (prefs.totalBudget) lines.push(`  Total trip budget: $${prefs.totalBudget}`);
  if (prefs.mustHave) lines.push(`  Must have: ${prefs.mustHave}`);
  if (prefs.dealBreaker) lines.push(`  Deal breaker: ${prefs.dealBreaker}`);
  return lines.join('\n');
}

function pickTripById(trips: Trip[], tripId: string | null): Trip | null {
  if (!tripId) return null;
  return trips.find((trip) => trip.id === tripId) ?? null;
}

export const [TripProvider, useTrips] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [activeTripPlan, setActiveTripPlan] = useState<TripPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genProgress, setGenProgress] = useState<string>('');

  const sessionQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_SESSION);
      return stored ? JSON.parse(stored) as AuthSession : null;
    },
  });

  useEffect(() => {
    if (sessionQuery.data) {
      console.log('Hydrating saved session', { userId: sessionQuery.data.user.id, email: sessionQuery.data.user.email });
      setSession(sessionQuery.data);
      setCurrentUser(sessionQuery.data.user);
    }
  }, [sessionQuery.data]);

  const tripsQuery = useQuery({
    queryKey: ['trips', session?.token ?? 'guest'],
    enabled: !!session?.token,
    queryFn: async () => {
      if (!session?.token) return [] as Trip[];
      const response = await api.listTrips(session.token);
      return response.trips;
    },
  });

  const trips = useMemo<Trip[]>(() => tripsQuery.data ?? [], [tripsQuery.data]);
  const activeTrip = useMemo<Trip | null>(() => pickTripById(trips, activeTripId), [activeTripId, trips]);

  useEffect(() => {
    if (activeTrip?.plan) {
      setActiveTripPlan(activeTrip.plan);
    }
  }, [activeTrip]);

  const persistSession = useCallback(async (nextSession: AuthSession | null) => {
    if (nextSession) {
      await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
    }
  }, []);

  const authMutation = useMutation({
    mutationFn: async (input: { mode: 'login' | 'signup'; name?: string; email: string; password: string }) => {
      if (input.mode === 'signup') {
        return api.signup({ name: input.name ?? '', email: input.email, password: input.password });
      }
      return api.login({ email: input.email, password: input.password });
    },
    onSuccess: async (response) => {
      console.log('Auth success', { userId: response.session.user.id, email: response.session.user.email });
      setSession(response.session);
      setCurrentUser(response.session.user);
      await persistSession(response.session);
      queryClient.setQueryData(['auth-session'], response.session);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (session?.token) {
        await api.logout(session.token);
      }
      return true;
    },
    onSuccess: async () => {
      console.log('Logging out current user');
      setSession(null);
      setCurrentUser(null);
      setActiveTripId(null);
      setActiveTripPlan(null);
      await persistSession(null);
      queryClient.setQueryData(['auth-session'], null);
      queryClient.setQueryData(['trips', 'guest'], []);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const createTripMutation = useMutation({
    mutationFn: async (tripData: TripData) => {
      if (!session?.token) throw new Error('Not logged in');
      return api.createTrip(session.token, tripData);
    },
    onSuccess: ({ trip }) => {
      setActiveTripId(trip.id);
      setActiveTripPlan(trip.plan);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      if (!session?.token || !activeTripId) throw new Error('No active trip');
      return api.savePreferences(session.token, activeTripId, preferences);
    },
    onSuccess: ({ trip }) => {
      setActiveTripId(trip.id);
      setActiveTripPlan(trip.plan);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async (plan: TripPlan) => {
      if (!session?.token || !activeTripId) throw new Error('No active trip');
      return api.savePlan(session.token, activeTripId, plan);
    },
    onSuccess: ({ trip }) => {
      setActiveTripId(trip.id);
      setActiveTripPlan(trip.plan);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (input: { itemId: string; vote: 'up' | 'down' }) => {
      if (!session?.token || !activeTripId) throw new Error('No active trip');
      return api.vote(session.token, activeTripId, input.itemId, input.vote);
    },
    onSuccess: ({ trip }) => {
      setActiveTripId(trip.id);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (finalized: FinalizedChoices) => {
      if (!session?.token || !activeTripId) throw new Error('No active trip');
      return api.finalize(session.token, activeTripId, finalized);
    },
    onSuccess: ({ trip }) => {
      setActiveTripId(trip.id);
      setActiveTripPlan(trip.plan);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (input: { email: string; role: TripMemberRole }) => {
      if (!session?.token || !activeTripId) throw new Error('No active trip');
      return api.invite(session.token, activeTripId, input.email, input.role);
    },
    onSuccess: ({ trip }) => {
      setActiveTripId(trip.id);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async () => {
      if (!session?.token) throw new Error('Not logged in');
      return api.completeOnboarding(session.token);
    },
    onSuccess: async ({ user }) => {
      const nextSession = session ? { ...session, user } : null;
      setCurrentUser(user);
      if (nextSession) {
        setSession(nextSession);
        await persistSession(nextSession);
        queryClient.setQueryData(['auth-session'], nextSession);
      }
    },
  });

  const login = useCallback(async (email: string, password: string) => {
    const response = await authMutation.mutateAsync({ mode: 'login', email, password });
    return response.session.user;
  }, [authMutation]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const response = await authMutation.mutateAsync({ mode: 'signup', name, email, password });
    return response.session.user;
  }, [authMutation]);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const createTrip = useCallback(async (tripData: TripData) => {
    const response = await createTripMutation.mutateAsync(tripData);
    return response.trip;
  }, [createTripMutation]);

  const submitPreferences = useCallback(async (preferences: UserPreferences) => {
    await savePreferencesMutation.mutateAsync(preferences);
  }, [savePreferencesMutation]);

  const castVote = useCallback((itemId: string, vote: 'up' | 'down') => {
    voteMutation.mutate({ itemId, vote });
  }, [voteMutation]);

  const inviteCollaborator = useCallback(async (email: string, role: TripMemberRole) => {
    const response = await inviteMutation.mutateAsync({ email, role });
    return response.invite;
  }, [inviteMutation]);

  const generatePlan = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!activeTrip) return { success: false, message: 'No active trip' };
    setIsGenerating(true);
    setGenProgress('Analyzing real collaborator preferences...');
    setActiveTripPlan(null);

    const members = activeTrip.members;
    const memberDetails = members.map((member) => formatMemberPrefs(member)).join('\n\n');
    const prompt = `You are Roamly, an AI group trip planner. Generate a complete trip plan based on individual member preferences.\n\nTRIP: "${activeTrip.name}"\nDESTINATION: ${activeTrip.destination || 'Recommend based on group preferences'}\nGROUP SIZE: ${members.length}\n\nCOLLABORATOR PREFERENCES:\n${memberDetails}\n\nGenerate 3 lodging options, exactly one flight for each collaborator (${members.map((member) => member.name).join(', ')}), a full itinerary, restaurants, and practical cost estimates.`;

    try {
      const plan = await generateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: tripPlanSchema,
      });
      await savePlanMutation.mutateAsync(plan);
      setActiveTripPlan(plan);
      setIsGenerating(false);
      setGenProgress('');
      return { success: true, message: 'Trip plan generated for your real collaborator group.' };
    } catch (error) {
      console.log('AI plan generation failed, using fallback', { message: error instanceof Error ? error.message : 'unknown' });
      const fallback = generateFallbackPlan(activeTrip);
      await savePlanMutation.mutateAsync(fallback);
      setActiveTripPlan(fallback);
      setIsGenerating(false);
      setGenProgress('');
      return { success: false, message: 'Using fallback plan while AI is unavailable.' };
    }
  }, [activeTrip, savePlanMutation]);

  const finalizePlan = useCallback(async () => {
    if (!activeTrip?.plan) return;

    const plan = activeTrip.plan;
    const tripVotes = activeTrip.votes;
    const confirmed: string[] = [];
    const getScore = (itemId: string): number => {
      const itemVotes = tripVotes.filter((vote) => vote.itemId === itemId);
      const up = itemVotes.filter((vote) => vote.vote === 'up').length;
      const down = itemVotes.filter((vote) => vote.vote === 'down').length;
      return up - down;
    };

    let bestLodgingIdx = 0;
    let bestLodgingScore = -Infinity;
    plan.lodging.forEach((option, index) => {
      const score = getScore(`lodging-${index}`) + (option.recommended ? 0.5 : 0);
      if (score > bestLodgingScore) {
        bestLodgingScore = score;
        bestLodgingIdx = index;
      }
    });
    confirmed.push(`lodging-${bestLodgingIdx}`);

    let bestFlightIdx = 0;
    let bestFlightScore = -Infinity;
    plan.flights.forEach((option, index) => {
      const score = getScore(`flight-${index}`) + (index === 0 ? 0.25 : 0);
      if (score > bestFlightScore) {
        bestFlightScore = score;
        bestFlightIdx = index;
      }
    });
    confirmed.push(`flight-${bestFlightIdx}`);

    plan.itinerary.forEach((day) => {
      let bestDayItemId = `activity-${day.day}-morning`;
      let bestDayScore = -Infinity;
      (['morning', 'afternoon', 'evening'] as const).forEach((slot, slotIndex) => {
        const itemId = `activity-${day.day}-${slot}`;
        const score = getScore(itemId) + (slotIndex === 0 ? 0.2 : 0);
        if (score > bestDayScore) {
          bestDayScore = score;
          bestDayItemId = itemId;
        }
      });
      confirmed.push(bestDayItemId);
    });

    const finalized: FinalizedChoices = {
      confirmedItems: confirmed,
      finalizedAt: new Date().toISOString(),
      summary: `${plan.summary.total_nights} nights in ${plan.summary.destination} are locked in for your real collaborator group.`,
    };

    await finalizeMutation.mutateAsync(finalized);
  }, [activeTrip, finalizeMutation]);

  const completeOnboarding = useCallback(() => {
    onboardingMutation.mutate();
  }, [onboardingMutation]);

  const setActiveTrip = useCallback((trip: Trip | null) => {
    setActiveTripId(trip?.id ?? null);
    setActiveTripPlan(trip?.plan ?? null);
  }, []);

  return useMemo(() => ({
    currentUser,
    session,
    trips,
    activeTrip,
    activeTripPlan,
    isGenerating,
    genProgress,
    isLoading: sessionQuery.isLoading || tripsQuery.isLoading || authMutation.isPending,
    login,
    signup,
    logout,
    createTrip,
    submitPreferences,
    castVote,
    generatePlan,
    finalizePlan,
    completeOnboarding,
    inviteCollaborator,
    isAuthLoading: authMutation.isPending,
    isSavingTrip: createTripMutation.isPending,
    setActiveTrip,
    setActiveTripPlan,
  }), [
    activeTrip,
    activeTripPlan,
    authMutation.isPending,
    castVote,
    completeOnboarding,
    createTrip,
    createTripMutation.isPending,
    currentUser,
    finalizePlan,
    genProgress,
    generatePlan,
    inviteCollaborator,
    isGenerating,
    login,
    logout,
    session,
    sessionQuery.isLoading,
    setActiveTrip,
    signup,
    submitPreferences,
    trips,
    tripsQuery.isLoading,
  ]);
});
