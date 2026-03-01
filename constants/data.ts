export interface InterestOption {
  id: string;
  label: string;
  icon: string;
}

export const INTEREST_OPTIONS: InterestOption[] = [
  { id: 'nightlife', label: 'Nightlife', icon: '🍸' },
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'hiking', label: 'Hiking', icon: '🥾' },
  { id: 'museums', label: 'Museums', icon: '🏛️' },
  { id: 'food', label: 'Food Scene', icon: '🍜' },
  { id: 'shows', label: 'Shows & Events', icon: '🎭' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'adventure', label: 'Adventure Sports', icon: '🏄' },
  { id: 'wellness', label: 'Wellness & Spa', icon: '🧘' },
  { id: 'history', label: 'History & Culture', icon: '📜' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'wine', label: 'Wine & Cocktails', icon: '🍷' },
];

export const AIRPORTS: string[] = [
  'EWR - Newark',
  'JFK - New York JFK',
  'LGA - LaGuardia',
  'LAX - Los Angeles',
  'SFO - San Francisco',
  'ORD - Chicago O\'Hare',
  'ATL - Atlanta',
  'DFW - Dallas Fort Worth',
  'MIA - Miami',
  'BOS - Boston Logan',
  'SEA - Seattle-Tacoma',
  'DEN - Denver',
  'PHX - Phoenix',
  'IAH - Houston',
  'LAS - Las Vegas',
];

export interface SampleTrip {
  id: string;
  name: string;
  destination: string;
  dates: string;
  members: number;
  status: string;
}

export const POPULAR_DESTINATIONS: string[] = [
  'Paris, France', 'London, England', 'Rome, Italy', 'Barcelona, Spain',
  'Amsterdam, Netherlands', 'Lisbon, Portugal', 'Prague, Czech Republic',
  'Vienna, Austria', 'Berlin, Germany', 'Athens, Greece',
  'Santorini, Greece', 'Istanbul, Turkey', 'Dublin, Ireland',
  'Edinburgh, Scotland', 'Copenhagen, Denmark', 'Reykjavik, Iceland',
  'Amalfi Coast, Italy', 'Cinque Terre, Italy', 'Swiss Alps, Switzerland',
  'Tokyo, Japan', 'Kyoto, Japan', 'Seoul, South Korea', 'Bangkok, Thailand',
  'Bali, Indonesia', 'Singapore', 'Hong Kong', 'Taipei, Taiwan',
  'Hanoi, Vietnam', 'Phuket, Thailand', 'Maldives',
  'Sydney, Australia', 'Melbourne, Australia', 'Queenstown, New Zealand',
  'New York City, USA', 'Los Angeles, USA', 'Miami, USA',
  'San Francisco, USA', 'Chicago, USA', 'Nashville, USA',
  'Austin, USA', 'New Orleans, USA', 'Savannah, USA',
  'Denver, USA', 'Seattle, USA', 'Scottsdale, USA', 'Maui, Hawaii',
  'Honolulu, Hawaii', 'Park City, USA',
  'Cancún, Mexico', 'Tulum, Mexico', 'Cabo San Lucas, Mexico',
  'Mexico City, Mexico', 'Playa del Carmen, Mexico',
  'San Juan, Puerto Rico', 'Cartagena, Colombia',
  'Buenos Aires, Argentina', 'Rio de Janeiro, Brazil',
  'Lima, Peru', 'Medellín, Colombia', 'Costa Rica',
  'Turks and Caicos', 'Aruba', 'Jamaica', 'Bahamas', 'St. Lucia',
  'Dubai, UAE', 'Marrakech, Morocco', 'Cape Town, South Africa',
  'Nairobi, Kenya', 'Zanzibar, Tanzania',
  'Vancouver, Canada', 'Montreal, Canada', 'Banff, Canada',
];

export const SAMPLE_TRIPS: SampleTrip[] = [
  { id: 't1', name: 'Cabo 2025', destination: 'Cabo San Lucas', dates: 'Nov 14-18', members: 6, status: 'completed' },
  { id: 't2', name: 'Nashville Bach Party', destination: 'Nashville, TN', dates: 'Sep 5-8', members: 8, status: 'completed' },
  { id: 't3', name: 'Ski Trip 2026', destination: 'Park City, UT', dates: 'Jan 15-19', members: 5, status: 'planning' },
];
