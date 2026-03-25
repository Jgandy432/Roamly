import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert, TextInput, Platform, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Mail, Copy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import PlanView from '@/components/PlanView';
import BottomTabBar from '@/components/BottomTabBar';
import { TripMemberRole } from '@/types/trip';

export default function TripScreen() {
  const router = useRouter();
  const { activeTrip, activeTripPlan, currentUser, isGenerating, genProgress, generatePlan, castVote, finalizePlan, setActiveTrip, setActiveTripPlan, inviteCollaborator } = useTrips();
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<TripMemberRole>('editor');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const myMembership = useMemo(() => activeTrip?.members.find((member) => member.userId === currentUser?.id) ?? null, [activeTrip, currentUser?.id]);
  const isOwner = myMembership?.role === 'owner';
  const submittedCount = activeTrip?.members.filter((member) => member.preferencesSubmitted).length ?? 0;
  const progressPct = activeTrip && activeTrip.members.length > 0 ? (submittedCount / activeTrip.members.length) * 100 : 0;

  if (!activeTrip || !currentUser) {
    return <View style={styles.root}><SafeAreaView style={styles.center}><Text style={styles.errorText}>No trip selected</Text></SafeAreaView></View>;
  }

  const handleGenerate = async () => {
    const result = await generatePlan();
    Alert.alert(result.success ? 'Plan ready' : 'Fallback ready', result.message);
  };

  const handleInvite = async () => {
    if (!inviteEmail.includes('@')) return;
    try {
      const invite = await inviteCollaborator(inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Invite created', invite.inviteLink ?? 'Invite link ready');
    } catch (error) {
      Alert.alert('Invite failed', error instanceof Error ? error.message : 'Unable to invite collaborator');
    }
  };

  const handleShareTrip = async () => {
    const latestInvite = activeTrip.invites[0];
    const inviteLink = latestInvite?.inviteLink ?? `https://roamly.app/trips/${activeTrip.id}`;
    await Share.share({ title: `Join ${activeTrip.name}`, message: `Join ${activeTrip.name} in Roamly\n${inviteLink}`, url: inviteLink });
  };

  const handleCopy = async () => {
    const link = activeTrip.invites[0]?.inviteLink;
    if (!link) return;
    if (Platform.OS === 'web') {
      await navigator.clipboard?.writeText(link);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}> 
          <TouchableOpacity style={styles.backBtn} onPress={() => { setActiveTrip(null); setActiveTripPlan(null); router.back(); }}>
            <ChevronLeft size={20} color={Colors.textMuted} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.tripName}>{activeTrip.name}</Text>
            <Text style={styles.tripMeta}>{activeTrip.destination} · {activeTrip.members.length} real collaborators</Text>

            <View style={styles.membersCard}>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>Collaborators</Text>
                <Text style={styles.membersCount}>{submittedCount}/{activeTrip.members.length} submitted</Text>
              </View>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progressPct}%` }]} /></View>
              {activeTrip.members.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{member.avatar}</Text></View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberMeta}>{member.email}</Text>
                  </View>
                  <Text style={styles.roleBadge}>{member.role}</Text>
                </View>
              ))}

              {isOwner && (
                <View style={styles.inviteBox}>
                  <Text style={styles.inviteTitle}>Invite collaborator by email</Text>
                  <TextInput style={styles.input} value={inviteEmail} onChangeText={setInviteEmail} placeholder="friend@example.com" placeholderTextColor={Colors.textDark} autoCapitalize="none" testID="invite-email-input" />
                  <View style={styles.roleRow}>
                    {(['editor', 'viewer'] as TripMemberRole[]).map((role) => (
                      <TouchableOpacity key={role} style={[styles.roleBtn, inviteRole === role && styles.roleBtnActive]} onPress={() => setInviteRole(role)}>
                        <Text style={[styles.roleBtnText, inviteRole === role && styles.roleBtnTextActive]}>{role}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.inviteActions}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleInvite}><Mail size={14} color="#fff" /><Text style={styles.primaryBtnText}>Create Invite</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopy}><Copy size={14} color={Colors.textSecondary} /><Text style={styles.secondaryBtnText}>Copy Latest Link</Text></TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.actionsRow}>
                {!myMembership?.preferencesSubmitted && <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/preferences')}><Text style={styles.primaryBtnText}>Enter My Preferences</Text></TouchableOpacity>}
                {isOwner && !activeTripPlan && <TouchableOpacity style={styles.secondaryBtn} onPress={handleGenerate}><Text style={styles.secondaryBtnText}>{isGenerating ? genProgress || 'Generating...' : 'Generate Trip Plan'}</Text></TouchableOpacity>}
              </View>
            </View>

            {activeTripPlan ? (
              <PlanView plan={activeTripPlan} votes={activeTrip.votes} currentUserId={currentUser.id} isLeader={isOwner} onVote={castVote} finalized={activeTrip.finalized} onFinalize={finalizePlan} onShareTrip={handleShareTrip} shareTripInfo={{ tripName: activeTrip.name, destination: activeTrip.destination, dates: activeTripPlan.summary.recommended_dates, memberCount: activeTrip.members.length, inviteCode: activeTrip.id }} />
            ) : null}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.textMuted },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 24, paddingVertical: 12 },
  backText: { fontSize: 14, color: Colors.textMuted },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  tripName: { fontSize: 26, fontWeight: '700' as const, color: Colors.text },
  tripMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 16 },
  membersCard: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16 },
  membersHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  membersTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  membersCount: { fontSize: 12, color: Colors.textMuted },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  memberAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.orangeMuted, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberAvatarText: { color: Colors.orange, fontWeight: '700' as const },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  memberMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  roleBadge: { fontSize: 11, color: Colors.orange, textTransform: 'capitalize' as const },
  inviteBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  inviteTitle: { fontSize: 13, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text },
  roleRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  roleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.bgInput },
  roleBtnActive: { backgroundColor: Colors.orangeMuted, borderWidth: 1, borderColor: Colors.borderOrange },
  roleBtnText: { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' as const },
  roleBtnTextActive: { color: Colors.orange, fontWeight: '700' as const },
  inviteActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.orange, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  primaryBtnText: { fontSize: 12, fontWeight: '700' as const, color: '#FFFFFF' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bgInput, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  secondaryBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
});
