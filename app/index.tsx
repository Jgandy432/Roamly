import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { currentUser, isLoading } = useTrips();
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const bgPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentUser && !isLoading) { router.replace('/dashboard'); return; }

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(bgPulse, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, friction: 10, tension: 50, useNativeDriver: true }),
      ]).start();
    }, 400);
    return () => clearTimeout(timer);
  }, [currentUser, isLoading]);

  const bgScale = bgPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.bgWrap, { transform: [{ scale: bgScale }] }]}>
        <LinearGradient
          colors={['#0f2027', '#203a43', '#2c5364']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bgGradient}
        />
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </Animated.View>
      <View style={styles.scrim} />
      <SafeAreaView style={styles.flex}>
        <View style={styles.layout}>
          <Animated.View style={[styles.logoWrap, { opacity: cardAnim }]}>
            <Image source={require('@/assets/images/roamly-logo.png')} style={styles.logo} />
          </Animated.View>
          <Animated.View style={[styles.cardWrap, { opacity: cardAnim, transform: [{ translateY: cardSlide }] }]}>
            <BlurView intensity={60} tint="light" style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.headline}>Less talk,{'\n'}more travel.</Text>
                <Text style={styles.sub}>Plan group trips in minutes.{'\n'}Everyone's preferences, one perfect plan.</Text>
                <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.88} onPress={() => router.push('/signup')}>
                  <Text style={styles.primaryBtnText}>Start Planning ✈️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.7} onPress={() => router.push('/login')}>
                  <Text style={styles.secondaryBtnText}>I already have an account</Text>
                </TouchableOpacity>
                <Text style={styles.legal}>By continuing you agree to our <Text style={styles.legalLink}>Terms</Text> & <Text style={styles.legalLink}>Privacy Policy</Text></Text>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f2027' },
  flex: { flex: 1 },
  bgWrap: { position: 'absolute', top: -40, left: -40, width: W + 80, height: H + 80 },
  bgGradient: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  orb1: { position: 'absolute', top: H * 0.12, left: W * 0.1, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,140,50,0.18)' },
  orb2: { position: 'absolute', top: H * 0.45, right: -40, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(37,99,235,0.15)' },
  orb3: { position: 'absolute', bottom: H * 0.1, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(16,185,129,0.12)' },
  scrim: { position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: 'rgba(0,0,0,0.2)' },
  layout: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 24, paddingHorizontal: 24 },
  logoWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', paddingBottom: H * 0.25 },
  logo: { width: 320, height: 104, resizeMode: 'contain' },
  cardWrap: { width: '100%', borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 40, elevation: 20 },
  card: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  cardInner: { padding: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  headline: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8, lineHeight: 42, marginBottom: 10 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 28 },
  primaryBtn: { backgroundColor: Colors.orange, borderRadius: 50, paddingVertical: 18, alignItems: 'center', marginBottom: 12, shadowColor: Colors.orange, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  primaryBtnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  secondaryBtn: { paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  legal: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 17 },
  legalLink: { color: 'rgba(255,255,255,0.8)', textDecorationLine: 'underline' },
});
