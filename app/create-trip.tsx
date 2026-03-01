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
import { ChevronLeft, ChevronRight, Minus, Plus, Search } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { POPULAR_DESTINATIONS } from '@/constants/data';
import Slider from '@/components/Slider';
import { formatDateFromObj } from '@/utils/helpers';
import BottomTabBar from '@/components/BottomTabBar';

type Step =
  | 'destination'
  | 'travelers'
  | 'dates'
  | 'budget'
  | 'tripType'
  | 'vibe'
  | 'accommodation'
  | 'dietary'
  | 'mustHave'
  | 'dealBreaker';

const STEPS: Step[] = [
  'destination',
  'travelers',
  'dates',
  'budget',
  'tripType',
  'vibe',
  'accommodation',
  'dietary',
  'mustHave',
  'dealBreaker',
];

const STEP_HEADLINES: Record<Step, string> = {
  destination: 'Where are you dreaming of?',
  travelers: "Who's joining the adventure?",
  dates: 'When are you going?',
  budget: "What's your budget per person?",
  tripType: 'What kind of trip feels right?',
  vibe: "What's your travel vibe?",
  accommodation: 'Where do you sleep best?',
  dietary: 'Any food needs we should know about?',
  mustHave: 'What\'s one thing you must do or have?',
  dealBreaker: 'What would ruin this trip for you?',
};

