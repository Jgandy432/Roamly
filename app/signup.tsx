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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';

type Step = 'email' | 'phone' | 'name';

const STEP_CONFIG: Record<Step, { title: string; subtitle: string; placeholder: string }> = {
  email: {
    title: "What's your email?",
    subtitle: "We'll use this to keep your trips safe.",
    placeholder: 'you@example.com',
  },
  phone: {
    title: "What's your number?",
    subtitle: 'So your group can reach you.',
    placeholder: '(555) 123-4567',
  },
  name: {
    title: "What should we call you?",
    subtitle: 'This is how your group will see you.',
    placeholder: 'Your name',
  },
};

const STEPS: Step[] = ['email', 'phone', 'name'];

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useTrips();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const inputRef = useRef<TextInput>(null);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

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

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhone(text));
  };

  const isStepValid = () => {
    switch (step) {
      case 'email': return email.includes('@') && email.includes('.');
      case 'phone': return phone.replace(/\D/g, '').length >= 7;
      case 'name': return name.trim().length >= 2;
    }
  };

  const handleContinue = () => {
    if (!isStepValid()) return;
    if (step === 'email') {
      setStep('phone');
    } else if (step === 'phone') {
      setStep('name');
    } else if (step === 'name') {
      login(email, name.trim());
      router.replace('/dashboard');
    }
  };

  const handleBack = () => {
    if (step === 'email') {
      router.back();
    } else if (step === 'phone') {
      setStep('email');
    } else if (step === 'name') {
      setStep('phone');
    }
  };

  const getValue = () => {
    switch (step) {
      case 'email': return email;
      case 'phone': return phone;
      case 'name': return name;
    }
  };

  const handleChange = (text: string) => {
    switch (step) {
      case 'email': setEmail(text); break;
      case 'phone': handlePhoneChange(text); break;
      case 'name': setName(text); break;
    }
  };

  const getKeyboardType = (): 'email-address' | 'phone-pad' | 'default' => {
    switch (step) {
      case 'email': return 'email-address';
      case 'phone': return 'phone-pad';
      case 'name': return 'default';
    }
  };

  const config = STEP_CONFIG[step];

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
              <Text style={styles.heading}>{config.title}</Text>
              <Text style={styles.subtitle}>{config.subtitle}</Text>

              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={config.placeholder}
                placeholderTextColor={Colors.textDark}
                value={getValue()}
                onChangeText={handleChange}
                keyboardType={getKeyboardType()}
                autoCapitalize={step === 'name' ? 'words' : 'none'}
                autoCorrect={false}
                returnKeyType={step === 'name' ? 'done' : 'next'}
                onSubmitEditing={handleContinue}
                testID={`${step}-input`}
              />
            </Animated.View>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[styles.continueBtn, !isStepValid() && styles.continueBtnDisabled]}
                onPress={handleContinue}
                disabled={!isStepValid()}
                activeOpacity={0.85}
                testID="continue-btn"
              >
                <Text style={styles.continueBtnText}>
                  {step === 'name' ? "Let's Go" : 'Continue'}
                </Text>
              </TouchableOpacity>

              {step === 'email' && (
                <Text style={styles.termsText}>
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </Text>
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
  termsText: {
    fontSize: 12,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 17,
  },
});
