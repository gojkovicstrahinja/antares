import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft, Star, Shield, Car, Users, Clock, MapPin, MessageCircle, CheckCircle, AlertCircle,
} from 'lucide-react-native';
import { RouteMap } from '@/components/maps/RouteMap';
import { formatDate } from '@/lib/utils';
import { Colors } from '@/constants/colors';
import { useRide, useBookRide } from '@/hooks/useRides';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

function hapticSuccess() {
  if (Platform.OS === 'web') return;
  import('expo-haptics').then(({ notificationAsync, NotificationFeedbackType }) => {
    notificationAsync(NotificationFeedbackType.Success);
  }).catch(() => {});
}

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: ride, isLoading } = useRide(id!);
  const { mutateAsync: bookRide, isPending: booking } = useBookRide();
  const [booked, setBooked] = useState(false);
  const [bookError, setBookError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const handleBook = () => {
    setBookError('');
    setConfirming(true);
  };

  const confirmBook = async () => {
    if (!user || !ride) return;
    setConfirming(false);
    try {
      await bookRide({
        ride_id: ride.id,
        putnik_id: user.id,
        broj_mesta: 1,
        vozac_id: ride.vozac_id,
        polaziste: ride.polaziste,
        odrediste: ride.odrediste,
      });
      hapticSuccess();
      setBooked(true);
    } catch (e: unknown) {
      setBookError(e instanceof Error ? e.message : 'Rezervacija nije uspela.');
    }
  };

  const handleChat = () => {
    if (!ride) return;
    router.push(`/chat/${ride.vozac_id}`);
  };

  if (isLoading || !ride) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const driver = ride.profiles;
  const confirmedBookings = ride.bookings?.filter((b) => b.status === 'confirmed').length ?? 0;
  const availableSeats = ride.slobodna_mesta - confirmedBookings;
  const isOwner = user?.id === ride.vozac_id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/search')} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalji vožnje</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <RouteMap
          polaziste={ride.polaziste}
          odrediste={ride.odrediste}
          stops={ride.ride_stops?.map((s) => s.grad) ?? []}
        />

        <View style={styles.routeCard}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, styles.dotStart]} />
            <View style={styles.routeInfo}>
              <Text style={styles.cityName}>{ride.polaziste}</Text>
              <Text style={styles.routeTime}>{ride.vreme_polaska.slice(0, 5)}</Text>
            </View>
          </View>
          <View style={styles.routeLine}>
            <View style={styles.routeLineInner} />
          </View>
          <View style={styles.routePoint}>
            <View style={[styles.dot, styles.dotEnd]} />
            <View style={styles.routeInfo}>
              <Text style={styles.cityName}>{ride.odrediste}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={18} color={Colors.accent} />
            <Text style={styles.metaText}>{formatDate(ride.datum)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Users size={18} color={Colors.accent} />
            <Text style={styles.metaText}>{availableSeats} slobodnih</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.priceText}>{ride.cena_po_osobi.toLocaleString()} RSD</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.driverCard}
          onPress={() => router.push(`/profile/${ride.vozac_id}`)}
          activeOpacity={0.85}
        >
          <Image
            source={driver.foto_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.ime)}+${encodeURIComponent(driver.prezime)}&background=1A1A1A&color=00C566&size=200`}
            style={styles.driverAvatar}
            contentFit="cover"
          />
          <View style={styles.driverInfo}>
            <View style={styles.driverNameRow}>
              <Text style={styles.driverName}>{driver.ime} {driver.prezime}</Text>
              {driver.verifikovan_id && (
                <Shield size={14} stroke={Colors.accent} />
              )}
            </View>
            <View style={styles.ratingRow}>
              <Star size={14} stroke={Colors.accent} fill={Colors.accent} />
              <Text style={styles.rating}>{driver.ocena_prosek.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>· {driver.broj_voznji} vožnji · Pogledaj profil →</Text>
            </View>
          </View>
          {!isOwner && (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={(e) => { e.stopPropagation?.(); handleChat(); }}
            >
              <MessageCircle size={20} stroke={Colors.accent} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {ride.vehicles && (
          <View style={styles.vehicleCard}>
            <Car size={18} color={Colors.gray400} />
            <Text style={styles.vehicleText}>
              {ride.vehicles.marka} {ride.vehicles.model}
              {ride.vehicles.boja ? ` · ${ride.vehicles.boja}` : ''}
            </Text>
          </View>
        )}

        {ride.ride_stops && ride.ride_stops.length > 0 && (
          <View style={styles.stopsCard}>
            <Text style={styles.stopsTitle}>Usputne stanice</Text>
            {ride.ride_stops
              .sort((a, b) => a.redni_broj - b.redni_broj)
              .map((stop) => (
                <View key={stop.id} style={styles.stop}>
                  <MapPin size={14} color={Colors.gray400} />
                  <Text style={styles.stopText}>{stop.grad}</Text>
                  {stop.cena_do_grada && (
                    <Text style={styles.stopPrice}>{stop.cena_do_grada.toLocaleString()} RSD</Text>
                  )}
                </View>
              ))}
          </View>
        )}

        {ride.napomene && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Napomene vozača</Text>
            <Text style={styles.notesText}>{ride.napomene}</Text>
          </View>
        )}
      </ScrollView>

      {!isOwner && (
        <View style={styles.footer}>
          {booked ? (
            <View style={styles.bookedMsg}>
              <CheckCircle size={20} stroke={Colors.accent} />
              <Text style={styles.bookedText}>Rezervacija je poslata vozaču</Text>
            </View>
          ) : confirming ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                Rezervisati mesto: {ride.polaziste} → {ride.odrediste} za {ride.cena_po_osobi.toLocaleString()} RSD?
              </Text>
              <View style={styles.confirmBtns}>
                <Button title="Otkaži" onPress={() => setConfirming(false)} variant="secondary" style={{ flex: 1 }} />
                <Button title="Potvrdi" onPress={confirmBook} loading={booking} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <>
              {bookError ? (
                <View style={styles.bookErrorBox}>
                  <AlertCircle size={15} stroke={Colors.error} />
                  <Text style={styles.bookErrorText}>{bookError}</Text>
                </View>
              ) : null}
              <Button
                title={availableSeats === 0 ? 'Nema slobodnih mesta' : `Rezerviši · ${ride.cena_po_osobi.toLocaleString()} RSD`}
                onPress={handleBook}
                loading={booking}
                disabled={availableSeats === 0}
                size="lg"
                style={styles.bookBtn}
              />
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, gap: 16, paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  routeCard: {
    backgroundColor: Colors.cardBg, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  dotStart: { borderColor: Colors.accent },
  dotEnd: { borderColor: Colors.gray400, backgroundColor: Colors.gray400 },
  routeInfo: { gap: 2 },
  cityName: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  routeTime: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  routeLine: { marginLeft: 7, marginVertical: 6 },
  routeLineInner: { width: 2, height: 32, backgroundColor: Colors.border, marginLeft: 5 },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.cardBg, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  metaItem: { alignItems: 'center', gap: 6 },
  metaText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  priceText: { color: Colors.accent, fontSize: 20, fontWeight: '800' },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.cardBg, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  driverAvatar: { width: 56, height: 56, borderRadius: 28 },
  driverInfo: { flex: 1, gap: 4 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  driverName: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  verifiedIcon: {},
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: Colors.accent, fontWeight: '600', fontSize: 13 },
  ratingCount: { color: Colors.gray500, fontSize: 13 },
  chatBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,197,102,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.cardBg, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  vehicleText: { color: Colors.gray300, fontSize: 14 },
  stopsCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    padding: 16, gap: 10, borderWidth: 1, borderColor: Colors.border,
  },
  stopsTitle: { color: Colors.white, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopText: { flex: 1, color: Colors.gray300, fontSize: 14 },
  stopPrice: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  notesCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.border,
  },
  notesTitle: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  notesText: { color: Colors.gray400, fontSize: 14, lineHeight: 20 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: Colors.black, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  bookBtn: { width: '100%' },
  bookedMsg: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  bookedText: { color: Colors.accent, fontSize: 15, fontWeight: '600' },
  confirmBox: { gap: 12 },
  confirmText: { color: Colors.white, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  bookErrorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: Colors.error, marginBottom: 8,
  },
  bookErrorText: { color: Colors.error, fontSize: 13, flex: 1 },
});
