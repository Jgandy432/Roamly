export interface UserPreferences {
  availableDates: string[];
  flightAirport: string;
  flightNonstop: string;
  flightDepartTime: string;
  flightBudget: number;
  accommodationType: string;
  accommodationNightlyBudget: number;
  accommodationMustHaves: string[];
  needsRentalCar: string;
  isDriver: string;
  vehiclePreference: string;
  activityInterests: string[];
  activityDailyBudget: number;
  activityMustDo: string;
  activityWontDo: string;
  diningStyle: string;
  dietaryRestrictions: string[];
  foodDailyBudget: number;
  foodMustHaves: string[];
  totalBudget: number;
  budgetFlexibility: string;
  mustHave: string;
  dealBreaker: string;
}

export interface TripMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'leader' | 'member';
  preferencesSubmitted: boolean;
  preferences?: UserPreferences;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface TimeSlot {
  time: string;
  activity: string;
  description: string;
  cost: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  morning: TimeSlot;
  afternoon: TimeSlot;
  evening: TimeSlot;
}

export interface LodgingOption {
  name: string;
  type: string;
  area: string;
  description: string;
  price_per_night: number;
  price_per_person_per_night: number;
  highlights: string[];
  fits_all_budgets: boolean;
  recommended: boolean;
}

export interface FlightOption {
  member_name: string;
  airport: string;
  airline: string;
  departure_time: string;
  type: string;
  price_roundtrip: number;
  notes: string;
}

export interface Restaurant {
  name: string;
  cuisine: string;
  price_range: string;
  meal: string;
  description: string;
  must_try_dish: string;
  reservation_needed: boolean;
}

export interface TripPlanSummary {
  destination: string;
  recommended_dates: string;
  total_nights: number;
  group_size: number;
  compatibility_score: number;
  estimated_cost_per_person: { low: number; high: number };
}

export interface TripPlan {
  summary: TripPlanSummary;
  lodging: LodgingOption[];
  flights: FlightOption[];
  itinerary: ItineraryDay[];
  restaurants: Restaurant[];
  pro_tips: string[];
}

export interface TripData {
  name: string;
  destination: string;
  groupSize: number;
  constraints: string;
}

export interface Trip extends TripData {
  id: string;
  inviteCode: string;
  leaderId: string;
  leaderName: string;
  members: TripMember[];
  status: 'collecting' | 'planned' | 'completed';
  createdAt: string;
  plan: TripPlan | null;
}
