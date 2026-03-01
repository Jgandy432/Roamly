import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Copy, Check, Sparkles, UserPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import PlanView from '@/components/PlanView';

export default function TripScreen() {
  const router = useRouter();
  const {
    activeTrip,
    activeTripPlan,
    currentUser,
    isGenerating,
    genProgress,
    addDemoMembers,
    generatePlan,
    setActiveTrip,
    setActiveTripPlan,
  } = useTrips();
  const [copied, setCopied] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (isGenerating) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isGenerating]);

  if (!activeTrip || !currentUser) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.errorText}>No trip selected</Text>
          <TouchableOpacity onPress={() => router.replace('/dashboard')}>
            <Text style={styles.linkText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const isLeader = activeTrip.leaderId === currentUser.id;
  const myMembership = activeTrip.members.find((m) => m.id === currentUser.id);
  const submittedCount = activeTrip.members.filter((m) => m.preferencesSubmitted).length;
  const progressPct = activeTrip.members.length > 0 ? (submittedCount / activeTrip.members.length) * 100 : 0;

  const copyInvite = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard?.writeText(`roamly.app/join/${activeTrip.inviteCode}`);
      }
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log('Copy failed');
    }
  };

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await generatePlan();
    if (result.success) {
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  const handleAddDemo = () => {
    addDemoMembers();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Done', '4 demo members added with preferences!');
  };

  const handleBack = () => {
    setActiveTrip(null);
    setActiveTripPlan(null);
    router.back();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={20} color={Colors.textMuted} />
            <Text style={styles.backText}>Dashboard</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tripHeader}>
              <View style={styles.tripHeaderLeft}>
                <Text style={styles.tripName}>{activeTrip.name}</Text>
                <Text style={styles.tripMeta}>
                  {activeTrip.destination}
                  {activeTrip.dateStart ? ` · ${activeTrip.dateStart} to ${activeTrip.dateEnd}` : ''}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: activeTrip.status === 'planned' ? Colors.emeraldMuted : Colors.amberMuted }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: activeTrip.status === 'planned' ? Colors.emerald : '#D4950A' }
                ]}>
                  {activeTrip.status === 'planned' ? 'Plan Ready' : 'Collecting'}
                </Text>
              </View>
            </View>

            {activeTrip.status === 'collecting' && (
              <View style={styles.inviteCard}>
                <View style={styles.inviteTop}>
                  <View style={styles.inviteLeft}>
                    <Text style={styles.inviteLabel}>Share invite link</Text>
                    <View style={styles.inviteLinkRow}>
                      <View style={styles.inviteLinkBg}>
                        <Text style={styles.inviteLink}>roamly.app/join/{activeTrip.inviteCode}</Text>
                      </View>
                      <TouchableOpacity style={styles.copyBtn} onPress={copyInvite}>
                        {copied ? (
                          <Check size={14} color={Colors.emerald} />
                        ) : (
                          <Copy size={14} color={Colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.inviteRight}>
                    <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                    <Text style={styles.inviteCode}>{activeTrip.inviteCode}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.membersCard}>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>Group Members</Text>
                <Text style={styles.membersCount}>{submittedCount}/{activeTrip.members.length} submitted</Text>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
              </View>

              {activeTrip.members.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{m.avatar || m.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    {m.role === 'leader' && <Text style={styles.leaderBadge}>Leader</Text>}
                  </View>
                  <View style={[
                    styles.submittedBadge,
                    { backgroundColor: m.preferencesSubmitted ? Colors.emeraldMuted : Colors.bgCard }
                  ]}>
                    <Text style={[
                      styles.submittedText,
                      { color: m.preferencesSubmitted ? Colors.emerald : Colors.textMuted }
                    ]}>
                      {m.preferencesSubmitted ? '✓ Submitted' : 'Waiting'}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.actionsDivider} />
              <View style={styles.actionsRow}>
                {!myMembership?.preferencesSubmitted && (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push('/preferences')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryBtnText}>Enter My Preferences</Text>
                  </TouchableOpacity>
                )}
                {myMembership?.preferencesSubmitted && !activeTripPlan && (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => router.push('/preferences')}
                  >
                    <Text style={styles.secondaryBtnText}>Edit Preferences</Text>
                  </TouchableOpacity>
                )}
                {isLeader && activeTrip.members.length < 3 && (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={handleAddDemo}>
                    <UserPlus size={14} color={Colors.textSecondary} />
                    <Text style={styles.secondaryBtnText}>Add Demo Members</Text>
                  </TouchableOpacity>
                )}
                {isLeader && !activeTripPlan && !isGenerating && (
                  <TouchableOpacity
                    style={[styles.generateBtn, submittedCount < 2 && styles.generateBtnDisabled]}
                    onPress={handleGenerate}
                    disabled={submittedCount < 2}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={14} color="#FFFFFF" />
                    <Text style={styles.generateBtnText}>Generate Trip Plan</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {isGenerating && (
              <Animated.View style={[styles.generatingCard, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.spinnerWrap}>
                  <Animated.View style={styles.spinner} />
                </View>
                <Text style={styles.genProgressText}>{genProgress}</Text>
                <Text style={styles.genSubText}>This takes about 15-20 seconds</Text>
              </Animated.View>
            )}

            {activeTripPlan && !isGenerating && <PlanView plan={activeTripPlan} />}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.textMuted, marginBottom: 12 },
  linkText: { fontSize: 14, color: Colors.orange },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backText: { fontSize: 14, color: Colors.textMuted },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tripHeaderLeft: { flex: 1, marginRight: 12 },
  tripName: { fontSize: 26, fontWeight: '700' as const, color: Colors.text },
  tripMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' as const },
  inviteCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inviteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  inviteLeft: { flex: 1, marginRight: 16 },
  inviteLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
  inviteLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inviteLinkBg: {
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  inviteLink: { fontSize: 12, color: Colors.orange, fontWeight: '500' as const },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteRight: { alignItems: 'flex-end' },
  inviteCodeLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  inviteCode: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.orange,
    letterSpacing: 3,
  },
  membersCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  membersTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  membersCount: { fontSize: 12, color: Colors.textMuted },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.orange,
    borderRadius: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.orangeMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: { fontSize: 12, fontWeight: '600' as const, color: Colors.orange },
  memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 14, color: Colors.text },
  leaderBadge: { fontSize: 11, color: Colors.orange },
  submittedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  submittedText: { fontSize: 11, fontWeight: '500' as const },
  actionsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 14,
    marginBottom: 14,
  },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryBtn: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
  },
  primaryBtnText: { fontSize: 12, fontWeight: '700' as const, color: '#FFFFFF' },
  secondaryBtn: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  generateBtn: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnDisabled: { opacity: 0.3 },
  generateBtnText: { fontSize: 12, fontWeight: '700' as const, color: '#FFFFFF' },
  generatingCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderOrange,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  spinnerWrap: { marginBottom: 14 },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.orangeMuted,
    borderTopColor: Colors.orange,
  },
  genProgressText: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  genSubText: { fontSize: 12, color: Colors.textDim, marginTop: 6 },
});
