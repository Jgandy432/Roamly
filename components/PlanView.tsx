import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Moon,
  Users,
  DollarSign,
  Lightbulb,
  MapPin,
  Calendar,
  Sparkles,
  Star,
  Utensils,
  Compass,
  ThumbsUp,
  ThumbsDown,
  Zap,
  TrendingUp,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { TripPlan, Vote } from '@/types/trip';
import { formatDateRange, formatDisplayDate } from '@/utils/helpers';

interface PlanViewProps {
  plan: TripPlan;
  votes: Vote[];
  currentUserId: string;
  isLeader: boolean;
  onVote: (itemId: string, vote: 'up' | 'down') => void;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'lodging', label: 'Lodging' },
  { id: 'flights', label: 'Flights' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'food', label: 'Food' },
] as const;

type TabId = typeof TABS[number]['id'];

const TIP_ICONS = [Lightbulb, Star, Compass, Utensils, MapPin];

interface VoteHelpers {
  getTally: (itemId: string) => { up: number; down: number };
  getMyVote: (itemId: string) => 'up' | 'down' | null;
  handleVote: (itemId: string, type: 'up' | 'down') => void;
  getScale: (itemId: string, type: 'up' | 'down') => Animated.Value;
}

function useVoteHelpers(votes: Vote[], currentUserId: string, onVote: (itemId: string, vote: 'up' | 'down') => void): VoteHelpers {
  const scaleAnims = useRef<Record<string, Animated.Value>>({});

  const getScale = useCallback((itemId: string, type: 'up' | 'down') => {
    const key = `${itemId}-${type}`;
    if (!scaleAnims.current[key]) {
      scaleAnims.current[key] = new Animated.Value(1);
    }
    return scaleAnims.current[key];
  }, []);

  const handleVote = useCallback((itemId: string, type: 'up' | 'down') => {
    const scale = getScale(itemId, type);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.25, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onVote(itemId, type);
  }, [onVote, getScale]);

  const getTally = useCallback((itemId: string) => {
    const itemVotes = votes.filter((v) => v.itemId === itemId);
    return {
      up: itemVotes.filter((v) => v.vote === 'up').length,
      down: itemVotes.filter((v) => v.vote === 'down').length,
    };
  }, [votes]);

  const getMyVote = useCallback((itemId: string): 'up' | 'down' | null => {
    const v = votes.find((v) => v.itemId === itemId && v.userId === currentUserId);
    return v?.vote ?? null;
  }, [votes, currentUserId]);

  return { getTally, getMyVote, handleVote, getScale };
}

function InlineVote({ itemId, helpers }: { itemId: string; helpers: VoteHelpers }) {
  const tally = helpers.getTally(itemId);
  const myVote = helpers.getMyVote(itemId);

  return (
    <View style={inlineVoteStyles.row}>
      <TouchableOpacity
        style={[inlineVoteStyles.btn, myVote === 'up' && inlineVoteStyles.btnUpActive]}
        onPress={() => helpers.handleVote(itemId, 'up')}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Animated.View style={{ transform: [{ scale: helpers.getScale(itemId, 'up') }] }}>
          <ThumbsUp size={12} color={myVote === 'up' ? '#fff' : '#10B981'} />
        </Animated.View>
        <Text style={[inlineVoteStyles.count, myVote === 'up' && inlineVoteStyles.countActive]}>
          {tally.up}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[inlineVoteStyles.btn, myVote === 'down' && inlineVoteStyles.btnDownActive]}
        onPress={() => helpers.handleVote(itemId, 'down')}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Animated.View style={{ transform: [{ scale: helpers.getScale(itemId, 'down') }] }}>
          <ThumbsDown size={12} color={myVote === 'down' ? '#fff' : '#EF4444'} />
        </Animated.View>
        <Text style={[inlineVoteStyles.count, myVote === 'down' && inlineVoteStyles.countActive]}>
          {tally.down}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const inlineVoteStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  btnUpActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  btnDownActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  count: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  countActive: {
    color: '#fff',
  },
});

interface TopPickItem {
  name: string;
  isTopVoted: boolean;
  isAiPick: boolean;
  aiReason: string;
  upVotes: number;
}

