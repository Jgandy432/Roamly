import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';

type Step = 'email' | 'name';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useTrips();
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [step, setStep] = useState<Step>('email');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      inputRef.current?.focus();
    });
  }, [step]);

  const handleContinue = () => {
    if (step === 'email' && email.includes('@')) {
      setStep('name');
    } else if (step === 'name' && name.trim().length > 1) {
      login(email, name.trim());
      router.replace('/dashboard');
    }
  };

  const handleBack = () => {
    if (step === 'name') {
      setStep('email');
    } else {
      router.back();
    }
  };

  const isValid = step === 'email' ? email.includes('@') : name.trim().length > 1;
  const progress = step === 'email' ? 0.5 : 1;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              testID="back-btn"
            >
              <ChevronLeft size={22} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
            <View style={styles.backBtnPlaceholder} />
          </View>

          <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {step === 'email' ? (
                <>
                  <Text style={styles.heading}>Welcome back</Text>
                  <Text style={styles.subtitle}>Enter your email to sign in.</Text>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textDark}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={handleContinue}
                    testID="email-input"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.heading}>Confirm your name</Text>
                  <Text style={styles.subtitle}>This is how your group will see you.</Text>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={Colors.textDark}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    testID="name-input"
                  />
                </>
              )}
            </Animated.View>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
                onPress={handleContinue}
                disabled={!isValid}
                activeOpacity={0.85}
                testID="continue-btn"
              >
                <Text style={styles.continueBtnText}>
                  {step === 'email' ? 'Continue' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              {step === 'email' && (
                <TouchableOpacity
                  style={styles.switchLink}
                  onPress={() => { router.back(); router.push('/signup'); }}
                >
                  <Text style={styles.switchLinkText}>
                    Don't have an account? <Text style={styles.switchLinkAccent}>Sign up</Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPlaceholder: {
    width: 40,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.orange,
    borderRadius: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    marginBottom: 28,
    lineHeight: 22,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: Colors.text,
  },
  bottomArea: {
    paddingBottom: 16,
  },
  continueBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnDisabled: {
    opacity: 0.35,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  switchLink: {
    alignItems: 'center',
    marginTop: 18,
  },
  switchLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  switchLinkAccent: {
    color: Colors.orange,
    fontWeight: '600' as const,
  },
});
