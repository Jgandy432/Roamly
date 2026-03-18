import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { currentUser, isLoading } = useTrips();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const bottomFade = useRef(new Animated.Value(0)).current;
  const bottomSlide = useRef(new Animated.Value(50)).current;
  const bgPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentUser && !isLoading) {
      const nextRoute = currentUser.hasCompletedOnboarding ? '/dashboard' : '/onboarding';
      console.log('Routing from welcome screen', { nextRoute, hasCompletedOnboarding: currentUser.hasCompletedOnboarding });
      router.replace(nextRoute);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(bgPulse, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 12, tension: 40, delay: 300, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(bottomFade, { toValue: 1, duration: 700, delay: 700, useNativeDriver: true }),
      Animated.spring(bottomSlide, { toValue: 0, friction: 12, tension: 40, delay: 700, useNativeDriver: true }),
    ]).start();
  }, [bgPulse, bottomFade, bottomSlide, currentUser, fadeIn, isLoading, router, slideUp]);

  const bgScale = bgPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.bgWrap, { transform: [{ scale: bgScale }] }]}>
        <LinearGradient
          colors={['#0f2027', '#1a3a4a', '#2c5364']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bgGradient}
        />
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </Animated.View>
      <View style={styles.scrim} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.View style={[styles.brandArea, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <Image source={require('@/assets/images/roamly-logo.png')} style={styles.logo} />
            <Text style={styles.headline}>Less talk, more travel.</Text>
          </Animated.View>

          <Animated.View style={[styles.bottomArea, { opacity: bottomFade, transform: [{ translateY: bottomSlide }] }]}>
            <Text style={styles.legal}>
              {"By continuing you agree to our "}<Text style={styles.legalLink}>Terms of Service</Text>{" and "}<Text style={styles.legalLink}>Privacy Policy</Text>{"."}            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/signup')}
              testID="start-planning-btn"
            >
              <Text style={styles.primaryBtnText}>Start Planning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signInBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/login')}
              testID="sign-in-btn"
            >
              <Text style={styles.signInText}>I already have an account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f2027' },
  safe: { flex: 1 },
  bgWrap: { position: 'absolute', top: -40, left: -40, width: W + 80, height: H + 80 },
  bgGradient: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  orb1: { position: 'absolute', top: H * 0.08, left: W * 0.05, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,140,50,0.14)' },
  orb2: { position: 'absolute', top: H * 0.4, right: -50, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(37,99,235,0.12)' },
  orb3: { position: 'absolute', bottom: H * 0.08, left: -70, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(16,185,129,0.1)' },
  scrim: { position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: 'rgba(0,0,0,0.25)' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 28 },
  brandArea: { alignItems: 'center', paddingTop: H * 0.1 },
  logo: { width: W * 0.9, height: 200, resizeMode: 'contain' as const, marginBottom: 32 },
  headline: { fontSize: 26, fontWeight: '800' as const, color: '#FFFFFF', textAlign: 'center' as const, letterSpacing: -0.5, lineHeight: 34 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center' as const, lineHeight: 24, marginTop: 14 },
  bottomArea: { paddingBottom: 16 },
  legal: { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' as const, lineHeight: 18, marginBottom: 20, paddingHorizontal: 12 },
  legalLink: { color: 'rgba(255,255,255,0.7)', textDecorationLine: 'underline' as const },
  primaryBtn: { backgroundColor: Colors.orange, borderRadius: 50, paddingVertical: 18, alignItems: 'center' as const, marginBottom: 14, shadowColor: Colors.orange, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  primaryBtnText: { fontSize: 17, fontWeight: '700' as const, color: '#FFFFFF', letterSpacing: 0.3 },
  signInBtn: { paddingVertical: 12, alignItems: 'center' as const },
  signInText: { fontSize: 15, fontWeight: '600' as const, color: '#FFFFFF' },
});
