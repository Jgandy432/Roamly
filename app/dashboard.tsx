import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, LogOut, User } from 'lucide-react-native';

import { useTrips } from '@/context/TripContext';
import BottomTabBar from '@/components/BottomTabBar';
import { Colors } from '@/constants/colors';
import { Trip } from '@/types/trip';

export default function DashboardScreen() {
  const router = useRouter();
  const { trips, currentUser, logout, setActiveTrip, setActiveTripPlan } = useTrips();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
      return;
    }
    if (!currentUser.hasCompletedOnboarding) {
      router.replace('/onboarding');
      return;
    }
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [currentUser, fadeAnim, router]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backHandler.remove();
    }
  }, []);

  const handleOpenTrip = (trip: Trip) => {
    setActiveTrip(trip);
    setActiveTripPlan(trip.plan ?? null);
    router.push('/trip');
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}> 
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Signed in as</Text>
              <Text style={styles.userName}>{currentUser?.name ?? ''}</Text>
              <Text style={styles.userMeta}>{currentUser?.email ?? ''}</Text>
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
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Real collaborators only</Text>
              <Text style={styles.infoBody}>Trips now load members from authenticated user accounts. Invite collaborators by email from inside each trip.</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Trips</Text>
              <TouchableOpacity style={styles.newTripBtn} onPress={() => router.push('/create-trip')} testID="new-trip-btn">
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.newTripBtnText}>New Trip</Text>
              </TouchableOpacity>
            </View>

            {trips.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🧳</Text>
                <Text style={styles.emptyText}>No account-backed trips yet. Create one to invite real collaborators.</Text>
              </View>
            ) : (
              trips.map((trip) => (
                <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={() => handleOpenTrip(trip)} activeOpacity={0.7} testID={`trip-card-${trip.id}`}>
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripName}>{trip.name}</Text>
                    <Text style={styles.tripMeta}>{trip.destination} · {trip.members.length} collaborator{trip.members.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.statusBadge}><Text style={styles.statusText}>{trip.status}</Text></View>
                </TouchableOpacity>
              ))
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  greeting: { fontSize: 13, color: Colors.textMuted },
  userName: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 2 },
  userMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },
  infoCard: { backgroundColor: Colors.orangeMuted, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.borderOrange },
  infoTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 6 },
  infoBody: { fontSize: 13, lineHeight: 20, color: Colors.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  newTripBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.orange, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  newTripBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#FFFFFF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  tripCard: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  tripInfo: { flex: 1, marginRight: 12 },
  tripName: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  tripMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.bgInput },
  statusText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' as const, textTransform: 'capitalize' as const },
});
