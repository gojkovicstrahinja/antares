import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Clock, Users, Star } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { RideWithDriver } from '@/types';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';

interface RideCardProps {
  ride: RideWithDriver;
  onPress: () => void;
}

export function RideCard({ ride, onPress }: RideCardProps) {
  const driver = ride.profiles;
  const confirmedBookings = ride.bookings?.filter((b) => b.status === 'confirmed').length ?? 0;
  const availableSeats = ride.slobodna_mesta - confirmedBookings;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={styles.driverInfo}>
          <Image
            source={driver.foto_url ?? 'https://ui-avatars.com/api/?name=' + driver.ime + '+' + driver.prezime + '&background=1A1A1A&color=00C566'}
            style={styles.avatar}
            contentFit="cover"
          />
          <View>
            <Text style={styles.driverName}>{driver.ime} {driver.prezime}</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color={Colors.accent} fill={Colors.accent} />
              <Text style={styles.rating}>{driver.ocena_prosek.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>· {driver.broj_voznji} vožnji</Text>
            </View>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.price}>{ride.cena_po_osobi.toLocaleString()} RSD</Text>
          <Text style={styles.priceLabel}>po osobi</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routePoint}>
          <View style={[styles.dot, styles.dotStart]} />
          <Text style={styles.city}>{ride.polaziste}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.dot, styles.dotEnd]} />
          <Text style={styles.city}>{ride.odrediste}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Clock size={14} color={Colors.gray400} />
          <Text style={styles.footerText}>{ride.vreme_polaska.slice(0, 5)}</Text>
        </View>
        <View style={styles.footerItem}>
          <Users size={14} color={Colors.gray400} />
          <Text style={styles.footerText}>{availableSeats} slobodnih mesta</Text>
        </View>
        {driver.verifikovan_id && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verifikovan</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  driverInfo: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  driverName: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  rating: { color: Colors.accent, fontSize: 12, fontWeight: '600' },
  ratingCount: { color: Colors.gray500, fontSize: 12 },
  priceTag: { alignItems: 'flex-end' },
  price: { color: Colors.accent, fontWeight: '700', fontSize: 18 },
  priceLabel: { color: Colors.gray500, fontSize: 11, marginTop: 2 },
  route: { gap: 6 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeLine: { height: 1, backgroundColor: Colors.border, marginLeft: 7, marginVertical: 2 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  dotStart: { borderColor: Colors.accent, backgroundColor: 'transparent' },
  dotEnd: { borderColor: Colors.gray400, backgroundColor: Colors.gray400 },
  city: { color: Colors.white, fontSize: 15, fontWeight: '500' },
  footer: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  footerItem: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  footerText: { color: Colors.gray400, fontSize: 13 },
  verifiedBadge: {
    backgroundColor: 'rgba(0, 197, 102, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  verifiedText: { color: Colors.accent, fontSize: 11, fontWeight: '600' },
});