const TRIP_TYPE_OPTIONS = [
  { id: 'beach', label: 'Beach', emoji: '🏖' },
  { id: 'city', label: 'City', emoji: '🏙' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'adventure', label: 'Adventure', emoji: '🧗' },
  { id: 'culture', label: 'Culture', emoji: '🏛' },
  { id: 'food_drink', label: 'Food & Drink', emoji: '🍷' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘' },
  { id: 'party', label: 'Party', emoji: '🎉' },
];

const VIBE_OPTIONS = [
  'Slow & Lazy',
  'Mostly Relaxed',
  'Mix of Both',
  'Mostly Busy',
  'Go Go Go',
];

const ACCOMMODATION_OPTIONS = [
  { id: 'hotel', label: 'Hotel', emoji: '🏨' },
  { id: 'airbnb', label: 'Airbnb / Vacation Rental', emoji: '🏠' },
  { id: 'resort', label: 'Resort', emoji: '🌴' },
  { id: 'hostel', label: 'Hostel', emoji: '🛏' },
  { id: 'any', label: "Doesn't Matter", emoji: '🤷' },
];

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Kosher',
  'Nut Allergy',
  'No Restrictions',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function formatBudgetLabel(val: number): string {
  if (val >= 10000) return '$10,000+';
  return '$' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDateStorage(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

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

  const [destination, setDestination] = useState<string>('');
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [openToSuggestions, setOpenToSuggestions] = useState<boolean>(false);

  const [travelers, setTravelers] = useState<number>(2);

  const [dateStart, setDateStart] = useState<Date | null>(null);
  const [dateEnd, setDateEnd] = useState<Date | null>(null);
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());

  const [budget, setBudget] = useState<number>(2000);

  const [tripTypes, setTripTypes] = useState<string[]>([]);
  const [tripTypeOther, setTripTypeOther] = useState<string>('');
  const [showTripTypeOther, setShowTripTypeOther] = useState<boolean>(false);

  const [vibe, setVibe] = useState<string>('');

  const [accommodation, setAccommodation] = useState<string>('');

  const [dietaryNeeds, setDietaryNeeds] = useState<string[]>([]);
  const [dietaryOther, setDietaryOther] = useState<string>('');
  const [showDietaryOther, setShowDietaryOther] = useState<boolean>(false);

  const [mustHave, setMustHave] = useState<string>('');
  const [dealBreaker, setDealBreaker] = useState<string>('');

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
      case 'destination': return openToSuggestions || destination.trim().length > 0;
      case 'travelers': return true;
      case 'dates': return dateStart !== null;
      case 'budget': return true;
      case 'tripType': return tripTypes.length > 0 || (showTripTypeOther && tripTypeOther.trim().length > 0);
      case 'vibe': return vibe.length > 0;
      case 'accommodation': return accommodation.length > 0;
      case 'dietary': return dietaryNeeds.length > 0 || (showDietaryOther && dietaryOther.trim().length > 0);
      case 'mustHave': return true;
      case 'dealBreaker': return true;
      default: return false;
    }
  }, [step, destination, openToSuggestions, dateStart, tripTypes, showTripTypeOther, tripTypeOther, vibe, accommodation, dietaryNeeds, showDietaryOther, dietaryOther]);

  const handleNext = useCallback(() => {
    if (!isStepValid()) return;
    if (isLastStep) {
      const destText = openToSuggestions ? 'AI to recommend' : destination.trim();
      const tripName = destText === 'AI to recommend'
        ? 'My Trip'
        : `${destText.split(',')[0]} Trip`;

      createTrip({
        name: tripName,
        destination: destText,
        groupSize: travelers,
        dateStart: dateStart ? formatDateStorage(dateStart) : '',
        dateEnd: dateEnd ? formatDateStorage(dateEnd) : '',
        constraints: '',
        budget,
        tripTypes,
        tripTypeOther: showTripTypeOther ? tripTypeOther.trim() : '',
        vibe,
        accommodation,
        dietaryNeeds,
        dietaryOther: showDietaryOther ? dietaryOther.trim() : '',
        mustHave: mustHave.trim(),
        dealBreaker: dealBreaker.trim(),
      });
      router.push('/trip');
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [isStepValid, isLastStep, stepIndex, destination, openToSuggestions, travelers, dateStart, dateEnd, budget, tripTypes, tripTypeOther, showTripTypeOther, vibe, accommodation, dietaryNeeds, dietaryOther, showDietaryOther, mustHave, dealBreaker]);

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

  const handleToggleTripType = useCallback((id: string) => {
    setTripTypes((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const handleToggleDietary = useCallback((item: string) => {
    if (item === 'No Restrictions') {
      setDietaryNeeds(['No Restrictions']);
      setShowDietaryOther(false);
      setDietaryOther('');
      return;
    }
    setDietaryNeeds((prev) => {
      const without = prev.filter((d) => d !== 'No Restrictions');
      if (without.includes(item)) return without.filter((d) => d !== item);
      return [...without, item];
    });
  }, []);

  const handleCalendarDayPress = useCallback((day: number) => {
    const selected = new Date(calYear, calMonth, day);
    if (!dateStart || (dateStart && dateEnd)) {
      setDateStart(selected);
      setDateEnd(null);
    } else {
      if (selected.getTime() < dateStart.getTime()) {
        setDateStart(selected);
      } else if (selected.getTime() === dateStart.getTime()) {
        setDateEnd(null);
      } else {
        setDateEnd(selected);
      }
    }
  }, [calYear, calMonth, dateStart, dateEnd]);

  const handleBudgetChange = useCallback((val: number) => {
    setBudget(Math.round(val / 100) * 100);
  }, []);

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calYear, calMonth]);

  const isDayStart = useCallback((day: number) => {
    if (!dateStart) return false;
    return dateStart.getFullYear() === calYear && dateStart.getMonth() === calMonth && dateStart.getDate() === day;
  }, [dateStart, calYear, calMonth]);

  const isDayEnd = useCallback((day: number) => {
    if (!dateEnd) return false;
    return dateEnd.getFullYear() === calYear && dateEnd.getMonth() === calMonth && dateEnd.getDate() === day;
  }, [dateEnd, calYear, calMonth]);

  const isDayInRange = useCallback((day: number) => {
    if (!dateStart || !dateEnd) return false;
    const d = new Date(calYear, calMonth, day);
    return d.getTime() > dateStart.getTime() && d.getTime() < dateEnd.getTime();
  }, [dateStart, dateEnd, calYear, calMonth]);

  const isDayToday = useCallback((day: number) => {
    const today = new Date();
    return today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
  }, [calYear, calMonth]);

  const goToPrevMonth = useCallback(() => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else { setCalMonth((m) => m - 1); }
  }, [calMonth]);

  const goToNextMonth = useCallback(() => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else { setCalMonth((m) => m + 1); }
  }, [calMonth]);

  const renderStep = () => {
    switch (step) {
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

      case 'dates':
        return (
          <View style={styles.calendarContainer}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.calNavBtn}>
                <ChevronLeft size={20} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.calTitle}>{MONTHS[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.calNavBtn}>
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
                if (day === null) {
                  return <View key={`e-${idx}`} style={styles.dayCell} />;
                }
                const isStart = isDayStart(day);
                const isEnd = isDayEnd(day);
                const inRange = isDayInRange(day);
                const today = isDayToday(day);
                return (
                  <View key={`d-${day}`} style={styles.dayCell}>
                    {inRange && <View style={styles.dayRangeBg} />}
                    {isStart && dateEnd && <View style={[styles.dayRangeEdge, styles.dayRangeEdgeStart]} />}
                    {isEnd && <View style={[styles.dayRangeEdge, styles.dayRangeEdgeEnd]} />}
                    <TouchableOpacity
                      style={[
                        styles.dayBtn,
                        (isStart || isEnd) && styles.dayBtnSelected,
                        today && !isStart && !isEnd && styles.dayBtnToday,
                      ]}
                      onPress={() => handleCalendarDayPress(day)}
                      activeOpacity={0.6}
                    >
                      <Text style={[
                        styles.dayText,
                        (isStart || isEnd) && styles.dayTextSelected,
                        inRange && styles.dayTextRange,
                        today && !isStart && !isEnd && styles.dayTextToday,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
            <View style={styles.dateDisplayRow}>
              <View style={styles.dateDisplayItem}>
                <Text style={styles.dateDisplayLabel}>Start</Text>
                <Text style={styles.dateDisplayValue}>
                  {dateStart ? formatDateFromObj(dateStart) : '—'}
                </Text>
              </View>
              <View style={styles.dateDisplayDivider} />
              <View style={styles.dateDisplayItem}>
                <Text style={styles.dateDisplayLabel}>End</Text>
                <Text style={styles.dateDisplayValue}>
                  {dateEnd ? formatDateFromObj(dateEnd) : '—'}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'budget':
        return (
          <View style={styles.budgetContainer}>
            <Text style={styles.budgetValue}>{formatBudgetLabel(budget)}</Text>
            <Text style={styles.budgetSubtext}>per person</Text>
            <View style={styles.budgetSliderWrap}>
              <Slider value={budget} min={0} max={10000} onValueChange={handleBudgetChange} />
            </View>
            <View style={styles.budgetBounds}>
              <Text style={styles.budgetBound}>$0</Text>
              <Text style={styles.budgetBound}>$10,000+</Text>
            </View>
          </View>
        );

      case 'tripType':
        return (
          <View>
            <View style={styles.typeGrid}>
              {TRIP_TYPE_OPTIONS.map((opt) => {
                const selected = tripTypes.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.typeCard, selected && styles.typeCardSelected]}
                    onPress={() => handleToggleTripType(opt.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{opt.label}</Text>
                    {selected && <View style={styles.typeCheckBadge}><Text style={styles.typeCheckMark}>✓</Text></View>}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.typeCard, showTripTypeOther && styles.typeCardSelected]}
                onPress={() => { setShowTripTypeOther(!showTripTypeOther); if (showTripTypeOther) setTripTypeOther(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.typeEmoji}>✏️</Text>
                <Text style={[styles.typeLabel, showTripTypeOther && styles.typeLabelSelected]}>Other</Text>
              </TouchableOpacity>
            </View>
            {showTripTypeOther && (
              <TextInput
                style={[styles.input, { marginTop: 16 }]}
                placeholder="Describe your trip type..."
                placeholderTextColor={Colors.textDark}
                value={tripTypeOther}
                onChangeText={setTripTypeOther}
                autoFocus
                testID="trip-type-other-input"
              />
            )}
            <Text style={styles.selectionHint}>Select up to 2</Text>
          </View>
        );

      case 'vibe':
        return (
          <View style={styles.pillsContainer}>
            {VIBE_OPTIONS.map((opt) => {
              const selected = vibe === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setVibe(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'accommodation':
        return (
          <View style={styles.accomList}>
            {ACCOMMODATION_OPTIONS.map((opt) => {
              const selected = accommodation === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.accomCard, selected && styles.accomCardSelected]}
                  onPress={() => setAccommodation(opt.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accomEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.accomLabel, selected && styles.accomLabelSelected]}>{opt.label}</Text>
                  {selected && (
                    <View style={styles.accomCheck}>
                      <Text style={styles.accomCheckMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'dietary':
        return (
          <View>
            <View style={styles.chipsWrap}>
              {DIETARY_OPTIONS.map((opt) => {
                const selected = dietaryNeeds.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => handleToggleDietary(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.chip, showDietaryOther && styles.chipSelected]}
                onPress={() => { setShowDietaryOther(!showDietaryOther); if (showDietaryOther) setDietaryOther(''); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, showDietaryOther && styles.chipTextSelected]}>Other</Text>
              </TouchableOpacity>
            </View>
            {showDietaryOther && (
              <TextInput
                style={[styles.input, { marginTop: 16 }]}
                placeholder="Describe your dietary need..."
                placeholderTextColor={Colors.textDark}
                value={dietaryOther}
                onChangeText={setDietaryOther}
                autoFocus
                testID="dietary-other-input"
              />
            )}
          </View>
        );

      case 'mustHave':
        return (
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. at least one beach day, a cooking class, good coffee spots..."
            placeholderTextColor={Colors.textDark}
            value={mustHave}
            onChangeText={setMustHave}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoFocus
            testID="must-have-input"
          />
        );

      case 'dealBreaker':
        return (
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. no super touristy spots, no dorm-style rooms, no early mornings..."
            placeholderTextColor={Colors.textDark}
            value={dealBreaker}
            onChangeText={setDealBreaker}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoFocus
            testID="deal-breaker-input"
          />
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
                  {isLastStep ? 'Build My Trip' : 'Continue'}
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
  textArea: { minHeight: 120, paddingTop: 16 },

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

  calendarContainer: {
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
    marginBottom: 16,
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
    marginBottom: 8,
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
    position: 'relative',
  },
  dayRangeBg: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    bottom: '25%',
    backgroundColor: Colors.orangeMuted,
  },
  dayRangeEdge: {
    position: 'absolute',
    top: '25%',
    bottom: '25%',
    backgroundColor: Colors.orangeMuted,
  },
  dayRangeEdgeStart: { left: '50%', right: 0 },
  dayRangeEdgeEnd: { left: 0, right: '50%' },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dayBtnSelected: { backgroundColor: Colors.orange },
  dayBtnToday: { backgroundColor: Colors.orangeMuted },
  dayText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '700' as const },
  dayTextRange: { color: Colors.orange, fontWeight: '600' as const },
  dayTextToday: { color: Colors.orange, fontWeight: '700' as const },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateDisplayItem: { flex: 1, alignItems: 'center' },
  dateDisplayLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dateDisplayValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dateDisplayDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  budgetContainer: { alignItems: 'center', gap: 4 },
  budgetValue: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: Colors.orange,
    lineHeight: 56,
  },
  budgetSubtext: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginBottom: 32,
  },
  budgetSliderWrap: { width: '100%' },
  budgetBounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  budgetBound: {
    fontSize: 13,
    color: Colors.textDim,
    fontWeight: '600' as const,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  typeEmoji: { fontSize: 28 },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeLabelSelected: { color: Colors.orange },
  typeCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCheckMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  selectionHint: {
    fontSize: 13,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: 16,
  },

  pillsContainer: { gap: 10 },
  pill: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pillSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pillTextSelected: { color: Colors.orange },

  accomList: { gap: 10 },
  accomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  accomCardSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  accomEmoji: { fontSize: 26 },
  accomLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  accomLabelSelected: { color: Colors.orange },
  accomCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accomCheckMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700' as const,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  chipSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  chipTextSelected: { color: Colors.orange },

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
