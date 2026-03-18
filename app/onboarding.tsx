import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, ThumbsUp, Sparkles } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingStep {
  icon: React.ReactNode;
  badge: string;
  headline: string;
  subtext: string;
  accent: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: <Users size={48} color="#FFFFFF" strokeWidth={1.8} />,
    badge: 'Plan together',
    headline: 'Stop texting\nback and forth',
    subtext: 'Roamly finds dates and plans that work for everyone.',
    accent: '#FF5C5C',
  },
  {
    icon: <ThumbsUp size={48} color="#FFFFFF" strokeWidth={1.8} />,
    badge: 'Everyone votes',
    headline: 'Your preferences\nmatter',
    subtext: 'Every member submits what they want and the AI finds the perfect overlap.',
    accent: '#FFBA00',
  },
  {
    icon: <Sparkles size={48} color="#FFFFFF" strokeWidth={1.8} />,
    badge: 'AI does the work',
    headline: 'One perfect\nplan',
    subtext: 'Flights, hotels, activities and restaurants picked for your whole group.',
    accent: '#30B877',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { currentUser, completeOnboarding } = useTrips();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const animateTransition = useCallback((nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
      Animated.timing(iconScale, { toValue: 0.8, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(30);
      iconScale.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 10, tension: 60, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, iconScale]);

  const finishOnboarding = useCallback(() => {
    console.log('Finishing onboarding flow', { currentUserId: currentUser?.id ?? 'unknown' });
    completeOnboarding();
    router.replace('/dashboard');
  }, [completeOnboarding, currentUser?.id, router]);

  const handleNext = useCallback(() => {
    if (isLast) {
      finishOnboarding();
    } else {
      animateTransition(currentStep + 1);
    }
  }, [animateTransition, currentStep, finishOnboarding, isLast]);

  const handleSkip = useCallback(() => {
    finishOnboarding();
  }, [finishOnboarding]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0f2027', '#1a3a4a', '#2c5364']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowOrb, { backgroundColor: step.accent, top: '12%', left: -60 }]} />
      <View style={[styles.glowOrb, { backgroundColor: step.accent, top: '50%', right: -80, width: 300, height: 300 }]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          {!isLast ? (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} testID="skip-btn">
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipBtn} />
          )}
        </View>

        <View style={styles.body}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: step.accent,
                opacity: fadeAnim,
                transform: [{ scale: iconScale }],
              },
            ]}
          >
            {step.icon}
          </Animated.View>

          <Animated.View style={[styles.textArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.badge, { backgroundColor: `${step.accent}22` }]}>
              <Text style={[styles.badgeText, { color: step.accent }]}>{step.badge}</Text>
            </View>
            <Text style={styles.headline}>{step.headline}</Text>
            <Text style={styles.subtext}>{step.subtext}</Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentStep
                    ? { backgroundColor: '#FFFFFF', width: 24 }
                    : { backgroundColor: 'rgba(255,255,255,0.25)' },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: step.accent }]}
            onPress={handleNext}
            activeOpacity={0.85}
            testID="onboarding-next-btn"
          >
            <Text style={styles.nextBtnText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f2027',
  },
  safe: {
    flex: 1,
  },
  glowOrb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right' as const,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  textArea: {
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: 16,
  },
  subtext: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center' as const,
    lineHeight: 26,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  nextBtn: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
