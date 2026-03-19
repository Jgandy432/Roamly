import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, KeyRound, ShieldCheck, Lock } from 'lucide-react-native';

import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/colors';

const OTP_LENGTH = 8;

type Step = 'email' | 'otp' | 'new-password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    iconScale.setValue(0);

    Animated.sequence([
      Animated.spring(iconScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, iconScale]);

  useEffect(() => {
    animateIn();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [animateIn, pulseAnim]);

  useEffect(() => {
    animateIn();
    setStatusMessage('');
  }, [step, animateIn]);

  const handleSendCode = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setStatusMessage('Please enter a valid email address.');
      setStatusType('error');
      return;
    }
    setIsLoading(true);
    setStatusMessage('');
    try {
      console.log('Sending password reset OTP to:', trimmed);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (error) throw error;
      console.log('Reset email sent successfully');
      setStep('otp');
    } catch (err) {
      console.log('Reset email error:', err);
      setStatusMessage(err instanceof Error ? err.message : 'Unable to send reset email.');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

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

  const handleVerifyOtp = useCallback(async () => {
    if (!isOtpComplete) return;
    setIsLoading(true);
    setStatusMessage('');
    try {
      console.log('Verifying recovery OTP for:', email.trim().toLowerCase());
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: 'recovery',
      });

      if (error) {
        console.log('Recovery OTP error:', error.message);
        setStatusMessage(error.message);
        setStatusType('error');
      } else if (data.session) {
        console.log('Recovery OTP verified, session created');
        setStep('new-password');
      } else {
        console.log('Recovery OTP verified but no session');
        setStatusMessage('Verification succeeded but no session was created. Please try again.');
        setStatusType('error');
      }
    } catch (err) {
      console.log('Recovery OTP verification failed:', err);
      setStatusMessage('Verification failed. Please try again.');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  }, [isOtpComplete, email, otpCode]);

  const handleUpdatePassword = useCallback(async () => {
    if (newPassword.length < 8) {
      setStatusMessage('Password must be at least 8 characters.');
      setStatusType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage('Passwords do not match.');
      setStatusType('error');
      return;
    }
    setIsLoading(true);
    setStatusMessage('');
    try {
      console.log('Updating password...');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.log('Password update error:', error.message);
        setStatusMessage(error.message);
        setStatusType('error');
      } else {
        console.log('Password updated successfully');
        Alert.alert('Password updated', 'Your password has been reset. You can now sign in.', [
          { text: 'Sign In', onPress: () => router.replace('/login') },
        ]);
      }
    } catch (err) {
      console.log('Password update failed:', err);
      setStatusMessage('Could not update password. Please try again.');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  }, [newPassword, confirmPassword, router]);

  const handleResendCode = useCallback(async () => {
    setStatusMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) {
        setStatusMessage('Could not resend. Try again later.');
        setStatusType('error');
      } else {
        setStatusMessage('New code sent to your email!');
        setStatusType('info');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setStatusMessage('Could not resend. Try again later.');
      setStatusType('error');
    }
  }, [email]);

  const getIcon = () => {
    switch (step) {
      case 'email': return <KeyRound size={44} color={Colors.orange} strokeWidth={1.5} />;
      case 'otp': return <ShieldCheck size={44} color={Colors.orange} strokeWidth={1.5} />;
      case 'new-password': return <Lock size={44} color={Colors.orange} strokeWidth={1.5} />;
    }
  };

  const renderEmailStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.body}>Enter the email address associated with your account and we'll send you a code.</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={Colors.textDark}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        testID="reset-email-input"
      />
      <TouchableOpacity
        style={[styles.primaryBtn, (!email.includes('@') || isLoading) && styles.primaryBtnDisabled]}
        onPress={handleSendCode}
        disabled={!email.includes('@') || isLoading}
        activeOpacity={0.8}
        testID="send-code-btn"
      >
        <Text style={styles.primaryBtnText}>{isLoading ? 'Sending...' : 'Send Code'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOtpStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.heading}>Enter reset code</Text>
      <Text style={styles.body}>We sent an 8-digit code to</Text>
      <Text style={styles.emailText}>{email.trim().toLowerCase()}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={Platform.OS === 'web' ? 8 : 1}
            selectTextOnFocus
            testID={`reset-otp-input-${index}`}
            autoFocus={index === 0}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, (!isOtpComplete || isLoading) && styles.primaryBtnDisabled]}
        onPress={handleVerifyOtp}
        disabled={!isOtpComplete || isLoading}
        activeOpacity={0.8}
        testID="verify-reset-otp-btn"
      >
        <Text style={styles.primaryBtnText}>{isLoading ? 'Verifying...' : 'Verify Code'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={handleResendCode} activeOpacity={0.7} testID="resend-reset-code-btn">
        <Text style={styles.secondaryBtnText}>Didn't get the code? Resend</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderNewPasswordStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.heading}>Set new password</Text>
      <Text style={styles.body}>Choose a strong password with at least 8 characters.</Text>
      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor={Colors.textDark}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoFocus
        testID="new-password-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor={Colors.textDark}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        testID="confirm-password-input"
      />
      <TouchableOpacity
        style={[styles.primaryBtn, (newPassword.length < 8 || confirmPassword.length < 8 || isLoading) && styles.primaryBtnDisabled]}
        onPress={handleUpdatePassword}
        disabled={newPassword.length < 8 || confirmPassword.length < 8 || isLoading}
        activeOpacity={0.8}
        testID="update-password-btn"
      >
        <Text style={styles.primaryBtnText}>{isLoading ? 'Updating...' : 'Update Password'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (step === 'otp') {
                  setStep('email');
                  setOtp(Array(OTP_LENGTH).fill(''));
                } else {
                  router.back();
                }
              }}
              testID="forgot-back-btn"
            >
              <ChevronLeft size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.illustrationArea}>
              <Animated.View style={[styles.iconCircle, { transform: [{ scale: iconScale }, { scale: pulseAnim }] }]}>
                <View style={styles.iconInner}>
                  {getIcon()}
                </View>
              </Animated.View>
            </View>

            {step === 'email' && renderEmailStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'new-password' && renderNewPasswordStep()}

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

            <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/login')} activeOpacity={0.7}>
              <Text style={styles.loginLinkText}>Back to <Text style={styles.loginLinkAccent}>Sign In</Text></Text>
            </TouchableOpacity>
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
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  illustrationArea: {
    width: 120,
    height: 120,
    marginBottom: 28,
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
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: Colors.text,
    marginBottom: 14,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
    marginTop: 8,
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
  primaryBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    marginTop: 18,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.orange,
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
  loginLink: {
    marginTop: 24,
    paddingVertical: 12,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  loginLinkAccent: {
    color: Colors.orange,
    fontWeight: '600' as const,
  },
});