function TopPicksBanner({ items, votes, helpers, category }: {
  items: { id: string; name: string; recommended?: boolean; aiReason?: string }[];
  votes: Vote[];
  helpers: VoteHelpers;
  category: string;
}) {
  const topPick = useMemo((): TopPickItem | null => {
    if (items.length === 0) return null;

    let topVotedIdx = -1;
    let topScore = -Infinity;
    items.forEach((item, i) => {
      const tally = helpers.getTally(item.id);
      const score = tally.up - tally.down;
      if (tally.up > 0 && score > topScore) {
        topScore = score;
        topVotedIdx = i;
      }
    });

    const aiPickIdx = items.findIndex((i) => i.recommended);
    const aiItem = aiPickIdx >= 0 ? items[aiPickIdx] : null;
    const topItem = topVotedIdx >= 0 ? items[topVotedIdx] : null;

    if (!topItem && !aiItem) return null;

    const isSame = topItem && aiItem && topItem.id === aiItem.id;

    if (isSame) {
      const tally = helpers.getTally(topItem.id);
      return {
        name: topItem.name,
        isTopVoted: true,
        isAiPick: true,
        aiReason: topItem.aiReason || `Best ${category.toLowerCase()} option for your group`,
        upVotes: tally.up,
      };
    }

    if (topItem) {
      const tally = helpers.getTally(topItem.id);
      return {
        name: topItem.name,
        isTopVoted: true,
        isAiPick: false,
        aiReason: '',
        upVotes: tally.up,
      };
    }

    if (aiItem) {
      return {
        name: aiItem.name,
        isTopVoted: false,
        isAiPick: true,
        aiReason: aiItem.aiReason || `Best ${category.toLowerCase()} option for your group`,
        upVotes: 0,
      };
    }

    return null;
  }, [items, votes, helpers, category]);

  if (!topPick) return null;

  return (
    <View style={bannerStyles.container}>
      <LinearGradient
        colors={['#FFF7ED', '#FEF3C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={bannerStyles.gradient}
      >
        <View style={bannerStyles.header}>
          <View style={bannerStyles.iconWrap}>
            <TrendingUp size={13} color="#D97706" />
          </View>
          <Text style={bannerStyles.title}>Top Pick</Text>
          {topPick.isTopVoted && (
            <View style={bannerStyles.badge}>
              <ThumbsUp size={9} color="#fff" />
              <Text style={bannerStyles.badgeText}>Most Voted</Text>
            </View>
          )}
          {topPick.isAiPick && (
            <View style={[bannerStyles.badge, bannerStyles.aiBadge]}>
              <Zap size={9} color="#fff" />
              <Text style={bannerStyles.badgeText}>AI Pick</Text>
            </View>
          )}
        </View>
        <Text style={bannerStyles.name}>{topPick.name}</Text>
        {topPick.isAiPick && topPick.aiReason ? (
          <Text style={bannerStyles.reason}>{topPick.aiReason}</Text>
        ) : null}
        {topPick.upVotes > 0 && (
          <Text style={bannerStyles.voteCount}>{topPick.upVotes} vote{topPick.upVotes !== 1 ? 's' : ''} in favor</Text>
        )}
      </LinearGradient>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#92400E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadge: {
    backgroundColor: '#8B5CF6',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  name: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#78350F',
  },
  reason: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 3,
    lineHeight: 17,
  },
  voteCount: {
    fontSize: 11,
    color: '#A16207',
    marginTop: 4,
    fontWeight: '500' as const,
  },
});

export default function PlanView({ plan, votes, currentUserId, isLeader, onVote }: PlanViewProps) {
  const [tab, setTab] = useState<TabId>('overview');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const voteHelpers = useVoteHelpers(votes, currentUserId, onVote);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [tab]);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {tab === 'overview' && plan.summary && <OverviewTab plan={plan} />}
        {tab === 'lodging' && plan.lodging && (
          <LodgingTab plan={plan} votes={votes} helpers={voteHelpers} />
        )}
        {tab === 'flights' && plan.flights && (
          <FlightsTab plan={plan} votes={votes} helpers={voteHelpers} />
        )}
        {tab === 'itinerary' && plan.itinerary && (
          <ItineraryTab plan={plan} votes={votes} helpers={voteHelpers} />
        )}
        {tab === 'food' && plan.restaurants && <FoodTab plan={plan} />}
      </Animated.View>
    </View>
  );
}

