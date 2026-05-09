import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface RouteMapProps {
  polaziste: string;
  odrediste: string;
  stops?: string[];
  style?: ViewStyle;
}

// Na nativnom - placeholder dok se ne integriše react-native-maps
export function RouteMap({ polaziste, odrediste, stops = [], style }: RouteMapProps) {
  return (
    <View style={[styles.container, style]}>
      <MapPin size={28} stroke={Colors.accent} />
      <Text style={styles.text}>{polaziste} → {odrediste}</Text>
      <Text style={styles.sub}>Mapa dostupna na webu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200, borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  text: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  sub: { color: Colors.gray500, fontSize: 12 },
});
