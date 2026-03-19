import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import BottomTabBar from '@/components/BottomTabBar';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthLoading } = useTrips();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isValid = email.includes('@') && password.length >= 8;

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleContinue = async () => {
    if (!isValid) return;
    try {
      console.log('Submitting login request', { email });
      await login(email.trim().toLowerCase(), password);
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to sign in');
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
              <ChevronLeft size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in with your Roamly account.</Text>
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={Colors.textDark} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} testID="email-input" />
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.textDark} value={password} onChangeText={setPassword} secureTextEntry testID="password-input" />
              <TouchableOpacity onPress={handleForgotPassword} testID="forgot-password-btn">
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.bottomArea}>
              <TouchableOpacity style={[styles.continueBtn, (!isValid || isAuthLoading) && styles.continueBtnDisabled]} onPress={handleContinue} disabled={!isValid || isAuthLoading} testID="continue-btn">
                <Text style={styles.continueBtnText}>{isAuthLoading ? 'Signing In...' : 'Sign In'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.switchLink} onPress={() => router.push('/signup')}>
                <Text style={styles.switchLinkText}>Need an account? <Text style={styles.switchLinkAccent}>Sign up</Text></Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 32, justifyContent: 'space-between' },
  heading: { fontSize: 28, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textMuted, marginBottom: 24, lineHeight: 22 },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, fontSize: 17, color: Colors.text, marginBottom: 14 },
  bottomArea: { paddingBottom: 16 },
  continueBtn: { backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  continueBtnDisabled: { opacity: 0.35 },
  continueBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  switchLink: { alignItems: 'center', marginTop: 18 },
  switchLinkText: { fontSize: 14, color: Colors.textMuted },
  switchLinkAccent: { color: Colors.orange, fontWeight: '600' as const },
  forgotText: { fontSize: 14, color: Colors.orange, fontWeight: '500' as const, marginBottom: 8, marginTop: 2 },
});
