import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { UserPreferences } from '@/types/trip';
import BottomTabBar from '@/components/BottomTabBar';

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  'Your Availability',
  'Getting There',
  'Where You Will Stay',
  'Getting Around',
  'Activities & Excursions',
  'Food & Drink',
  'Overall Budget',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const NONSTOP_OPTIONS = ['Yes', 'Layovers ok', 'No preference'];
const DEPART_TIME_OPTIONS = ['Early morning', 'Morning', 'Afternoon', 'Evening', 'No preference'];
const ACCOMMODATION_TYPES = ['Hotel', 'Airbnb', 'Resort', 'Hostel', 'No preference'];
const ACCOMMODATION_MUST_HAVES = ['Pool', 'Gym', 'Kitchen', 'Free breakfast', 'Parking', 'Pet friendly'];
const RENTAL_CAR_OPTIONS = ['Yes', 'No', 'Maybe'];
const DRIVER_OPTIONS = ['Yes', 'No'];
const VEHICLE_OPTIONS = ['Standard', 'SUV', 'Van', 'No preference'];
const ACTIVITY_INTERESTS = ['Adventure', 'Relaxation', 'Culture', 'Nightlife', 'Food tours', 'Nature', 'Shopping', 'Wellness'];
const DINING_STYLES = ['Casual', 'Mid-range', 'Fine dining', 'Mix'];
const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'Nut allergy'];
const FOOD_MUST_HAVES = ['Local spots', 'Rooftop bars', 'Late night eats', 'Coffee shops', 'Food markets'];
const BUDGET_FLEX_OPTIONS = ['Strict', 'A little flexible', 'Very flexible'];

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function PreferencesScreen() {
  const router = useRouter();
  const { activeTrip, currentUser, submitPreferences } = useTrips();
  const existing = activeTrip?.members.find((m) => m.id === currentUser?.id)?.preferences;

  const [stepIndex, setStepIndex] = useState<number>(0);

  const [availableDates, setAvailableDates] = useState<string[]>(existing?.availableDates ?? []);
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());

  const [flightAirport, setFlightAirport] = useState<string>(existing?.flightAirport ?? '');
  const [flightNonstop, setFlightNonstop] = useState<string>(existing?.flightNonstop ?? '');
  const [flightDepartTime, setFlightDepartTime] = useState<string>(existing?.flightDepartTime ?? '');
  const [flightBudget, setFlightBudget] = useState<string>(existing?.flightBudget ? String(existing.flightBudget) : '');

  const [accommodationType, setAccommodationType] = useState<string>(existing?.accommodationType ?? '');
  const [accommodationNightlyBudget, setAccommodationNightlyBudget] = useState<string>(existing?.accommodationNightlyBudget ? String(existing.accommodationNightlyBudget) : '');
  const [accommodationMustHaves, setAccommodationMustHaves] = useState<string[]>(existing?.accommodationMustHaves ?? []);

  const [needsRentalCar, setNeedsRentalCar] = useState<string>(existing?.needsRentalCar ?? '');
  const [isDriver, setIsDriver] = useState<string>(existing?.isDriver ?? '');
  const [vehiclePreference, setVehiclePreference] = useState<string>(existing?.vehiclePreference ?? '');

  const [activityInterests, setActivityInterests] = useState<string[]>(existing?.activityInterests ?? []);
  const [activityDailyBudget, setActivityDailyBudget] = useState<string>(existing?.activityDailyBudget ? String(existing.activityDailyBudget) : '');
  const [activityMustDo, setActivityMustDo] = useState<string>(existing?.activityMustDo ?? '');
  const [activityWontDo, setActivityWontDo] = useState<string>(existing?.activityWontDo ?? '');

  const [diningStyle, setDiningStyle] = useState<string>(existing?.diningStyle ?? '');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(existing?.dietaryRestrictions ?? []);
  const [foodDailyBudget, setFoodDailyBudget] = useState<string>(existing?.foodDailyBudget ? String(existing.foodDailyBudget) : '');
  const [foodMustHaves, setFoodMustHaves] = useState<string[]>(existing?.foodMustHaves ?? []);

  const [totalBudget, setTotalBudget] = useState<string>(existing?.totalBudget ? String(existing.totalBudget) : '');
  const [budgetFlexibility, setBudgetFlexibility] = useState<string>(existing?.budgetFlexibility ?? '');
  const [mustHave, setMustHave] = useState<string>(existing?.mustHave ?? '');
  const [dealBreaker, setDealBreaker] = useState<string>(existing?.dealBreaker ?? '');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [stepIndex]);

  const progress = (stepIndex + 1) / TOTAL_STEPS;

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calYear, calMonth]);

  const toggleDate = useCallback((day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const key = formatDateKey(calYear, calMonth, day);
    setAvailableDates((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }, [calYear, calMonth]);

  const toggleMultiSelect = useCallback((item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const selectSingle = useCallback((value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((i) => i + 1);
    } else {
      const prefs: UserPreferences = {
        availableDates,
        flightAirport,
        flightNonstop,
        flightDepartTime,
        flightBudget: Number(flightBudget) || 0,
        accommodationType,
        accommodationNightlyBudget: Number(accommodationNightlyBudget) || 0,
        accommodationMustHaves,
        needsRentalCar,
        isDriver,
        vehiclePreference,
        activityInterests,
        activityDailyBudget: Number(activityDailyBudget) || 0,
        activityMustDo,
        activityWontDo,
        diningStyle,
        dietaryRestrictions,
        foodDailyBudget: Number(foodDailyBudget) || 0,
        foodMustHaves,
        totalBudget: Number(totalBudget) || 0,
        budgetFlexibility,
        mustHave,
        dealBreaker,
      };
      submitPreferences(prefs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', 'Your preferences have been submitted.');
      router.back();
    }
  }, [stepIndex, availableDates, flightAirport, flightNonstop, flightDepartTime, flightBudget, accommodationType, accommodationNightlyBudget, accommodationMustHaves, needsRentalCar, isDriver, vehiclePreference, activityInterests, activityDailyBudget, activityMustDo, activityWontDo, diningStyle, dietaryRestrictions, foodDailyBudget, foodMustHaves, totalBudget, budgetFlexibility, mustHave, dealBreaker]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0) {
      router.back();
    } else {
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const renderTappableCards = (options: string[], selected: string, onSelect: (v: string) => void) => (
    <View style={styles.cardsGrid}>
      {options.map((opt) => {
        const isSelected = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.tappableCard, isSelected && styles.tappableCardSelected]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <View style={styles.cardCheck}>
                <Check size={14} color="#FFF" strokeWidth={3} />
              </View>
            )}
            <Text style={[styles.tappableCardText, isSelected && styles.tappableCardTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderChips = (options: string[], selected: string[], onToggle: (v: string) => void) => (
    <View style={styles.chipsWrap}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(opt)}
            activeOpacity={0.7}
          >
            {isSelected && <Check size={14} color={Colors.orange} strokeWidth={3} style={{ marginRight: 4 }} />}
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBudgetInput = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <View style={styles.budgetInputWrap}>
      <Text style={styles.dollarPrefix}>$</Text>
      <TextInput
        style={styles.budgetInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={Colors.textDark}
      />
    </View>
  );

  const renderStep = () => {
    switch (stepIndex) {
      case 0:
        return (
          <View>
            <Text style={styles.stepQuestion}>When are you free to travel?</Text>
            <Text style={styles.stepHint}>Tap dates to mark them as available</Text>
            <View style={styles.calendarCard}>
              <View style={styles.calHeader}>
                <TouchableOpacity onPress={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
                  else { setCalMonth((m) => m - 1); }
                }} style={styles.calNavBtn}>
                  <ChevronLeft size={20} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.calTitle}>{MONTHS[calMonth]} {calYear}</Text>
                <TouchableOpacity onPress={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
                  else { setCalMonth((m) => m + 1); }
                }} style={styles.calNavBtn}>
                  <ChevronRight size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((wd, i) => (
                  <Text key={`${wd}-${i}`} style={styles.weekdayText}>{wd}</Text>
                ))}
              </View>
              <View style={styles.daysGrid}>
                {calendarDays.map((day, idx) => {
                  if (day === null) return <View key={`e-${idx}`} style={styles.dayCell} />;
                  const key = formatDateKey(calYear, calMonth, day);
                  const isAvailable = availableDates.includes(key);
                  const today = new Date();
                  const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                  return (
                    <View key={`d-${day}`} style={styles.dayCell}>
                      <TouchableOpacity
                        style={[
                          styles.dayBtn,
                          isAvailable && styles.dayBtnAvailable,
                          isToday && !isAvailable && styles.dayBtnToday,
                        ]}
                        onPress={() => toggleDate(day)}
                        activeOpacity={0.6}
                      >
                        <Text style={[
                          styles.dayText,
                          isAvailable && styles.dayTextAvailable,
                          isToday && !isAvailable && styles.dayTextToday,
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
              {availableDates.length > 0 && (
                <View style={styles.dateCountBadge}>
                  <Text style={styles.dateCountText}>{availableDates.length} date{availableDates.length !== 1 ? 's' : ''} selected</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 1:
        return (
          <View>
            <Text style={styles.stepQuestion}>What city are you departing from?</Text>
            <TextInput
              style={styles.textInput}
              value={flightAirport}
              onChangeText={setFlightAirport}
              placeholder="e.g. Los Angeles, Chicago, Miami..."
              placeholderTextColor={Colors.textDark}
            />

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Do you prefer nonstop flights?</Text>
            {renderTappableCards(NONSTOP_OPTIONS, flightNonstop, (v) => selectSingle(v, setFlightNonstop))}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>What time do you prefer to depart?</Text>
            {renderTappableCards(DEPART_TIME_OPTIONS, flightDepartTime, (v) => selectSingle(v, setFlightDepartTime))}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>What is your flight budget?</Text>
            {renderBudgetInput(flightBudget, setFlightBudget, '500')}
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.stepQuestion}>Accommodation style?</Text>
            {renderTappableCards(ACCOMMODATION_TYPES, accommodationType, (v) => selectSingle(v, setAccommodationType))}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Nightly budget per person?</Text>
            {renderBudgetInput(accommodationNightlyBudget, setAccommodationNightlyBudget, '150')}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Must haves?</Text>
            {renderChips(ACCOMMODATION_MUST_HAVES, accommodationMustHaves, (v) => toggleMultiSelect(v, accommodationMustHaves, setAccommodationMustHaves))}
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={styles.stepQuestion}>Will you need a rental car?</Text>
            {renderTappableCards(RENTAL_CAR_OPTIONS, needsRentalCar, (v) => selectSingle(v, setNeedsRentalCar))}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Are you a driver?</Text>
            {renderTappableCards(DRIVER_OPTIONS, isDriver, (v) => selectSingle(v, setIsDriver))}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Vehicle preference?</Text>
            {renderTappableCards(VEHICLE_OPTIONS, vehiclePreference, (v) => selectSingle(v, setVehiclePreference))}
          </View>
        );

      case 4:
        return (
          <View>
            <Text style={styles.stepQuestion}>What excites you most?</Text>
            {renderChips(ACTIVITY_INTERESTS, activityInterests, (v) => toggleMultiSelect(v, activityInterests, setActivityInterests))}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Daily activities budget?</Text>
            {renderBudgetInput(activityDailyBudget, setActivityDailyBudget, '100')}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Any must-do experiences?</Text>
            <TextInput
              style={styles.textInput}
              value={activityMustDo}
              onChangeText={setActivityMustDo}
              placeholder="e.g. snorkeling, cooking class..."
              placeholderTextColor={Colors.textDark}
              multiline
            />

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Anything you won{"'"}t do?</Text>
            <TextInput
              style={styles.textInput}
              value={activityWontDo}
              onChangeText={setActivityWontDo}
              placeholder="e.g. bungee jumping, long hikes..."
              placeholderTextColor={Colors.textDark}
              multiline
            />
          </View>
        );

      case 5:
        return (
          <View>
            <Text style={styles.stepQuestion}>Dining style?</Text>
            {renderTappableCards(DINING_STYLES, diningStyle, (v) => selectSingle(v, setDiningStyle))}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Dietary restrictions?</Text>
            {renderChips(DIETARY_OPTIONS, dietaryRestrictions, (v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (v === 'None') {
                setDietaryRestrictions(['None']);
              } else {
                setDietaryRestrictions((prev) => {
                  const without = prev.filter((d) => d !== 'None');
                  return without.includes(v) ? without.filter((d) => d !== v) : [...without, v];
                });
              }
            })}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Daily food budget per person?</Text>
            {renderBudgetInput(foodDailyBudget, setFoodDailyBudget, '75')}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>Important to you?</Text>
            {renderChips(FOOD_MUST_HAVES, foodMustHaves, (v) => toggleMultiSelect(v, foodMustHaves, setFoodMustHaves))}
          </View>
        );

      case 6:
        return (
          <View>
            <Text style={styles.stepQuestion}>Total trip budget per person?</Text>
            <View style={styles.bigBudgetWrap}>
              <Text style={styles.bigDollar}>$</Text>
              <TextInput
                style={styles.bigBudgetInput}
                value={totalBudget}
                onChangeText={setTotalBudget}
                keyboardType="numeric"
                placeholder="2,500"
                placeholderTextColor={Colors.textDark}
              />
            </View>

            <Text style={[styles.stepQuestion, { marginTop: 32 }]}>Budget flexibility?</Text>
            {renderTappableCards(BUDGET_FLEX_OPTIONS, budgetFlexibility, (v) => selectSingle(v, setBudgetFlexibility))}

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>One thing you must have on this trip?</Text>
            <TextInput
              style={styles.textInput}
              value={mustHave}
              onChangeText={setMustHave}
              placeholder="e.g. at least one beach day..."
              placeholderTextColor={Colors.textDark}
              multiline
            />

            <Text style={[styles.stepQuestion, { marginTop: 28 }]}>One thing that would ruin this trip?</Text>
            <TextInput
              style={styles.textInput}
              value={dealBreaker}
              onChangeText={setDealBreaker}
              placeholder="e.g. no super touristy spots..."
              placeholderTextColor={Colors.textDark}
              multiline
            />
          </View>
        );

      default:
        return null;
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
                <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
            <View style={styles.stepCounter}>
              <Text style={styles.stepCounterText}>{stepIndex + 1}/{TOTAL_STEPS}</Text>
            </View>
          </View>

          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepNumber}>Step {stepIndex + 1}</Text>
                  <Text style={styles.stepTitle}>{STEP_TITLES[stepIndex]}</Text>
                </View>
                <View style={styles.stepBody}>
                  {renderStep()}
                </View>
              </Animated.View>
            </ScrollView>

            <View style={styles.bottomButtons}>
              {stepIndex > 0 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
                  <ChevronLeft size={18} color={Colors.text} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.nextButton, stepIndex === 0 && { flex: 1 }]}
                onPress={handleNext}
                activeOpacity={0.85}
                testID="next-btn"
              >
                <Text style={styles.nextButtonText}>
                  {stepIndex === TOTAL_STEPS - 1 ? 'Submit Preferences' : 'Next'}
                </Text>
                {stepIndex < TOTAL_STEPS - 1 && <ChevronRight size={18} color="#FFF" />}
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
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 5,
    backgroundColor: Colors.orange,
    borderRadius: 3,
  },
  stepCounter: { width: 40, alignItems: 'flex-end' },
  stepCounterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  container: { flex: 1, justifyContent: 'space-between' },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  stepHeader: { marginBottom: 20 },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.orange,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  stepBody: {},
  stepQuestion: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  stepHint: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },

  calendarCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtnAvailable: {
    backgroundColor: Colors.emerald,
  },
  dayBtnToday: {
    backgroundColor: Colors.orangeMuted,
  },
  dayText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  dayTextAvailable: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  dayTextToday: {
    color: Colors.orange,
    fontWeight: '700' as const,
  },
  dateCountBadge: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.emeraldMuted,
    borderRadius: 10,
    alignSelf: 'center',
  },
  dateCountText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.emerald,
  },

  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tappableCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    position: 'relative',
    minWidth: '30%',
    alignItems: 'center',
  },
  tappableCardSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  tappableCardText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tappableCardTextSelected: {
    color: Colors.orange,
  },
  cardCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.orange,
    fontWeight: '600' as const,
  },

  budgetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  dollarPrefix: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    marginRight: 6,
  },
  budgetInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    paddingVertical: 14,
  },

  bigBudgetWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 2,
    borderColor: Colors.orange,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  bigDollar: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.orange,
    marginRight: 4,
  },
  bigBudgetInput: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.text,
    minWidth: 120,
    textAlign: 'center',
  },

  textInput: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 56,
  },

  pickerBtn: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValueText: { fontSize: 15, color: Colors.text },
  pickerPlaceholder: { fontSize: 15, color: Colors.textDark },
  pickerDropdown: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerScroll: { padding: 4 },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  pickerOptionActive: { backgroundColor: Colors.orangeMuted },
  pickerOptionText: { fontSize: 14, color: Colors.textSecondary },
  pickerOptionTextActive: { color: Colors.orange, fontWeight: '600' as const },

  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    gap: 6,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
