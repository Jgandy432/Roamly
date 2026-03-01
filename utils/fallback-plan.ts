import { Trip, TripPlan } from '@/types/trip';

export function generateFallbackPlan(trip: Trip): TripPlan {
  const dest = trip.destination === 'AI to recommend' ? 'Tulum, Mexico' : trip.destination;
  return {
    summary: {
      destination: dest,
      recommended_dates: 'Nov 14-18, 2026',
      total_nights: 4,
      group_size: trip.members.length,
      compatibility_score: 87,
      estimated_cost_per_person: { low: 950, high: 1400 },
    },
    lodging: [
      { name: 'Villa Paraiso Tulum', type: 'Airbnb', area: 'Beach Zone', description: 'Stunning 4BR villa with private pool, 2 min walk to beach. Perfect for groups with open-air living spaces and a rooftop terrace.', price_per_night: 380, price_per_person_per_night: 63, highlights: ['Private pool', 'Beach access', 'Rooftop terrace'], fits_all_budgets: true, recommended: true },
      { name: 'Kanan Tulum Hotel', type: 'Boutique Hotel', area: 'Centro', description: 'Stylish boutique hotel with cenote-inspired pool. Connected rooms available for groups, walking distance to restaurants.', price_per_night: 520, price_per_person_per_night: 87, highlights: ['Cenote pool', 'Restaurant on-site', 'Bike rentals'], fits_all_budgets: true, recommended: false },
      { name: 'Be Tulum Resort', type: 'Resort', area: 'Beach Road', description: 'Luxury eco-resort with spa, beach club, and multiple dining options. Premium experience with jungle-meets-ocean aesthetic.', price_per_night: 890, price_per_person_per_night: 148, highlights: ['Spa & wellness', 'Beach club', 'Fine dining'], fits_all_budgets: false, recommended: false },
    ],
    flights: trip.members.filter((m) => m.preferencesSubmitted).map((m) => ({
      member_name: m.name,
      airport: m.preferences?.flightAirport?.split(' - ')[0] || 'EWR',
      airline: 'JetBlue',
      departure_time: '7:30 AM',
      type: '1 Stop (MIA)',
      price_roundtrip: 285 + Math.floor(Math.random() * 100),
      notes: 'Book 6+ weeks out for best price',
    })),
    itinerary: [
      { day: 1, date: 'Thursday', title: 'Arrival & Beach Vibes', morning: { time: '11:00 AM', activity: 'Arrive & Check In', description: 'Settle into Villa Paraiso, quick grocery run', cost: '$30/group' }, afternoon: { time: '2:00 PM', activity: 'Beach Time', description: 'Relax at Playa Paraiso, rent beach beds', cost: '$15/person' }, evening: { time: '7:00 PM', activity: 'Welcome Dinner at Hartwood', description: 'Open-fire cooking, farm-to-table. Reserve 2 weeks ahead.', cost: '$45/person' } },
      { day: 2, date: 'Friday', title: 'Cenote & Culture Day', morning: { time: '8:30 AM', activity: 'Cenote Sac Actun', description: 'Swim in crystal-clear underground cenote, arrive early', cost: '$25/person' }, afternoon: { time: '1:00 PM', activity: 'Tulum Ruins', description: 'Clifftop Mayan ruins overlooking the Caribbean', cost: '$5/person' }, evening: { time: '7:30 PM', activity: 'Dinner at Arca + Mezcal Bar', description: 'Modern Mexican tasting menu followed by cocktails', cost: '$60/person' } },
      { day: 3, date: 'Saturday', title: 'Adventure & Nightlife', morning: { time: '9:00 AM', activity: 'Jungle Bike Tour', description: 'Guided bike ride through the jungle to hidden cenotes', cost: '$35/person' }, afternoon: { time: '2:00 PM', activity: 'Pool Day + Spa', description: 'Relax at the villa. Optional massage sessions.', cost: '$50/person' }, evening: { time: '9:00 PM', activity: 'Papaya Playa Beach Party', description: 'Saturday night beach party under the stars', cost: '$30/person' } },
      { day: 4, date: 'Sunday', title: 'Last Day & Departure', morning: { time: '8:00 AM', activity: 'Sunrise Yoga on the Beach', description: 'Free community yoga session at Playa Paraiso', cost: 'Free' }, afternoon: { time: '12:00 PM', activity: 'Farewell Lunch at La Zebra', description: 'Beachfront brunch with live music', cost: '$35/person' }, evening: { time: '4:00 PM', activity: 'Departure', description: 'Head to Cancun airport (1.5 hr drive)', cost: '$25/person' } },
    ],
    restaurants: [
      { name: 'Hartwood', cuisine: 'Farm-to-Table Mexican', price_range: '$$$', meal: 'Dinner', description: 'Open-fire cooking in the jungle. One of the best restaurants in Mexico.', must_try_dish: 'Wood-roasted octopus', reservation_needed: true },
      { name: 'Taqueria La Eufemia', cuisine: 'Street Tacos', price_range: '$', meal: 'Lunch', description: 'Beach shack tacos that locals swear by. Cash only.', must_try_dish: 'Fish tacos al pastor', reservation_needed: false },
      { name: 'Arca', cuisine: 'Modern Mexican', price_range: '$$$', meal: 'Dinner', description: 'Tasting menu in a stunning jungle setting.', must_try_dish: 'Mole negro tasting', reservation_needed: true },
      { name: 'Burrito Amor', cuisine: 'Mexican Breakfast', price_range: '$', meal: 'Breakfast', description: 'Best breakfast burritos in Tulum Centro. Always a line, always worth it.', must_try_dish: 'Breakfast burrito with green salsa', reservation_needed: false },
      { name: 'La Zebra', cuisine: 'Seafood & Mexican', price_range: '$$', meal: 'Lunch', description: 'Beachfront dining with live salsa music on Sundays.', must_try_dish: 'Ceviche platter', reservation_needed: true },
      { name: 'Raw Love', cuisine: 'Vegan/Raw', price_range: '$$', meal: 'Breakfast', description: 'Smoothie bowls and raw desserts in a treehouse-style cafe.', must_try_dish: 'Dragon fruit smoothie bowl', reservation_needed: false },
      { name: 'Kitchen Table', cuisine: 'International', price_range: '$$', meal: 'Dinner', description: 'Communal dining concept with rotating weekly menus.', must_try_dish: "Chef's tasting plate", reservation_needed: true },
      { name: 'Batey Mojito Bar', cuisine: 'Cocktails & Snacks', price_range: '$$', meal: 'Late Night', description: 'VW Bug turned cocktail station. Best mojitos in town.', must_try_dish: 'Passion fruit mojito', reservation_needed: false },
    ],
    pro_tips: [
      'Book Hartwood reservations at least 2 weeks in advance.',
      'Bring cash for cenotes and street food stalls.',
      'Rent bikes instead of taxis for getting around ($10/day).',
      'Best exchange rates are at ATMs in Centro, not the airport.',
      'Pack reef-safe sunscreen — required at cenotes and most beaches.',
    ],
  };
}
