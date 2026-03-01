import React, { useState, useRef, useCallback, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { UserPreferences } from '@/types/trip';
import BottomTabBar from '@/components/BottomTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

type QuestionType = 'calendar' | 'text' | 'single' | 'multi' | 'budget' | 'bigBudget' | 'multiline';

interface Question {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  { id: 'availableDates', section: 'Your Availability', title: 'When are you free to travel?', subtitle: 'Tap dates to mark them as available', type: 'calendar' },
  { id: 'flightAirport', section: 'Getting There', title: 'What city are you departing from?', type: 'text', placeholder: 'e.g. Los Angeles, Chicago, Miami...' },
  { id: 'flightNonstop', section: 'Getting There', title: 'Do you prefer nonstop flights?', type: 'single', options: NONSTOP_OPTIONS },
  { id: 'flightDepartTime', section: 'Getting There', title: 'What time do you prefer to depart?', type: 'single', options: DEPART_TIME_OPTIONS },
  { id: 'flightBudget', section: 'Getting There', title: 'What is your flight budget?', type: 'budget', placeholder: '500' },
  { id: 'accommodationType', section: 'Where You\'ll Stay', title: 'Accommodation style?', type: 'single', options: ACCOMMODATION_TYPES },
  { id: 'accommodationNightlyBudget', section: 'Where You\'ll Stay', title: 'Nightly budget per person?', type: 'budget', placeholder: '150' },
  { id: 'accommodationMustHaves', section: 'Where You\'ll Stay', title: 'Must haves?', subtitle: 'Select all that apply', type: 'multi', options: ACCOMMODATION_MUST_HAVES },
  { id: 'needsRentalCar', section: 'Getting Around', title: 'Will you need a rental car?', type: 'single', options: RENTAL_CAR_OPTIONS },
  { id: 'isDriver', section: 'Getting Around', title: 'Are you a driver?', type: 'single', options: DRIVER_OPTIONS },
  { id: 'vehiclePreference', section: 'Getting Around', title: 'Vehicle preference?', type: 'single', options: VEHICLE_OPTIONS },
  { id: 'activityInterests', section: 'Activities & Excursions', title: 'What excites you most?', subtitle: 'Select all that apply', type: 'multi', options: ACTIVITY_INTERESTS },
  { id: 'activityDailyBudget', section: 'Activities & Excursions', title: 'Daily activities budget?', type: 'budget', placeholder: '100' },
  { id: 'activityMustDo', section: 'Activities & Excursions', title: 'Any must-do experiences?', type: 'multiline', placeholder: 'e.g. snorkeling, cooking class...' },
  { id: 'activityWontDo', section: 'Activities & Excursions', title: 'Anything you won\'t do?', type: 'multiline', placeholder: 'e.g. bungee jumping, long hikes...' },
  { id: 'diningStyle', section: 'Food & Drink', title: 'Dining style?', type: 'single', options: DINING_STYLES },
  { id: 'dietaryRestrictions', section: 'Food & Drink', title: 'Dietary restrictions?', subtitle: 'Select all that apply', type: 'multi', options: DIETARY_OPTIONS },
  { id: 'foodDailyBudget', section: 'Food & Drink', title: 'Daily food budget per person?', type: 'budget', placeholder: '75' },
  { id: 'foodMustHaves', section: 'Food & Drink', title: 'Important to you?', subtitle: 'Select all that apply', type: 'multi', options: FOOD_MUST_HAVES },
  { id: 'totalBudget', section: 'Overall Budget', title: 'Total trip budget per person?', type: 'bigBudget', placeholder: '2,500' },
  { id: 'budgetFlexibility', section: 'Overall Budget', title: 'Budget flexibility?', type: 'single', options: BUDGET_FLEX_OPTIONS },
  { id: 'mustHave', section: 'Overall Budget', title: 'One thing you must have on this trip?', type: 'multiline', placeholder: 'e.g. at least one beach day...' },
  { id: 'dealBreaker', section: 'Overall Budget', title: 'One thing that would ruin this trip?', type: 'multiline', placeholder: 'e.g. no super touristy spots...' },
];

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function PreferencesScreen() {
  const router = useRouter();
  const { activeTrip, currentUser, submitPreferences } = useTrips();
  const existing = activeTrip?.members.find((m) => m.id === currentUser?.id)?.preferences;

  const [questionIndex, setQuestionIndex] = useState<number>(0);

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

  const activeQuestions = useMemo(() => {
    if (needsRentalCar === 'No') {
      return QUESTIONS.filter((q) => q.id !== 'isDriver' && q.id !== 'vehiclePreference');
    }
    return QUESTIONS;
  }, [needsRentalCar]);

  const TOTAL_QUESTIONS = activeQuestions.length;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const directionRef = useRef<'forward' | 'backward'>('forward');

  const animateTransition = useCallback((direction: 'forward' | 'backward') => {
    directionRef.current = direction;
    const exitTo = direction === 'forward' ? -SCREEN_WIDTH * 0.3 : SCREEN_WIDTH * 0.3;
    const enterFrom = direction === 'forward' ? SCREEN_WIDTH * 0.3 : -SCREEN_WIDTH * 0.3;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitTo, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(enterFrom);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const safeIndex = Math.min(questionIndex, TOTAL_QUESTIONS - 1);
  const progress = (safeIndex + 1) / TOTAL_QUESTIONS;
  const currentQuestion = activeQuestions[safeIndex];

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

  const getValueForQuestion = useCallback((id: string): string | string[] => {
    switch (id) {
      case 'availableDates': return availableDates;
      case 'flightAirport': return flightAirport;
      case 'flightNonstop': return flightNonstop;
      case 'flightDepartTime': return flightDepartTime;
      case 'flightBudget': return flightBudget;
      case 'accommodationType': return accommodationType;
      case 'accommodationNightlyBudget': return accommodationNightlyBudget;
      case 'accommodationMustHaves': return accommodationMustHaves;
      case 'needsRentalCar': return needsRentalCar;
      case 'isDriver': return isDriver;
      case 'vehiclePreference': return vehiclePreference;
      case 'activityInterests': return activityInterests;
      case 'activityDailyBudget': return activityDailyBudget;
      case 'activityMustDo': return activityMustDo;
      case 'activityWontDo': return activityWontDo;
      case 'diningStyle': return diningStyle;
      case 'dietaryRestrictions': return dietaryRestrictions;
      case 'foodDailyBudget': return foodDailyBudget;
      case 'foodMustHaves': return foodMustHaves;
      case 'totalBudget': return totalBudget;
      case 'budgetFlexibility': return budgetFlexibility;
      case 'mustHave': return mustHave;
      case 'dealBreaker': return dealBreaker;
      default: return '';
    }
  }, [availableDates, flightAirport, flightNonstop, flightDepartTime, flightBudget, accommodationType, accommodationNightlyBudget, accommodationMustHaves, needsRentalCar, isDriver, vehiclePreference, activityInterests, activityDailyBudget, activityMustDo, activityWontDo, diningStyle, dietaryRestrictions, foodDailyBudget, foodMustHaves, totalBudget, budgetFlexibility, mustHave, dealBreaker]);

  const isCurrentAnswered = useMemo(() => {
    const val = getValueForQuestion(currentQuestion.id);
    if (Array.isArray(val)) return val.length > 0;
    return val.trim().length > 0;
  }, [getValueForQuestion, currentQuestion.id]);

  const setValueForQuestion = useCallback((id: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (id) {
      case 'flightAirport': setFlightAirport(value); break;
      case 'flightNonstop': setFlightNonstop(value); break;
      case 'flightDepartTime': setFlightDepartTime(value); break;
      case 'flightBudget': setFlightBudget(value); break;
      case 'accommodationType': setAccommodationType(value); break;
      case 'accommodationNightlyBudget': setAccommodationNightlyBudget(value); break;
      case 'needsRentalCar': setNeedsRentalCar(value); break;
      case 'isDriver': setIsDriver(value); break;
      case 'vehiclePreference': setVehiclePreference(value); break;
      case 'activityDailyBudget': setActivityDailyBudget(value); break;
      case 'activityMustDo': setActivityMustDo(value); break;
      case 'activityWontDo': setActivityWontDo(value); break;
      case 'diningStyle': setDiningStyle(value); break;
      case 'foodDailyBudget': setFoodDailyBudget(value); break;
      case 'totalBudget': setTotalBudget(value); break;
      case 'budgetFlexibility': setBudgetFlexibility(value); break;
      case 'mustHave': setMustHave(value); break;
      case 'dealBreaker': setDealBreaker(value); break;
    }
  }, []);

  const toggleMultiForQuestion = useCallback((id: string, item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (id) {
      case 'accommodationMustHaves':
        setAccommodationMustHaves((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
        break;
      case 'activityInterests':
        setActivityInterests((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
        break;
      case 'dietaryRestrictions':
        if (item === 'None') {
          setDietaryRestrictions(['None']);
        } else {
          setDietaryRestrictions((prev) => {
            const without = prev.filter((d) => d !== 'None');
            return without.includes(item) ? without.filter((d) => d !== item) : [...without, item];
          });
        }
        break;
      case 'foodMustHaves':
        setFoodMustHaves((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
        break;
    }
  }, []);

  const handleNext = useCallback(() => {
    if (safeIndex < TOTAL_QUESTIONS - 1) {
      animateTransition('forward');
      setTimeout(() => setQuestionIndex((i) => Math.min(i + 1, TOTAL_QUESTIONS - 1)), 120);
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
  }, [safeIndex, TOTAL_QUESTIONS, animateTransition, availableDates, flightAirport, flightNonstop, flightDepartTime, flightBudget, accommodationType, accommodationNightlyBudget, accommodationMustHaves, needsRentalCar, isDriver, vehiclePreference, activityInterests, activityDailyBudget, activityMustDo, activityWontDo, diningStyle, dietaryRestrictions, foodDailyBudget, foodMustHaves, totalBudget, budgetFlexibility, mustHave, dealBreaker, submitPreferences, router]);

  const handleBack = useCallback(() => {
    if (questionIndex === 0) {
      router.back();
    } else {
      animateTransition('backward');
      setTimeout(() => setQuestionIndex((i) => i - 1), 120);
    }
  }, [questionIndex, animateTransition, router]);

  const renderCalendar = () => (
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
  );

  const renderSingleCards = (options: string[], selected: string, onSelect: (v: string) => void) => (
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

  const renderQuestionContent = () => {
    const q = currentQuestion;
    const val = getValueForQuestion(q.id);

    switch (q.type) {
      case 'calendar':
        return renderCalendar();

      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={val as string}
            onChangeText={(v) => setValueForQuestion(q.id, v)}
            placeholder={q.placeholder}
            placeholderTextColor={Colors.textDark}
          />
        );

      case 'multiline':
        return (
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={val as string}
            onChangeText={(v) => setValueForQuestion(q.id, v)}
            placeholder={q.placeholder}
            placeholderTextColor={Colors.textDark}
            multiline
            textAlignVertical="top"
          />
        );

      case 'single':
        return renderSingleCards(
          q.options ?? [],
          val as string,
          (v) => setValueForQuestion(q.id, v)
        );

      case 'multi':
        return renderChips(
          q.options ?? [],
          val as string[],
          (v) => toggleMultiForQuestion(q.id, v)
        );

      case 'budget':
        return (
          <View style={styles.budgetInputWrap}>
            <Text style={styles.dollarPrefix}>$</Text>
            <TextInput
              style={styles.budgetInput}
              value={val as string}
              onChangeText={(v) => setValueForQuestion(q.id, v)}
              keyboardType="numeric"
              placeholder={q.placeholder}
              placeholderTextColor={Colors.textDark}
            />
          </View>
        );

      case 'bigBudget':
        return (
          <View style={styles.bigBudgetWrap}>
            <Text style={styles.bigDollar}>$</Text>
            <TextInput
              style={styles.bigBudgetInput}
              value={val as string}
              onChangeText={(v) => setValueForQuestion(q.id, v)}
              keyboardType="numeric"
              placeholder={q.placeholder}
              placeholderTextColor={Colors.textDark}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const isLastQuestion = safeIndex === TOTAL_QUESTIONS - 1;

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
            <View style={styles.stepCounter}>
              <Text style={styles.stepCounterText}>{safeIndex + 1}/{TOTAL_QUESTIONS}</Text>
            </View>
          </View>

          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                <Text style={styles.sectionLabel}>{currentQuestion.section}</Text>
                <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
                {currentQuestion.subtitle && (
                  <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
                )}
                <View style={styles.answerArea}>
                  {renderQuestionContent()}
                </View>
              </Animated.View>
            </ScrollView>

            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !isCurrentAnswered && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                activeOpacity={0.85}
                disabled={!isCurrentAnswered}
                testID="next-btn"
              >
                <Text style={[styles.nextButtonText, !isCurrentAnswered && styles.nextButtonTextDisabled]}>
                  {isLastQuestion ? 'Submit Preferences' : 'Next'}
                </Text>
                {!isLastQuestion && (
                  <ChevronRight size={18} color={isCurrentAnswered ? '#FFF' : Colors.textDark} />
                )}
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
  stepCounter: { width: 48, alignItems: 'flex-end' },
  stepCounterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  container: { flex: 1, justifyContent: 'space-between' },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.orange,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 6,
  },
  questionSubtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  answerArea: {
    marginTop: 28,
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
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    position: 'relative',
    minWidth: '45%',
    alignItems: 'center',
    flexGrow: 1,
  },
  tappableCardSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  tappableCardText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tappableCardTextSelected: {
    color: Colors.orange,
  },
  cardCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
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
    fontSize: 15,
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    paddingVertical: 16,
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
    paddingVertical: 24,
  },
  bigDollar: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: Colors.orange,
    marginRight: 4,
  },
  bigBudgetInput: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: Colors.text,
    minWidth: 140,
    textAlign: 'center',
  },

  textInput: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 56,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: 16,
  },

  bottomButtons: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    gap: 6,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: Colors.textDark,
  },
});
