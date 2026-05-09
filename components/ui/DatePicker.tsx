import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { format, addMonths, subMonths, startOfMonth, getDay, getDaysInMonth, isBefore, startOfDay, isToday } from 'date-fns';
import { sr } from 'date-fns/locale';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: Date;
}

const WEEK_DAYS = ['Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su', 'Ne'];

export function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  const selected = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : today;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = getDaysInMonth(viewMonth);

  // What weekday does the 1st fall on? (0=Sun → shift to Mon-based)
  const firstDow = (getDay(startOfMonth(viewMonth)) + 6) % 7; // 0=Mon
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const handleDay = (day: number) => {
    const d = new Date(year, month, day);
    if (isBefore(d, min)) return;
    onChange(format(d, 'yyyy-MM-dd'));
  };

  const prevMonth = () => setViewMonth(subMonths(viewMonth, 1));
  const nextMonth = () => setViewMonth(addMonths(viewMonth, 1));

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth} activeOpacity={0.7}>
          <ChevronLeft size={16} stroke={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {format(viewMonth, 'MMMM yyyy.', { locale: sr }).replace(/^./, (c) => c.toUpperCase())}
        </Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth} activeOpacity={0.7}>
          <ChevronRight size={16} stroke={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Week day headers */}
      <View style={styles.weekDays}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - firstDow + 1;
          const valid = day >= 1 && day <= daysInMonth;
          const date = valid ? new Date(year, month, day) : null;
          const disabled = date ? isBefore(date, min) : true;
          const selStr = format(selected, 'yyyy-MM-dd');
          const thisStr = date ? format(date, 'yyyy-MM-dd') : '';
          const isSel = selStr === thisStr;
          const isTod = date ? isToday(date) : false;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                isSel && styles.dayCellSelected,
                isTod && !isSel && styles.dayCellToday,
              ]}
              onPress={() => valid && !disabled && handleDay(day)}
              disabled={!valid || disabled}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayText,
                isSel && styles.dayTextSelected,
                disabled && styles.dayTextDisabled,
                !valid && styles.dayTextEmpty,
              ]}>
                {valid ? day : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg, borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  navBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  weekDays: { flexDirection: 'row', marginBottom: 4 },
  weekDay: {
    flex: 1, textAlign: 'center',
    fontSize: 10, fontWeight: '600', color: Colors.gray400,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%` as `${number}%`,
    paddingVertical: 5,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellSelected: { backgroundColor: Colors.accent },
  dayCellToday: { backgroundColor: Colors.accentSoft },
  dayText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  dayTextSelected: { color: Colors.black },
  dayTextDisabled: { color: Colors.gray700, opacity: 0.5 },
  dayTextEmpty: { color: 'transparent' },
});
