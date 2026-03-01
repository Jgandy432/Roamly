import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, LogOut } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { SAMPLE_TRIPS } from '@/constants/data';
import { formatDisplayDate } from '@/utils/helpers';
import BottomTabBar from '@/components/BottomTabBar';

const VISIBILITY_OPTIONS = ['public', 'friends', 'private'] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { currentUser, trips, logout } = useTrips();
  const [visibility, setVisibility] = useState<string>('friends');

  const allTrips = [
    ...SAMPLE_TRIPS,
    ...trips.filter((t) => t.status === 'planned').map((t) => ({
      id: t.id,
      name: t.name,
      destination: t.destination,
      dates: t.dateStart ? `${formatDisplayDate(t.dateStart)} to ${formatDisplayDate(t.dateEnd || '')}` : 'Dates TBD',
      members: t.members.length,
      status: t.status,
    })),
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return '✈️';
    if (status === 'planned') return '📋';
    return '🗓️';
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{currentUser?.avatar ?? '?'}</Text>
            </View>
            <Text style={styles.profileName}>{currentUser?.name ?? 'User'}</Text>
            <Text style={styles.profileHandle}>
              roamly.app/@{currentUser?.name?.toLowerCase().replace(/\s/g, '') ?? 'user'}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{allTrips.length}</Text>
                <Text style={styles.statLabel}>Trips</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Countries</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>14</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.visLabel}>Profile visibility</Text>
            <View style={styles.visRow}>
              {VISIBILITY_OPTIONS.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.visBtn, visibility === v && styles.visBtnActive]}
                  onPress={() => setVisibility(v)}
                >
                  <Text style={[styles.visBtnText, visibility === v && styles.visBtnTextActive]}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>TRIP HISTORY</Text>
          {allTrips.map((trip) => (
            <View key={trip.id} style={styles.historyCard}>
              <View style={styles.historyIcon}>
                <Text style={styles.historyIconText}>{getStatusIcon(trip.status)}</Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{trip.name}</Text>
                <Text style={styles.historyMeta}>{trip.destination} · {trip.dates || 'Dates TBD'}</Text>
              </View>
              <Text style={styles.historyMembers}>{trip.members} travelers</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={18} color="#E53935" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );

  function handleLogout() {
    logout();
    router.replace('/');
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  profileCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.orangeMuted,
    borderWidth: 2,
    borderColor: Colors.borderOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '700' as const, color: Colors.orange },
  profileName: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  profileHandle: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 20,
  },
  statBlock: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 18,
  },
  visLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  visRow: { flexDirection: 'row', gap: 8 },
  visBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  visBtnActive: { backgroundColor: Colors.orangeMuted },
  visBtnText: { fontSize: 12, fontWeight: '500' as const, color: Colors.textDim },
  visBtnTextActive: { color: Colors.orange },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  historyIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.orangeMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyIconText: { fontSize: 20 },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  historyMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  historyMembers: { fontSize: 11, color: Colors.textDim },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  logoutText: { fontSize: 15, fontWeight: '600' as const, color: '#E53935' },
});