function generateTripVibe(plan: TripPlan): string {
  const s = plan.summary;
  const dest = s.destination || 'your destination';
  const nights = s.total_nights || 0;
  const groupSize = s.group_size || 2;

  const hasBeach = plan.itinerary?.some(d =>
    [d.morning?.activity, d.afternoon?.activity, d.evening?.activity]
      .filter(Boolean)
      .some(a => /beach|surf|snorkel|ocean|coast|swim/i.test(a ?? ''))
  );
  const hasAdventure = plan.itinerary?.some(d =>
    [d.morning?.activity, d.afternoon?.activity, d.evening?.activity]
      .filter(Boolean)
      .some(a => /hike|trek|climb|kayak|zip|adventure|explore/i.test(a ?? ''))
  );
  const hasCulture = plan.itinerary?.some(d =>
    [d.morning?.activity, d.afternoon?.activity, d.evening?.activity]
      .filter(Boolean)
      .some(a => /museum|temple|historic|tour|gallery|market|cultural/i.test(a ?? ''))
  );
  const hasDining = plan.restaurants && plan.restaurants.length > 3;

  const vibes: string[] = [];
  if (hasBeach) vibes.push('sun-soaked beach days');
  if (hasAdventure) vibes.push('thrilling adventures');
  if (hasCulture) vibes.push('rich cultural experiences');
  if (hasDining) vibes.push('incredible dining');

  const vibeStr = vibes.length > 0
    ? vibes.slice(0, 2).join(' and ')
    : 'unforgettable experiences';

  const groupDesc = groupSize <= 2 ? 'an intimate getaway' : `an epic trip for ${groupSize}`;

  return `Get ready for ${groupDesc} to ${dest}! Over ${nights} nights, you'll enjoy ${vibeStr} crafted around everyone's preferences. This is going to be one for the books.`;
}

