import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, AppState } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react-native';

import { supabase } from '@/services/supabase';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { session } = useTrips();
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string>('');

  const envelopeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(envelopeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [envelopeAnim, fadeAnim, slideAnim, pulseAnim]);

  useEffect(() => {
    if (session?.token) {
      console.log('Session detected after email verification, navigating to onboarding');
      router.replace('/onboarding');
    }
  }, [session, router]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        console.log('App became active, refreshing session for email verification');
        void supabase.auth.getSession();
      }
    });
    return () => subscription.remove();
  }, []);

  const handleCheckVerification = useCallback(async () => {
    setIsChecking(true);
    setCheckMessage('');

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 800, useNativeDriver: true })
    ).start();

    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('Email verified! Session found.');
        setCheckMessage('Verified!');
      } else {
        console.log('No session yet, email not verified');
        setCheckMessage('Not verified yet. Please check your inbox.');
      }
    } catch (err) {
      console.log('Error checking verification:', err);
      setCheckMessage('Could not check status. Try again.');
    } finally {
      setIsChecking(false);
      spinAnim.setValue(0);
    }
  }, [spinAnim]);

  const handleResendEmail = useCallback(async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        console.log('Resend error:', error.message);
        setCheckMessage('Could not resend. Try again later.');
      } else {
        setCheckMessage('Verification email resent!');
      }
    } catch (err) {
      console.log('Resend failed:', err);
      setCheckMessage('Could not resend. Try again later.');
    }
  }, [email]);

  const handleBackToLogin = useCallback(() => {
    router.replace('/login');
  }, [router]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.illustrationArea}>
            <Animated.View style={[styles.envelopeCircle, {
              opacity: envelopeAnim,
              transform: [{ scale: pulseAnim }],
            }]}>
              <View style={styles.envelopeInner}>
                <Mail size={48} color={Colors.orange} strokeWidth={1.5} />
              </View>
            </Animated.View>
            <Animated.View style={[styles.checkBadge, { opacity: envelopeAnim }]}>
              <CheckCircle size={22} color={Colors.emerald} fill={Colors.emeraldMuted} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.textArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.heading}>Check your email</Text>
            <Text style={styles.body}>
              We sent a verification link to
            </Text>
            <Text style={styles.emailText}>{email || 'your email'}</Text>
            <Text style={styles.bodySecondary}>
              Tap the link in the email to verify your account, then come back here.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={[styles.checkBtn, isChecking && styles.checkBtnActive]}
              onPress={handleCheckVerification}
              disabled={isChecking}
              testID="check-verification-btn"
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ rotate: isChecking ? spinInterpolate : '0deg' }] }}>
                <RefreshCw size={20} color="#FFF" strokeWidth={2.5} />
              </Animated.View>
              <Text style={styles.checkBtnText}>
                {isChecking ? 'Checking...' : "I've verified my email"}
              </Text>
            </TouchableOpacity>

            {checkMessage !== '' && (
              <View style={[
                styles.messageBubble,
                checkMessage === 'Verified!' ? styles.messageBubbleSuccess : styles.messageBubbleInfo,
              ]}>
                <Text style={[
                  styles.messageText,
                  checkMessage === 'Verified!' ? styles.messageTextSuccess : styles.messageTextInfo,
                ]}>
                  {checkMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResendEmail}
              activeOpacity={0.7}
              testID="resend-email-btn"
            >
              <Text style={styles.resendBtnText}>Resend verification email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBackToLogin}
              activeOpacity={0.7}
              testID="back-to-login-btn"
            >
              <Text style={styles.backBtnText}>
                Already verified? <Text style={styles.backBtnAccent}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationArea: {
    width: 120,
    height: 120,
    marginBottom: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  envelopeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.orangeMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  envelopeInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  textArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  bodySecondary: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    gap: 10,
  },
  checkBtnActive: {
    opacity: 0.8,
  },
  checkBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  messageBubble: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  messageBubbleSuccess: {
    backgroundColor: Colors.emeraldMuted,
  },
  messageBubbleInfo: {
    backgroundColor: Colors.amberMuted,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  messageTextSuccess: {
    color: Colors.emerald,
  },
  messageTextInfo: {
    color: '#B8860B',
  },
  resendBtn: {
    marginTop: 20,
    paddingVertical: 12,
  },
  resendBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.orange,
  },
  backBtn: {
    marginTop: 8,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  backBtnAccent: {
    color: Colors.orange,
    fontWeight: '600' as const,
  },
});
