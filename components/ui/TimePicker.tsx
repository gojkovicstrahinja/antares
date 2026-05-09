import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';

interface TimePickerProps {
  value: string; // HH:MM
  onChange: (time: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [h, m] = value ? value.split(':').map(Number) : [8, 0];
  const [selH, setSelH] = useState(h);
  const [selM, setSelM] = useState(MINUTES.includes(m) ? m : 0);

  const update = (newH: number, newM: number) => {
    onChange(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  const handleH = (hour: number) => { setSelH(hour); update(hour, selM); };
  const handleM = (min: number) => { setSelM(min); update(selH, min); };

  return (
    <View style={styles.container}>
      {/* Live preview */}
      <View style={styles.preview}>
        <Text style={styles.previewTime}>
          {String(selH).padStart(2, '0')}:{String(selM).padStart(2, '0')}
        </Text>
        <Text style={styles.previewLabel}>vreme polaska</Text>
      </View>

      <View style={styles.cols}>
        {/* Hours */}
        <View style={styles.col}>
          <Text style={styles.colLabel}>SAT</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.colItems}>
              {HOURS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.item, selH === hour && styles.itemSelected]}
                  onPress={() => handleH(hour)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.itemText, selH === hour && styles.itemTextSelected]}>
                    {String(hour).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.separator}>
          <Text style={styles.colon}>:</Text>
        </View>

        {/* Minutes */}
        <View style={styles.col}>
          <Text style={styles.colLabel}>MIN</Text>
          <View style={styles.colItems}>
            {MINUTES.map((min) => (
              <TouchableOpacity
                key={min}
                style={[styles.item, selM === min && styles.itemSelected]}
                onPress={() => handleM(min)}
                activeOpacity={0.75}
              >
                <Text style={[styles.itemText, selM === min && styles.itemTextSelected]}>
                  {String(min).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg, borderRadius: 20,
    padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 16,
  },
  preview: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  previewTime: { fontSize: 52, fontWeight: '800', letterSpacing: -2, color: Colors.text, lineHeight: 58 },
  previewLabel: { fontSize: 12, color: Colors.gray400, fontWeight: '600', letterSpacing: 0.4 },
  cols: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  col: { flex: 1, gap: 8 },
  colLabel: { textAlign: 'center', fontSize: 10, fontWeight: '700', color: Colors.gray400, letterSpacing: 0.6 },
  scroll: { maxHeight: 200 },
  colItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  separator: { paddingTop: 28, alignItems: 'center' },
  colon: { fontSize: 24, fontWeight: '700', color: Colors.gray400 },
  item: {
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 12, backgroundColor: Colors.inputBg,
    borderWidth: 1, borderColor: Colors.border,
    minWidth: 52, alignItems: 'center',
  },
  itemSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  itemText: { fontSize: 15, fontWeight: '600', color: Colors.textDim },
  itemTextSelected: { color: Colors.black, fontWeight: '700' },
});
