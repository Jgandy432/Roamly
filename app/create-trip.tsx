import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, Search } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { POPULAR_DESTINATIONS } from '@/constants/data';
import BottomTabBar from '@/components/BottomTabBar';

type Step = 'name' | 'destination' | 'travelers';

const STEPS: Step[] = ['name', 'destination', 'travelers'];

const STEP_HEADLINES: Record<Step, string> = {
  name: 'Name your trip',
  destination: 'Where are you dreaming of?',
  travelers: "How many are going?",
};

function getTravelerLabel(count: number): string {
  if (count === 1) return 'Just you';
  if (count === 2) return 'You + 1';
  if (count <= 5) return 'A small group';
  return 'A big group';
}

export default function CreateTripScreen() {
  const router = useRouter();
  const { createTrip } = useTrips();
  const [stepIndex, setStepIndex] = useState<number>(0);

  const [tripName, setTripName] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [openToSuggestions, setOpenToSuggestions] = useState<boolean>(false);
  const [travelers, setTravelers] = useState<number>(2);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const step = STEPS[stepIndex];
  const progress = (stepIndex + 1) / STEPS.length;
  const isLastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [stepIndex]);

  const isStepValid = useCallback((): boolean => {
    switch (step) {
      case 'name': return tripName.trim().length > 0;
      case 'destination': return openToSuggestions || destination.trim().length > 0;
      case 'travelers': return true;
      default: return false;
    }
  }, [step, tripName, destination, openToSuggestions]);

  const handleNext = useCallback(() => {
    if (!isStepValid()) return;
    if (isLastStep) {
      const destText = openToSuggestions ? 'AI to recommend' : destination.trim();
      createTrip({
        name: tripName.trim(),
        destination: destText,
        groupSize: travelers,
        constraints: '',
      });
      router.push('/trip');
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [isStepValid, isLastStep, tripName, destination, openToSuggestions, travelers]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0) {
      router.back();
    } else {
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const filteredDestinations = useMemo(() => {
    if (!destination.trim() || openToSuggestions) return [];
    const q = destination.toLowerCase();
    return POPULAR_DESTINATIONS.filter((d) => d.toLowerCase().includes(q)).slice(0, 6);
  }, [destination, openToSuggestions]);

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cabo 2026, Girls Trip, Europe Summer..."
              placeholderTextColor={Colors.textDark}
              value={tripName}
              onChangeText={setTripName}
              autoFocus
              testID="trip-name-input"
            />
          </View>
        );

      case 'destination':
        return (
          <View>
            <View style={styles.searchInputWrap}>
              <Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search a city or country"
                placeholderTextColor={Colors.textDark}
                value={destination}
                onChangeText={(t) => { setDestination(t); setShowAutocomplete(t.trim().length > 0); }}
                editable={!openToSuggestions}
                autoFocus={!openToSuggestions}
                onFocus={() => setShowAutocomplete(destination.trim().length > 0)}
                testID="destination-input"
              />
            </View>
            {showAutocomplete && filteredDestinations.length > 0 && !openToSuggestions && (
              <View style={styles.autocompleteList}>
                {filteredDestinations.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={styles.autocompleteItem}
                    onPress={() => { setDestination(d); setShowAutocomplete(false); }}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.autocompleteText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => { setOpenToSuggestions(!openToSuggestions); if (!openToSuggestions) { setDestination(''); setShowAutocomplete(false); } }}
              activeOpacity={0.7}
            >
              <View style={[styles.toggleCheck, openToSuggestions && styles.toggleCheckActive]}>
                {openToSuggestions && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>Let Roamly suggest a destination</Text>
            </TouchableOpacity>
          </View>
        );

      case 'travelers':
        return (
          <View style={styles.travelersContainer}>
            <Text style={styles.travelerCount}>{travelers}</Text>
            <Text style={styles.travelerLabel}>{getTravelerLabel(travelers)}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[styles.stepperBtn, travelers <= 1 && styles.stepperBtnDisabled]}
                onPress={() => setTravelers((n) => Math.max(1, n - 1))}
                disabled={travelers <= 1}
                activeOpacity={0.7}
              >
                <Minus size={22} color={travelers <= 1 ? Colors.textDark : Colors.text} />
              </TouchableOpacity>
              <View style={styles.stepperTrack}>
                <View style={[styles.stepperFill, { width: `${Math.min(((travelers - 1) / 19) * 100, 100)}%` }]} />
              </View>
              <TouchableOpacity
                style={[styles.stepperBtn, travelers >= 20 && styles.stepperBtnDisabled]}
                onPress={() => setTravelers((n) => Math.min(20, n + 1))}
                disabled={travelers >= 20}
                activeOpacity={0.7}
              >
                <Plus size={22} color={travelers >= 20 ? Colors.textDark : Colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} testID="back-btn">
              <ChevronLeft size={22} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepIndicatorText}>{stepIndex + 1}/{STEPS.length}</Text>
            </View>
          </View>

          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <Text style={styles.heading}>{STEP_HEADLINES[step]}</Text>
                <View style={styles.stepContent}>
                  {renderStep()}
                </View>
              </Animated.View>
            </ScrollView>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[styles.continueBtn, !isStepValid() && styles.continueBtnDisabled]}
                onPress={handleNext}
                disabled={!isStepValid()}
                activeOpacity={0.85}
                testID="continue-btn"
              >
                <Text style={styles.continueBtnText}>
                  {isLastStep ? 'Create Trip' : 'Continue'}
                </Text>
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
  progressBarContainer: { flex: 1 },
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
  stepIndicator: { width: 40, alignItems: 'flex-end' },
  stepIndicatorText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  container: { flex: 1, justifyContent: 'space-between' },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  stepContent: {},
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
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: Colors.text,
    paddingVertical: 16,
  },
  autocompleteList: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  autocompleteItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  autocompleteText: {
    fontSize: 15,
    color: Colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingVertical: 4,
  },
  toggleCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCheckActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  toggleLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  travelersContainer: { alignItems: 'center', gap: 8 },
  travelerCount: {
    fontSize: 72,
    fontWeight: '800' as const,
    color: Colors.orange,
    lineHeight: 82,
  },
  travelerLabel: {
    fontSize: 17,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    marginBottom: 28,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  stepperBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: { opacity: 0.35 },
  stepperTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepperFill: {
    height: 4,
    backgroundColor: Colors.orange,
    borderRadius: 2,
  },
  bottomArea: {
    paddingHorizontal: 28,
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
  continueBtnDisabled: { opacity: 0.35 },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
