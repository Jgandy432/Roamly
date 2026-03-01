import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { TripPlan } from '@/types/trip';
import { formatDateRange, formatDisplayDate } from '@/utils/helpers';

interface PlanViewProps {
  plan: TripPlan;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'lodging', label: 'Lodging' },
  { id: 'flights', label: 'Flights' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'food', label: 'Food' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function PlanView({ plan }: PlanViewProps) {
  const [tab, setTab] = useState<TabId>('overview');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [tab]);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Animated.View style={{ opacity: fadeAnim }}>
        {tab === 'overview' && plan.summary && <OverviewTab plan={plan} />}
        {tab === 'lodging' && plan.lodging && <LodgingTab plan={plan} />}
        {tab === 'flights' && plan.flights && <FlightsTab plan={plan} />}
        {tab === 'itinerary' && plan.itinerary && <ItineraryTab plan={plan} />}
        {tab === 'food' && plan.restaurants && <FoodTab plan={plan} />}
      </Animated.View>
    </View>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OverviewTab({ plan }: { plan: TripPlan }) {
  const s = plan.summary;
  return (
    <View>
      <View style={styles.overviewCard}>
        <Text style={styles.overviewDest}>{s.destination}</Text>
        <Text style={styles.overviewDates}>{formatDateRange(s.recommended_dates)}</Text>
        <View style={styles.statsGrid}>
          <StatBlock label="Nights" value={s.total_nights} />
          <StatBlock label="Group" value={s.group_size} />
          <StatBlock label="Match" value={`${s.compatibility_score}%`} accent />
          <StatBlock label="Cost/pp" value={`$${s.estimated_cost_per_person?.low}-${s.estimated_cost_per_person?.high}`} />
        </View>
      </View>
      {plan.pro_tips && plan.pro_tips.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PRO TIPS</Text>
          {plan.pro_tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>✦</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function LodgingTab({ plan }: { plan: TripPlan }) {
  return (
    <View>
      {plan.lodging.map((l, i) => (
        <View key={i} style={[styles.card, l.recommended && styles.cardHighlighted]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle}>{l.name}</Text>
              <Text style={styles.cardSubtitle}>{l.type} · {l.area}</Text>
            </View>
            {l.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
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
      ))}
    </View>
  );
}

function FlightsTab({ plan }: { plan: TripPlan }) {
  return (
    <View>
      {plan.flights.map((f, i) => (
        <View key={i} style={styles.flightCard}>
          <View style={styles.flightAvatar}>
            <Text style={styles.flightAvatarText}>{f.member_name?.charAt(0) ?? '?'}</Text>
          </View>
          <View style={styles.flightInfo}>
            <Text style={styles.flightName}>{f.member_name}</Text>
            <Text style={styles.flightDetails}>{f.airport} · {f.airline} · {f.departure_time} · {f.type}</Text>
            {f.notes ? <Text style={styles.flightNotes}>{f.notes}</Text> : null}
          </View>
          <View style={styles.flightPrice}>
            <Text style={styles.flightPriceValue}>${f.price_roundtrip}</Text>
            <Text style={styles.flightPriceLabel}>roundtrip</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ItineraryTab({ plan }: { plan: TripPlan }) {
  return (
    <View>
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
              return (
                <View key={slot} style={styles.timeSlot}>
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
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    marginRight: 6,
  },
  tabBtnActive: { backgroundColor: Colors.orangeMuted },
  tabText: { fontSize: 13, fontWeight: '500' as const, color: Colors.textMuted },
  tabTextActive: { color: Colors.orange },
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
  overviewCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  overviewDest: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginBottom: 2 },
  overviewDates: { fontSize: 14, fontWeight: '500' as const, color: Colors.orange },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statBlock: { alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  statValueAccent: { color: Colors.orange },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipBullet: { fontSize: 13, color: Colors.orangeLight },
  tipText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  flightCard: {
    backgroundColor: Colors.bgCard,
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
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.orangeMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flightAvatarText: { fontSize: 14, fontWeight: '600' as const, color: Colors.orange },
  flightInfo: { flex: 1 },
  flightName: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  flightDetails: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  flightNotes: { fontSize: 11, color: Colors.textDim, marginTop: 3 },
  flightPrice: { alignItems: 'flex-end' },
  flightPriceValue: { fontSize: 15, fontWeight: '700' as const, color: Colors.orange },
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
