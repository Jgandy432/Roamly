import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface DatePickerFieldProps {
  value: string;
  onChangeDate: (dateStr: string) => void;
  placeholder?: string;
  testID?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const m = parseInt(parts[0], 10) - 1;
    const d = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
      return new Date(y, m, d);
    }
  }
  const parts2 = dateStr.split('-');
  if (parts2.length === 3) {
    const y = parseInt(parts2[0], 10);
    const m = parseInt(parts2[1], 10) - 1;
    const d = parseInt(parts2[2], 10);
    if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
      return new Date(y, m, d);
    }
  }
  return null;
}

function formatDateDisplay(dateStr: string): string {
  const date = parseDateString(dateStr);
  if (!date) return '';
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

function toStorageFormat(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DatePickerField({ value, onChangeDate, placeholder = 'MM/DD/YYYY', testID }: DatePickerFieldProps) {
  const [visible, setVisible] = useState<boolean>(false);

  const initialDate = useMemo(() => {
    const parsed = parseDateString(value);
    return parsed ?? new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(parseDateString(value));

  const displayValue = useMemo(() => formatDateDisplay(value), [value]);

  const openPicker = useCallback(() => {
    const parsed = parseDateString(value);
    const now = parsed ?? new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(parsed);
    setVisible(true);
  }, [value]);

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const handleSelectDay = useCallback((day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    setSelectedDate(date);
    onChangeDate(toStorageFormat(date));
    setVisible(false);
  }, [viewYear, viewMonth, onChangeDate]);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [daysInMonth, firstDay]);

  const isSelectedDay = useCallback((day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  }, [selectedDate, viewYear, viewMonth]);

  const isToday = useCallback((day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  }, [viewYear, viewMonth]);

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        onPress={openPicker}
        activeOpacity={0.7}
        testID={testID}
      >
        <Text style={displayValue ? styles.fieldValue : styles.fieldPlaceholder}>
          {displayValue || placeholder}
        </Text>
        <Calendar size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modal}>
            <View style={styles.header}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                <ChevronLeft size={20} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
                <ChevronRight size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((wd) => (
                <Text key={wd} style={styles.weekdayText}>{wd}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((day, idx) => (
                <View key={idx} style={styles.dayCell}>
                  {day !== null ? (
                    <TouchableOpacity
                      style={[
                        styles.dayBtn,
                        isSelectedDay(day) && styles.dayBtnSelected,
                        isToday(day) && !isSelectedDay(day) && styles.dayBtnToday,
                      ]}
                      onPress={() => handleSelectDay(day)}
                      activeOpacity={0.6}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelectedDay(day) && styles.dayTextSelected,
                          isToday(day) && !isSelectedDay(day) && styles.dayTextToday,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldValue: {
    fontSize: 17,
    color: Colors.text,
  },
  fieldPlaceholder: {
    fontSize: 17,
    color: Colors.textDark,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
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
    padding: 2,
  },
  dayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtnSelected: {
    backgroundColor: Colors.orange,
  },
  dayBtnToday: {
    backgroundColor: Colors.orangeMuted,
  },
  dayText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  dayTextToday: {
    color: Colors.orange,
    fontWeight: '700' as const,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
});
