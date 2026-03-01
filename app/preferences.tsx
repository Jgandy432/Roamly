import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { INTEREST_OPTIONS, AIRPORTS } from '@/constants/data';
import DatePickerField from '@/components/DatePickerField';

export default function PreferencesScreen() {
  const router = useRouter();
  const { activeTrip, currentUser, submitPreferences } = useTrips();

  const existing = activeTrip?.members.find((m) => m.id === currentUser?.id)?.preferences;

  const [budgetMin, setBudgetMin] = useState<number>(existing?.budgetMin ?? 500);
  const [budgetMax, setBudgetMax] = useState<number>(existing?.budgetMax ?? 2000);
  const [airport, setAirport] = useState<string>(existing?.airport ?? '');
  const [showAirportPicker, setShowAirportPicker] = useState<boolean>(false);
  const [dateStart, setDateStart] = useState<string>(existing?.dateStart ?? activeTrip?.dateStart ?? '');
  const [dateEnd, setDateEnd] = useState<string>(existing?.dateEnd ?? activeTrip?.dateEnd ?? '');
  const [interests, setInterests] = useState<string[]>(existing?.interests ?? []);

  const toggleInterest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!airport || interests.length < 2 || !dateStart || !dateEnd) {
      Alert.alert('Missing info', 'Please fill in airport, dates, and pick at least 2 interests.');
      return;
    }
    submitPreferences({ budgetMin, budgetMax, airport, dateStart, dateEnd, interests });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Your preferences have been saved!');
    router.back();
  };

  const isValid = airport.length > 0 && interests.length >= 2 && dateStart.length > 0 && dateEnd.length > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={20} color={Colors.textMuted} />
            <Text style={styles.backText}>Back to Trip</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.heading}>Your Preferences</Text>
            <Text style={styles.subtitle}>
              for <Text style={styles.subtitleAccent}>{activeTrip?.name ?? 'Trip'}</Text>
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Budget Range (per person, total trip)</Text>
              <View style={styles.budgetRow}>
                <View style={styles.budgetField}>
                  <Text style={styles.budgetFieldLabel}>Min</Text>
                  <View style={styles.budgetInputRow}>
                    <Text style={styles.dollarSign}>$</Text>
                    <TextInput
                      style={styles.budgetInput}
                      value={String(budgetMin)}
                      onChangeText={(t) => setBudgetMin(Number(t) || 0)}
                      keyboardType="numeric"
                      testID="budget-min-input"
                    />
                  </View>
                </View>
                <Text style={styles.budgetDash}>—</Text>
                <View style={styles.budgetField}>
                  <Text style={styles.budgetFieldLabel}>Max</Text>
                  <View style={styles.budgetInputRow}>
                    <Text style={styles.dollarSign}>$</Text>
                    <TextInput
                      style={styles.budgetInput}
                      value={String(budgetMax)}
                      onChangeText={(t) => setBudgetMax(Number(t) || 0)}
                      keyboardType="numeric"
                      testID="budget-max-input"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Home Airport</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowAirportPicker(!showAirportPicker)}
                testID="airport-picker"
              >
                <Text style={airport ? styles.pickerValueText : styles.pickerPlaceholder}>
                  {airport || 'Select airport'}
                </Text>
                <ChevronDown size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {showAirportPicker && (
                <View style={styles.pickerDropdown}>
                  <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                    {AIRPORTS.map((a) => (
                      <TouchableOpacity
                        key={a}
                        style={[styles.pickerOption, airport === a && styles.pickerOptionActive]}
                        onPress={() => { setAirport(a); setShowAirportPicker(false); }}
                      >
                        <Text style={[styles.pickerOptionText, airport === a && styles.pickerOptionTextActive]}>
                          {a}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.label}>Available From</Text>
                <DatePickerField
                  value={dateStart}
                  onChangeDate={setDateStart}
                  placeholder="MM/DD/YYYY"
                  testID="date-start-input"
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>Available Until</Text>
                <DatePickerField
                  value={dateEnd}
                  onChangeDate={setDateEnd}
                  placeholder="MM/DD/YYYY"
                  testID="date-end-input"
                />
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Interests</Text>
                <Text style={styles.hint}>Pick at least 2</Text>
              </View>
              <View style={styles.chipsRow}>
                {INTEREST_OPTIONS.map((opt) => {
                  const selected = interests.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleInterest(opt.id)}
                      activeOpacity={0.7}
                      testID={`interest-${opt.id}`}
                    >
                      <Text style={styles.chipIcon}>{opt.icon}</Text>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!isValid}
              activeOpacity={0.8}
              testID="save-prefs-btn"
            >
              <Text style={styles.submitBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backText: { fontSize: 14, color: Colors.textMuted },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 28 },
  subtitleAccent: { color: Colors.text, fontWeight: '600' as const },
  field: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  hint: { fontSize: 12, color: Colors.textDim },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
  },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetField: { flex: 1 },
  budgetFieldLabel: { fontSize: 11, color: Colors.textDim, marginBottom: 4 },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dollarSign: { fontSize: 14, color: Colors.textMuted },
  budgetInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  budgetDash: { color: Colors.textDim, fontSize: 16, marginTop: 16 },
  pickerBtn: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
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
  pickerOptionTextActive: { color: Colors.orange },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  dateField: { flex: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipSelected: {
    backgroundColor: Colors.orangeMuted,
    borderColor: Colors.orange,
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 12, fontWeight: '500' as const, color: Colors.textMuted },
  chipTextSelected: { color: Colors.orange },
  submitBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.3 },
  submitBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#FFFFFF' },
});
