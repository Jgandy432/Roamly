import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, ArrowRight } from 'lucide-react-native';

import { supabase } from '@/services/supabase';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';

const OTP_LENGTH = 8;

export default function EmailVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { session } = useTrips();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(iconScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [iconScale, fadeAnim, slideAnim, pulseAnim]);

  useEffect(() => {
    if (session?.token) {
      console.log('Session detected after OTP verification, navigating to onboarding');
      router.replace('/onboarding');
    }
  }, [session, router]);

  const handleOtpChange = useCallback((value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, '').split('').slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const otpCode = otp.join('');
  const isOtpComplete = otpCode.length === OTP_LENGTH;

  const handleVerify = useCallback(async () => {
    if (!isOtpComplete || !email) return;
    setIsVerifying(true);
    setStatusMessage('');

    try {
      console.log('Verifying OTP for email:', email);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });

      if (error) {
        console.log('OTP verification error:', error.message);
        setStatusMessage(error.message);
        setStatusType('error');
      } else if (data.session) {
        console.log('OTP verified successfully, session created');
        setStatusMessage('Verified!');
        setStatusType('success');
      } else {
        console.log('OTP verified but no session returned');
        setStatusMessage('Verification succeeded. Signing you in...');
        setStatusType('info');
      }
    } catch (err) {
      console.log('OTP verification failed:', err);
      setStatusMessage('Verification failed. Please try again.');
      setStatusType('error');
    } finally {
      setIsVerifying(false);
    }
  }, [isOtpComplete, email, otpCode]);

  const handleResendCode = useCallback(async () => {
    if (!email) return;
    setStatusMessage('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        console.log('Resend error:', error.message);
        setStatusMessage('Could not resend. Try again later.');
        setStatusType('error');
      } else {
        setStatusMessage('New code sent to your email!');
        setStatusType('info');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.log('Resend failed:', err);
      setStatusMessage('Could not resend. Try again later.');
      setStatusType('error');
    }
  }, [email]);

  const handleBackToLogin = useCallback(() => {
    router.replace('/login');
  }, [router]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            <View style={styles.illustrationArea}>
              <Animated.View style={[styles.iconCircle, {
                transform: [{ scale: iconScale }, { scale: pulseAnim }],
              }]}>
                <View style={styles.iconInner}>
                  <ShieldCheck size={44} color={Colors.orange} strokeWidth={1.5} />
                </View>
              </Animated.View>
            </View>

            <Animated.View style={[styles.textArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.heading}>Enter verification code</Text>
              <Text style={styles.body}>
                We sent an 8-digit code to
              </Text>
              <Text style={styles.emailText}>{email || 'your email'}</Text>
            </Animated.View>

            <Animated.View style={[styles.otpContainer, { opacity: fadeAnim }]}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={Platform.OS === 'web' ? 8 : 1}
                  selectTextOnFocus
                  testID={`otp-input-${index}`}
                  autoFocus={index === 0}
                />
              ))}
            </Animated.View>

            <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
              <TouchableOpacity
                style={[styles.verifyBtn, (!isOtpComplete || isVerifying) && styles.verifyBtnDisabled]}
                onPress={handleVerify}
                disabled={!isOtpComplete || isVerifying}
                testID="verify-otp-btn"
                activeOpacity={0.8}
              >
                <Text style={styles.verifyBtnText}>
                  {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                </Text>
                {!isVerifying && <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />}
              </TouchableOpacity>

              {statusMessage !== '' && (
                <View style={[
                  styles.messageBubble,
                  statusType === 'success' && styles.messageBubbleSuccess,
                  statusType === 'error' && styles.messageBubbleError,
                  statusType === 'info' && styles.messageBubbleInfo,
                ]}>
                  <Text style={[
                    styles.messageText,
                    statusType === 'success' && styles.messageTextSuccess,
                    statusType === 'error' && styles.messageTextError,
                    statusType === 'info' && styles.messageTextInfo,
                  ]}>
                    {statusMessage}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResendCode}
                activeOpacity={0.7}
                testID="resend-code-btn"
              >
                <Text style={styles.resendBtnText}>Didn't get the code? Resend</Text>
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
        </KeyboardAvoidingView>
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
  flex: {
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
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.orangeMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  textArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 3,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 32,
  },
  otpInput: {
    width: 36,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    textAlign: 'center' as const,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  otpInputFilled: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  verifyBtn: {
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
  verifyBtnDisabled: {
    opacity: 0.4,
  },
  verifyBtnText: {
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
  messageBubbleError: {
    backgroundColor: Colors.redMuted,
  },
  messageBubbleInfo: {
    backgroundColor: Colors.amberMuted,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  messageTextSuccess: {
    color: Colors.emerald,
  },
  messageTextError: {
    color: Colors.red,
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
