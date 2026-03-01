import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, LogOut, User } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import BottomTabBar from '@/components/BottomTabBar';
import { Colors } from '@/constants/colors';
import { Trip } from '@/types/trip';

export default function DashboardScreen() {
  const router = useRouter();
  const { trips, currentUser, logout, joinTrip, setActiveTrip, setActiveTripPlan } = useTrips();
  const [joinCode, setJoinCode] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
      return;
    }
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [currentUser]);

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
      Alert.alert('Success', result.message);
      router.push('/trip');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const getStatusIcon = (status: string) => {
    if (status === 'planned') return '✅';
    if (status === 'collecting') return '📋';
    return '✈️';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'planned') return { bg: Colors.emeraldMuted, text: Colors.emerald };
    if (status === 'collecting') return { bg: Colors.amberMuted, text: '#D4950A' };
    return { bg: '#F2F2F7', text: Colors.textMuted };
  };

  const getStatusLabel = (status: string) => {
    if (status === 'planned') return 'Plan Ready';
    if (status === 'collecting') return 'Collecting';
    return status;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{currentUser?.name ?? ''}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/profile')} testID="profile-btn">
                <User size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleLogout} testID="logout-btn">
                <LogOut size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.joinCard}>
              <Text style={styles.joinLabel}>Have an invite code?</Text>
              <View style={styles.joinRow}>
                <TextInput
                  style={styles.joinInput}
                  placeholder="6-digit code"
                  placeholderTextColor={Colors.textDark}
                  value={joinCode}
                  onChangeText={(t) => setJoinCode(t.toUpperCase())}
                  maxLength={6}
                  autoCapitalize="characters"
                  testID="join-input"
                />
                <TouchableOpacity
                  style={[styles.joinBtn, joinCode.length < 6 && styles.joinBtnDisabled]}
                  onPress={handleJoin}
                  disabled={joinCode.length < 6}
                  testID="join-btn"
                >
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Trips</Text>
              <TouchableOpacity
                style={styles.newTripBtn}
                onPress={() => router.push('/create-trip')}
                activeOpacity={0.8}
                testID="new-trip-btn"
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.newTripBtnText}>New Trip</Text>
              </TouchableOpacity>
            </View>

            {trips.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🗺️</Text>
                <Text style={styles.emptyText}>No trips yet. Create one to get started.</Text>
              </View>
            ) : (
              trips.map((trip) => {
                const statusStyle = getStatusStyle(trip.status);
                return (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.tripCard}
                    onPress={() => handleOpenTrip(trip)}
                    activeOpacity={0.7}
                    testID={`trip-card-${trip.id}`}
                  >
                    <View style={styles.tripIconWrap}>
                      <Text style={styles.tripIcon}>{getStatusIcon(trip.status)}</Text>
                    </View>
                    <View style={styles.tripInfo}>
                      <Text style={styles.tripName}>{trip.name}</Text>
                      <Text style={styles.tripMeta}>
                        {trip.destination} · {trip.members.length} member{trip.members.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {getStatusLabel(trip.status)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  joinCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  joinLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 10,
  },
  joinInput: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 4,
    fontWeight: '600' as const,
  },
  joinBtn: {
    backgroundColor: Colors.text,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  joinBtnDisabled: { opacity: 0.3 },
  joinBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.bg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  newTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orange,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  newTripBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  tripCard: {
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
  tripIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.orangeMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripIcon: { fontSize: 20 },
  tripInfo: { flex: 1 },
  tripName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tripMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
