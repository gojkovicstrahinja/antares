import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Shield, Star } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { RideWithDriver } from '@/types';

interface RideCardProps {
  ride: RideWithDriver;
  onPress: () => void;
}

export function RideCard({ ride, onPress }: RideCardProps) {
  const driver = ride.profiles;
  const confirmedBookings = ride.bookings?.filter((b) => b.status === 'confirmed').length ?? 0;
  const availableSeats = ride.slobodna_mesta - confirmedBookings;
  const initials = `${driver.ime[0]}${driver.prezime[0]}`.toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Timeline layout */}
      <View style={styles.timeline}>
        {/* Time column */}
        <View style={styles.timeCol}>
          <Text style={styles.time}>{ride.vreme_polaska.slice(0, 5)}</Text>
          <View style={styles.lineWrapper}>
            <View style={styles.dotGreen} />
            <View style={styles.line} />
            <View style={styles.dotSquare} />
          </View>
        </View>

        {/* Route column */}
        <View style={styles.routeCol}>
          <Text style={styles.city}>{ride.polaziste}</Text>
          <Text style={styles.duration}>·</Text>
          <Text style={styles.city}>{ride.odrediste}</Text>
        </View>

        {/* Price column */}
        <View style={styles.priceCol}>
          <Text style={styles.price}>{ride.cena_po_osobi.toLocaleString()}</Text>
          <Text style={styles.priceSub}>RSD / osobi</Text>
          {availableSeats === 1 && (
            <View style={styles.lastSeatBadge}>
              <Text style={styles.lastSeatText}>Poslednje!</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Driver row */}
      <View style={styles.driverRow}>
        {driver.foto_url ? (
          <Image source={driver.foto_url} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <View style={styles.driverInfo}>
          <View style={styles.driverNameRow}>
            <Text style={styles.driverName}>{driver.ime} {driver.prezime[0]}.</Text>
            {driver.verifikovan_id && (
              <Shield size={13} stroke={Colors.accent} strokeWidth={2.2} />
            )}
          </View>
          <View style={styles.ratingRow}>
            <Star size={10} stroke={Colors.warning} fill={Colors.warning} />
            <Text style={styles.rating}>{driver.ocena_prosek.toFixed(1)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.trips}>{driver.broj_voznji} vožnji</Text>
          </View>
        </View>
        <View style={styles.seatsChip}>
          <Text style={[styles.seatsNum, availableSeats <= 1 && styles.seatsLow]}>
            {availableSeats}
          </Text>
          <Text style={styles.seatsMeta}> mesta</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg, borderRadius: 20,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  timeline: { flexDirection: 'row', gap: 14 },
  timeCol: { alignItems: 'center', width: 48 },
  time: { fontSize: 17, fontWeight: '700', letterSpacing: -0.5, color: Colors.text },
  lineWrapper: { alignItems: 'center', marginTop: 5 },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  line: { width: 1.5, height: 34, backgroundColor: Colors.borderStrong, marginVertical: 3 },
  dotSquare: { width: 8, height: 8, borderRadius: 2, backgroundColor: Colors.text },
  routeCol: { flex: 1, paddingTop: 2, gap: 2 },
  city: { fontSize: 14, fontWeight: '600', color: Colors.text },
  duration: { fontSize: 11, color: Colors.gray400 },
  priceCol: { alignItems: 'flex-end', paddingTop: 2 },
  price: { fontSize: 22, fontWeight: '800', letterSpacing: -0.8, color: Colors.text, lineHeight: 26 },
  priceSub: { fontSize: 10, color: Colors.gray400, fontWeight: '600', letterSpacing: 0.3, marginTop: 2 },
  lastSeatBadge: {
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: Colors.accentSoft, borderRadius: 8,
  },
  lastSeatText: { fontSize: 10, color: Colors.accent, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentDark,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  driverInfo: { flex: 1 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  driverName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { fontSize: 11, color: Colors.gray400 },
  metaDot: { fontSize: 11, color: Colors.gray400 },
  trips: { fontSize: 11, color: Colors.gray400 },
  seatsChip: { flexDirection: 'row', alignItems: 'baseline' },
  seatsNum: { fontSize: 15, fontWeight: '700', color: Colors.text },
  seatsLow: { color: Colors.warning },
  seatsMeta: { fontSize: 11, color: Colors.gray400 },
});
