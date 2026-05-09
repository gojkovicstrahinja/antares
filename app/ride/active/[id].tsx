import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, MessageCircle, MapPin, CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useRide } from '@/hooks/useRides';
import { useRealtimeLocation } from '@/hooks/useRealtime';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const STATUS_LABELS: Record<string, string> = {
  aktivna: 'Vožnja nije počela',
  u_toku: 'Vožnja je u toku',
  zavrsena: 'Vožnja je završena',
  otkazana: 'Vožnja je otkazana',
};

export default function ActiveRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: ride, refetch } = useRide(id!);
  const [driverLocation, setDriverLocation] = useState<{ x: number; y: number } | null>(null);
  const [callInfo, setCallInfo] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useRealtimeLocation(id!, (coords) => setDriverLocation(coords));

  if (!ride) return null;

  const isDriver = user?.id === ride.vozac_id;

  const handleFinishRide = async () => {
    setFinishing(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'zavrsena' })
      .eq('id', ride.id);

    if (!error) {
      // Notify all confirmed passengers
      const confirmed = ride.bookings?.filter((b) => b.status === 'confirmed') ?? [];
      for (const booking of confirmed) {
        await supabase.from('notifications').insert({
          user_id: booking.putnik_id,
          tip: 'voznja_zavrsena',
          naslov: 'Vožnja završena',
          telo: `${ride.polaziste} → ${ride.odrediste}. Ostavite ocenu!`,
          data: { ride_id: ride.id },
          read: false,
        });
      }

      await refetch();
      // Redirect driver to rate first passenger (or home if none)
      const firstPassenger = confirmed[0];
      if (firstPassenger) {
        router.replace(`/rate/${ride.id}?ocenitiId=${firstPassenger.putnik_id}&tip=vozac_ocenjuje_putnika`);
      } else {
        router.replace('/(tabs)');
      }
    }
    setFinishing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Aktivna vožnja</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <MapPin size={48} stroke={Colors.accent} />
        <Text style={styles.mapText}>
          {driverLocation
            ? `Vozač na: ${driverLocation.y.toFixed(4)}, ${driverLocation.x.toFixed(4)}`
            : 'Čekanje na lokaciju vozača...'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{STATUS_LABELS[ride.status] ?? ride.status}</Text>
        </View>

        <View style={styles.routeInfo}>
          <Text style={styles.routeFrom}>{ride.polaziste}</Text>
          <Text style={styles.routeArrow}>→</Text>
          <Text style={styles.routeTo}>{ride.odrediste}</Text>
        </View>

        <View style={styles.actions}>
          {!isDriver && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/chat/${ride.vozac_id}`)}
            >
              <MessageCircle size={22} stroke={Colors.white} />
              <Text style={styles.actionText}>Poruka</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAccent]}
            onPress={() => setCallInfo(true)}
          >
            <Phone size={22} stroke={Colors.black} />
            <Text style={[styles.actionText, styles.actionTextDark]}>Pozovi</Text>
          </TouchableOpacity>
        </View>

        {/* Driver: finish ride button */}
        {isDriver && ride.status === 'u_toku' && (
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={handleFinishRide}
            disabled={finishing}
            activeOpacity={0.85}
          >
            {finishing
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <CheckCircle size={20} stroke={Colors.white} />
                  <Text style={styles.finishBtnText}>Završi vožnju</Text>
                </>}
          </TouchableOpacity>
        )}

        {ride.status === 'zavrsena' && (
          <View style={styles.finishedBanner}>
            <CheckCircle size={18} stroke={Colors.accent} />
            <Text style={styles.finishedText}>Vožnja je završena</Text>
          </View>
        )}

        {callInfo && (
          <View style={styles.callInfoBanner}>
            <Text style={styles.callInfoText}>Funkcija poziva dolazi uskoro.</Text>
            <TouchableOpacity onPress={() => setCallInfo(false)}>
              <Text style={styles.callInfoClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  mapPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gray900, gap: 16,
  },
  mapText: { color: Colors.gray400, fontSize: 14 },
  infoCard: {
    backgroundColor: Colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 16, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,197,102,0.15)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  statusText: { color: Colors.accent, fontWeight: '600', fontSize: 13 },
  routeInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeFrom: { color: Colors.white, fontSize: 20, fontWeight: '700', flex: 1 },
  routeArrow: { color: Colors.gray500, fontSize: 18 },
  routeTo: { color: Colors.white, fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.inputBg, borderRadius: 16,
    paddingVertical: 14, borderWidth: 1, borderColor: Colors.border,
  },
  actionBtnAccent: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  actionText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  actionTextDark: { color: Colors.black },
  finishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.error, borderRadius: 16, paddingVertical: 15,
  },
  finishBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  finishedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: Colors.accentSoft, borderRadius: 12, paddingVertical: 12,
  },
  finishedText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  callInfoBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.inputBg, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  callInfoText: { color: Colors.gray300, fontSize: 14 },
  callInfoClose: { color: Colors.gray500, fontSize: 16, paddingLeft: 12 },
});
