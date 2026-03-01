import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import GlobeIllustration from '@/components/GlobeIllustration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { currentUser, isLoading } = useTrips();
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(0.8)).current;
  const splashLogoOpacity = useRef(new Animated.Value(0)).current;

  const logoAnim = useRef(new Animated.Value(0)).current;
  const globeAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;
  const bottomSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(splashLogoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(splashScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      if (currentUser && !isLoading) {
        router.replace('/dashboard');
        return;
      }

      Animated.timing(splashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setShowSplash(false);
        Animated.stagger(150, [
          Animated.parallel([
            Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(globeAnim, { toValue: 1, friction: 10, tension: 40, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(bottomAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(bottomSlide, { toValue: 0, friction: 10, tension: 50, useNativeDriver: true }),
          ]),
        ]).start();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentUser, isLoading]);

  useEffect(() => {
    if (!showSplash && currentUser && !isLoading) {
      router.replace('/dashboard');
    }
  }, [currentUser, isLoading, showSplash]);

  if (showSplash) {
    return (
      <View style={styles.splashRoot}>
        <Animated.View style={[styles.splashContent, { opacity: splashLogoOpacity, transform: [{ scale: splashScale }] }]}>
          <Image source={require('@/assets/images/roamly-logo.png')} style={styles.splashFullLogo} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.mainContent}>
          <Animated.View style={[styles.topSection, { opacity: logoAnim }]}>
            <Image source={require('@/assets/images/roamly-logo.png')} style={styles.mainLogo} />
            <Text style={styles.tagline}>Less talk, more travel.</Text>
          </Animated.View>

          <Animated.View style={[styles.illustrationContainer, { opacity: globeAnim, transform: [{ scale: globeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
            <GlobeIllustration size={Math.min(SCREEN_WIDTH * 0.7, 280)} />
          </Animated.View>

          <Animated.View style={[styles.bottomSection, { opacity: bottomAnim, transform: [{ translateY: bottomSlide }] }]}>
            <Text style={styles.legalText}>
              By tapping &apos;Start Planning&apos; you agree to our{' '}
              <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>

            <TouchableOpacity
              style={styles.startBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/signup')}
              testID="start-planning-btn"
            >
              <Text style={styles.startBtnText}>Start Planning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signInBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/login')}
              testID="sign-in-btn"
            >
              <Text style={styles.signInBtnText}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  splashRoot: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    gap: 16,
  },
  splashFullLogo: {
    width: 220,
    height: 80,
    resizeMode: 'contain',
  },
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: { flex: 1 },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 24,
  },
  topSection: {
    alignItems: 'center',
    gap: 16,
  },
  mainLogo: {
    width: 200,
    height: 70,
    resizeMode: 'contain',
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  legalText: {
    fontSize: 11,
    color: Colors.textDim,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  legalLink: {
    color: Colors.orange,
    textDecorationLine: 'underline',
  },
  startBtn: {
    width: '100%',
    backgroundColor: Colors.orange,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF5C5C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  signInBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  signInBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#444444',
  },
});
