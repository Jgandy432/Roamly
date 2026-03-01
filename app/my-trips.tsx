import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Send, Clock } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { Trip } from '@/types/trip';
import BottomTabBar from '@/components/BottomTabBar';

const STATUS_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string; barColor: string }> = {
  planned: { label: 'Plan Ready', emoji: '✅', bg: Colors.emeraldMuted, text: Colors.emerald, barColor: Colors.emerald },
  collecting: { label: 'Collecting Prefs', emoji: '📋', bg: Colors.amberMuted, text: '#D4950A', barColor: Colors.amber },
  completed: { label: 'Completed', emoji: '🎉', bg: '#F2F2F7', text: Colors.textMuted, barColor: Colors.textDim },
};

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.collecting;
  const submittedCount = trip.members.filter(m => m.preferencesSubmitted).length;
  const totalCount = trip.members.length;
  const progress = totalCount > 0 ? submittedCount / totalCount : 0;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.tripCard} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
        <View style={styles.tripCardTop}>
          <View style={styles.tripIconWrap}>
            <Text style={styles.tripIcon}>{config.emoji}</Text>
          </View>
          <View style={styles.tripCardMeta}>
            <Text style={styles.tripName}>{trip.name}</Text>
            <Text style={styles.tripDest}>📍 {trip.destination || 'Destination TBD'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusPillText, { color: config.text }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tripCardBottom}>
          <View style={styles.membersRow}>
            {trip.members.slice(0, 5).map((member, i) => (
              <View key={member.id} style={[styles.memberAvatar, { marginLeft: i > 0 ? -8 : 0 }, member.preferencesSubmitted && styles.memberAvatarDone]}>
                <Text style={styles.memberAvatarText}>{member.avatar}</Text>
              </View>
            ))}
            {trip.members.length > 5 && (
              <View style={[styles.memberAvatar, { marginLeft: -8, backgroundColor: Colors.border }]}>
                <Text style={[styles.memberAvatarText, { color: Colors.textMuted, fontSize: 9 }]}>+{trip.members.length - 5}</Text>
              </View>
            )}
            <Text style={styles.memberCountText}>{totalCount} {totalCount === 1 ? 'traveler' : 'travelers'}</Text>
          </View>
          {trip.status === 'collecting' && <Text style={styles.progressText}>{submittedCount}/{totalCount} ready</Text>}
          {trip.status === 'planned' && <Text style={styles.readyText}>🚀 Ready to go!</Text>}
        </View>

        {trip.status === 'collecting' && (
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` as any, backgroundColor: config.barColor }]} />
          </View>
        )}

        {trip.dateStart && (
          <View style={styles.datesRow}>
            <Clock size={11} color={Colors.textMuted} />
            <Text style={styles.datesText}>{trip.dateStart}{trip.dateEnd ? ` → ${trip.dateEnd}` : ''}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MyTripsScreen() {
  const router = useRouter();
  const { trips, currentUser, joinTrip, setActiveTrip, setActiveTripPlan } = useTrips();
  const [joinCode, setJoinCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const activeTrips = trips.filter(t => t.status !== 'completed');
  const pastTrips = trips.filter(t => t.status === 'completed');
  const displayedTrips = activeTab === 'active' ? activeTrips : pastTrips;

  const handleOpenTrip = (trip: Trip) => {
    setActiveTrip(trip);
    setActiveTripPlan(trip.plan || null);
    router.push('/trip');
  };

  const handleJoin = () => {
    if (joinCode.length < 6) return;
    const result = joinTrip(joinCode);
    if (result.success) {
      setJoinCode('');
      Alert.alert('🎉 Joined!', result.message);
      router.push('/trip');
    } else {
      Alert.alert('Oops', result.message);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>My Trips</Text>
              <Text style={styles.headerSub}>{activeTrips.length} active · {pastTrips.length} past</Text>
            </View>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')}>
              <Text style={styles.avatarText}>{currentUser?.avatar ?? '?'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.joinCard}>
              <View style={styles.joinCardHeader}>
                <Send size={15} color={Colors.orange} />
                <Text style={styles.joinCardLabel}>Join with invite code</Text>
              </View>
              <View style={styles.joinRow}>
                <TextInput
                  style={styles.joinInput}
                  placeholder="6-digit code"
                  placeholderTextColor={Colors.textDark}
                  value={joinCode}
                  onChangeText={(t) => setJoinCode(t.toUpperCase())}
                  maxLength={6}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={[styles.joinBtn, joinCode.length < 6 && styles.joinBtnDisabled]} onPress={handleJoin} disabled={joinCode.length < 6}>
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.tabActive]} onPress={() => setActiveTab('active')}>
                <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active ({activeTrips.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'past' && styles.tabActive]} onPress={() => setActiveTab('past')}>
                <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past ({pastTrips.length})</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tripList}>
              {displayedTrips.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>{activeTab === 'active' ? '🗺️' : '🎒'}</Text>
                  <Text style={styles.emptyTitle}>{activeTab === 'active' ? 'No active trips' : 'No past trips yet'}</Text>
                  <Text style={styles.emptyBody}>{activeTab === 'active' ? 'Start planning your next adventure with the group.' : 'Your completed trips will live here.'}</Text>
                  {activeTab === 'active' && (
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/create-trip')}>
                      <Plus size={14} color="#fff" />
                      <Text style={styles.emptyBtnText}>Create a Trip</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                displayedTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onPress={() => handleOpenTrip(trip)} />
                ))
              )}
            </View>

            {displayedTrips.length > 0 && activeTab === 'active' && (
              <TouchableOpacity style={styles.createNudge} onPress={() => router.push('/create-trip')} activeOpacity={0.8}>
                <Plus size={16} color={Colors.orange} />
                <Text style={styles.createNudgeText}>Plan another trip</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 120 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.orangeMuted, borderWidth: 2, borderColor: Colors.orange, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' as const, color: Colors.orange },
  joinCard: { marginHorizontal: 24, marginBottom: 20, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 16 },
  joinCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  joinCardLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  joinRow: { flexDirection: 'row', gap: 10 },
  joinInput: { flex: 1, backgroundColor: Colors.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border, letterSpacing: 5, fontWeight: '700' as const },
  joinBtn: { backgroundColor: Colors.text, paddingHorizontal: 22, borderRadius: 12, justifyContent: 'center' },
  joinBtnDisabled: { opacity: 0.25 },
  joinBtnText: { fontSize: 14, fontWeight: '700' as const, color: Colors.bg },
  tabRow: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.bg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
  tabTextActive: { color: Colors.text },
  tripList: { paddingHorizontal: 24, gap: 12 },
  tripCard: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 16, marginBottom: 2 },
  tripCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tripIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: Colors.orangeMuted, justifyContent: 'center', alignItems: 'center' },
  tripIcon: { fontSize: 20 },
  tripCardMeta: { flex: 1 },
  tripName: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  tripDest: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  statusPillText: { fontSize: 10, fontWeight: '700' as const },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },
  tripCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  membersRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.orangeMuted, borderWidth: 2, borderColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  memberAvatarDone: { backgroundColor: Colors.emeraldMuted },
  memberAvatarText: { fontSize: 11, fontWeight: '700' as const, color: Colors.text },
  memberCountText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' as const, marginLeft: 10 },
  progressText: { fontSize: 12, fontWeight: '600' as const, color: '#D4950A' },
  readyText: { fontSize: 12, fontWeight: '600' as const, color: Colors.emerald },
  progressBarTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 50, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 50 },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  datesText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const },
  emptyState: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.orange, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 50 },
  emptyBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#fff' },
  createNudge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 24, marginTop: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.borderOrange, backgroundColor: Colors.orangeMuted },
  createNudgeText: { fontSize: 14, fontWeight: '600' as const, color: Colors.orange },
});