function OverviewTab({ plan }: { plan: TripPlan }) {
  const s = plan.summary;
  const vibeText = generateTripVibe(plan);
  const costText = s.estimated_cost_per_person
    ? `$${s.estimated_cost_per_person.low} - $${s.estimated_cost_per_person.high}`
    : 'TBD';

  return (
    <View>
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={['#FF6B4A', '#FF8E53', '#FFB347']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroIconRow}>
              <MapPin size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroLabel}>YOUR DESTINATION</Text>
            </View>
            <Text style={styles.heroDestination}>{s.destination}</Text>
            <View style={styles.heroDatesRow}>
              <Calendar size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroDates}>{formatDateRange(s.recommended_dates)}</Text>
            </View>
          </View>
          <View style={styles.heroDecoCircle1} />
          <View style={styles.heroDecoCircle2} />
        </LinearGradient>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Moon size={18} color="#6366F1" />
          </View>
          <Text style={styles.statCardValue}>{s.total_nights}</Text>
          <Text style={styles.statCardLabel}>Nights</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Users size={18} color="#10B981" />
          </View>
          <Text style={styles.statCardValue}>{s.group_size}</Text>
          <Text style={styles.statCardLabel}>Group</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <DollarSign size={18} color="#F59E0B" />
          </View>
          <Text style={styles.statCardValue}>{costText}</Text>
          <Text style={styles.statCardLabel}>Per Person</Text>
        </View>
      </View>

      <View style={styles.vibeCard}>
        <View style={styles.vibeTitleRow}>
          <Sparkles size={18} color="#FF6B4A" />
          <Text style={styles.vibeTitle}>Your Trip at a Glance</Text>
        </View>
        <Text style={styles.vibeText}>{vibeText}</Text>
      </View>

      {plan.pro_tips && plan.pro_tips.length > 0 && (
        <View style={styles.proTipsSection}>
          <View style={styles.proTipsTitleRow}>
            <Lightbulb size={16} color="#F59E0B" />
            <Text style={styles.proTipsTitle}>Pro Tips</Text>
          </View>
          {plan.pro_tips.map((tip, i) => {
            const IconComp = TIP_ICONS[i % TIP_ICONS.length];
            return (
              <View key={i} style={styles.tipCard}>
                <View style={styles.tipIconBg}>
                  <IconComp size={14} color="#FF6B4A" />
                </View>
                <Text style={styles.tipCardText}>{tip}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function LodgingTab({ plan, votes, helpers }: { plan: TripPlan; votes: Vote[]; helpers: VoteHelpers }) {
  const bannerItems = useMemo(() =>
    plan.lodging.map((l, i) => ({
      id: `lodging-${i}`,
      name: l.name,
      recommended: l.recommended,
      aiReason: l.recommended ? `Best match for your group's budget and preferences` : undefined,
    })),
    [plan.lodging]
  );

  return (
    <View>
      <TopPicksBanner items={bannerItems} votes={votes} helpers={helpers} category="Lodging" />
      {plan.lodging.map((l, i) => {
        const itemId = `lodging-${i}`;
        return (
          <View key={i} style={[styles.card, l.recommended && styles.cardHighlighted]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>{l.name}</Text>
                <Text style={styles.cardSubtitle}>{l.type} · {l.area}</Text>
              </View>
              <View style={styles.cardHeaderRight}>
                {l.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
                <InlineVote itemId={itemId} helpers={helpers} />
              </View>
            </View>
            <Text style={styles.cardDesc}>{l.description}</Text>
            <View style={styles.tagsRow}>
              {l.highlights?.map((h, j) => (
                <View key={j} style={styles.tag}>
                  <Text style={styles.tagText}>{h}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.priceText}>${l.price_per_night}/night · ${l.price_per_person_per_night}/pp/night</Text>
              <Text style={l.fits_all_budgets ? styles.fitsBudget : styles.overBudget}>
                {l.fits_all_budgets ? '✓ Fits all budgets' : '⚠ Over some budgets'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function formatFlightDate(text: string): string {
  if (!text) return text;
  const isoPattern = /\d{4}-\d{2}-\d{2}/g;
  let result = text.replace(isoPattern, (match) => formatDisplayDate(match));
  const slashPattern = /\d{1,2}\/\d{1,2}\/\d{4}/g;
  result = result.replace(slashPattern, (match) => formatDisplayDate(match));
  return result;
}

function FlightsTab({ plan, votes, helpers }: { plan: TripPlan; votes: Vote[]; helpers: VoteHelpers }) {
  const bannerItems = useMemo(() =>
    plan.flights.map((f, i) => ({
      id: `flight-${i}`,
      name: `${f.member_name} — ${f.airline}`,
      recommended: i === 0,
      aiReason: i === 0 ? `Best value flight option for the group` : undefined,
    })),
    [plan.flights]
  );

  return (
    <View>
      <TopPicksBanner items={bannerItems} votes={votes} helpers={helpers} category="Flight" />
      {plan.flights.map((f, i) => {
        const itemId = `flight-${i}`;
        const formattedDeparture = formatFlightDate(f.departure_time ?? '');
        const formattedDetails = formatFlightDate(
          `${f.airport} · ${f.airline} · ${formattedDeparture} · ${f.type}`
        );
        const formattedNotes = f.notes ? formatFlightDate(f.notes) : null;

        return (
          <View key={i} style={styles.flightCard}>
            <View style={styles.flightAvatar}>
              <Text style={styles.flightAvatarText}>{f.member_name?.charAt(0) ?? '?'}</Text>
            </View>
            <View style={styles.flightInfo}>
              <Text style={styles.flightName}>{f.member_name}</Text>
              <Text style={styles.flightDetails}>{formattedDetails}</Text>
              {formattedNotes ? <Text style={styles.flightNotes}>{formattedNotes}</Text> : null}
            </View>
            <View style={styles.flightRight}>
              <View style={styles.flightPrice}>
                <Text style={styles.flightPriceValue}>${f.price_roundtrip}</Text>
                <Text style={styles.flightPriceLabel}>roundtrip</Text>
              </View>
              <InlineVote itemId={itemId} helpers={helpers} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ItineraryTab({ plan, votes, helpers }: { plan: TripPlan; votes: Vote[]; helpers: VoteHelpers }) {
  const allActivities = useMemo(() => {
    const acts: { id: string; name: string; recommended: boolean }[] = [];
    plan.itinerary.forEach((day) => {
      (['morning', 'afternoon', 'evening'] as const).forEach((slot) => {
        const data = day[slot];
        if (data?.activity) {
          acts.push({
            id: `activity-${day.day}-${slot}`,
            name: data.activity,
            recommended: false,
          });
        }
      });
    });
    if (acts.length > 0) acts[0].recommended = true;
    return acts;
  }, [plan.itinerary]);

  const bannerItems = useMemo(() =>
    allActivities.map((a) => ({
      id: a.id,
      name: a.name,
      recommended: a.recommended,
      aiReason: a.recommended ? `Top activity recommended for your group` : undefined,
    })),
    [allActivities]
  );

  return (
    <View>
      <TopPicksBanner items={bannerItems} votes={votes} helpers={helpers} category="Activity" />
      {plan.itinerary.map((day) => (
        <View key={day.day} style={styles.card}>
          <View style={styles.dayHeader}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{day.day}</Text>
            </View>
            <View>
              <Text style={styles.dayTitle}>{day.title}</Text>
              <Text style={styles.dayDate}>{formatDisplayDate(day.date) || day.date}</Text>
            </View>
          </View>
          <View style={styles.timeline}>
            {(['morning', 'afternoon', 'evening'] as const).map((slot) => {
              const data = day[slot];
              if (!data) return null;
              const itemId = `activity-${day.day}-${slot}`;
              return (
                <View key={slot} style={styles.timeSlot}>
                  <View style={styles.timeSlotTop}>
                    <View style={styles.timeSlotContent}>
                      <View style={styles.timeSlotHeader}>
                        <Text style={styles.timeSlotTime}>{data.time}</Text>
                        <Text style={styles.timeSlotLabel}>{slot.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.timeSlotActivity}>{data.activity}</Text>
                      <Text style={styles.timeSlotDesc}>{data.description}</Text>
                      {data.cost && data.cost !== 'Free' && (
                        <Text style={styles.timeSlotCost}>{data.cost}</Text>
                      )}
                    </View>
                    <InlineVote itemId={itemId} helpers={helpers} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function FoodTab({ plan }: { plan: TripPlan }) {
  return (
    <View>
      {plan.restaurants.map((r, i) => (
        <View key={i} style={styles.foodCard}>
          <View style={styles.foodHeader}>
            <Text style={styles.foodName}>{r.name}</Text>
            <Text style={styles.foodPrice}>{r.price_range}</Text>
          </View>
          <Text style={styles.foodMeta}>{r.cuisine} · {r.meal}</Text>
          <Text style={styles.foodDesc}>{r.description}</Text>
          {r.must_try_dish ? (
            <Text style={styles.foodMustTry}>🍽️ Must try: {r.must_try_dish}</Text>
          ) : null}
          {r.reservation_needed && (
            <Text style={styles.foodReservation}>📞 Reservation recommended</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  tabBar: { marginBottom: 16 },
  tabBarContent: { paddingHorizontal: 2 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.bgCard,
  },
  tabBtnActive: {
    backgroundColor: '#FF6B4A',
  },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
  tabTextActive: { color: '#FFFFFF' },

  heroWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGradient: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  heroOverlay: {
    zIndex: 2,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },
  heroDestination: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 38,
  },
  heroDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDates: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.9)',
  },
  heroDecoCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroDecoCircle2: {
    position: 'absolute',
    bottom: -20,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  statCardLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },

  vibeCard: {
    backgroundColor: '#FFF8F5',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 74, 0.15)',
  },
  vibeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  vibeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  vibeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  proTipsSection: {
    marginBottom: 12,
  },
  proTipsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proTipsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipIconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 74, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  tipCardText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHighlighted: {
    borderColor: Colors.borderOrange,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: { flex: 1 },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  cardSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  recommendedBadge: {
    backgroundColor: Colors.orangeMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: { fontSize: 11, color: Colors.orange, fontWeight: '500' as const },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: {
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { fontSize: 11, color: Colors.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  priceText: { fontSize: 12, color: Colors.textMuted },
  fitsBudget: { fontSize: 11, color: Colors.emerald },
  overBudget: { fontSize: 11, color: '#D4950A' },

  flightCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  flightAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flightAvatarText: { fontSize: 15, fontWeight: '700' as const, color: '#FF6B4A' },
  flightInfo: { flex: 1 },
  flightName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  flightDetails: { fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  flightNotes: { fontSize: 11, color: Colors.textDim, marginTop: 3, lineHeight: 16 },
  flightRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  flightPrice: { alignItems: 'flex-end' },
  flightPriceValue: { fontSize: 16, fontWeight: '700' as const, color: '#FF6B4A' },
  flightPriceLabel: { fontSize: 10, color: Colors.textDim },

  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.orangeMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeText: { fontSize: 13, fontWeight: '700' as const, color: Colors.orange },
  dayTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  dayDate: { fontSize: 12, color: Colors.textMuted },
  timeline: {
    marginLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingLeft: 18,
    gap: 14,
  },
  timeSlot: {},
  timeSlotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  timeSlotContent: {
    flex: 1,
  },
  timeSlotHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  timeSlotTime: { fontSize: 11, color: Colors.orangeLight, fontWeight: '500' as const },
  timeSlotLabel: { fontSize: 10, color: Colors.textDim, letterSpacing: 1 },
  timeSlotActivity: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  timeSlotDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  timeSlotCost: { fontSize: 11, color: Colors.textDim, marginTop: 3 },

  foodCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  foodName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  foodPrice: { fontSize: 12, color: Colors.orangeLight, fontWeight: '500' as const },
  foodMeta: { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  foodDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  foodMustTry: { fontSize: 12, color: Colors.orange, marginTop: 8 },
  foodReservation: { fontSize: 11, color: '#D4950A', marginTop: 4 },
});
