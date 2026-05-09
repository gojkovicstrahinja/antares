import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Clock, MapPin, ChevronRight, Star, XCircle, Navigation,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useMyBookings } from '@/hooks/useRides';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import type { BookingWithRide } from '@/types';

const STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Čeka potvrdu', color: Colors.warning },
  confirmed: { label: 'Potvrđena',    color: Colors.accent },
  rejected:  { label: 'Odbijena',     color: Colors.error },
  cancelled: { label: 'Otkazana',     color: Colors.gray500 },
  completed: { label: 'Završena',     color: Colors.gray500 },
};

const TABS = ['Nadolazeće', 'Istorija'] as const;

export default function MyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: bookings = [], isLoading } = useMyBookings(user?.id ?? '');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Nadolazeće');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const upcoming = bookings.filter(
    (b) => ['pending', 'confirmed'].includes(b.status) && b.rides?.datum >= today
  );
  const history = bookings.filter(
    (b) => ['rejected', 'cancelled', 'completed'].includes(b.status)
      || (b.status === 'confirmed' && b.rides?.datum < today)
  );

  const list = activeTab === 'Nadolazeće' ? upcoming : history;

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    setCancelling(null);
    setConfirmCancel(null);
    queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
  };

  const renderItem = ({ item }: { item: BookingWithRide }) => {
    const ride = item.rides;
    const status = STATUS[item.status] ?? STATUS.pending;
    const isToday = ride?.datum === today;
    const isCompleted = item.status === 'completed'
      || (item.status === 'confirmed' && ride?.datum < today);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => ride && router.push(`/ride/${ride.id}`)}
          activeOpacity={0.85}
        >
          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <Text style={styles.city}>{ride?.polaziste ?? '—'}</Text>
            <View style={styles.routeLineH} />
            <Text style={styles.city}>{ride?.odrediste ?? '—'}</Text>
            <View style={styles.routeDotEnd} />
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={12} stroke={Colors.gray400} />
              <Text style={styles.metaText}>
                {ride ? `${formatDate(ride.datum)} · ${ride.vreme_polaska.slice(0, 5)}` : '—'}
              </Text>
            </View>
            {ride && (
              <Text style={styles.price}>{ride.cena_po_osobi.toLocaleString()} RSD</Text>
            )}
          </View>

          {/* Status + today badge */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            {isToday && item.status === 'confirmed' && (
              <View style={styles.todayBadge}>
                <Navigation size={11} stroke={Colors.black} />
                <Text style={styles.todayText}>Danas</Text>
              </View>
            )}
          </View>

          <ChevronRight size={16} stroke={Colors.gray500} style={styles.chevron} />
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          {isToday && item.status === 'confirmed' && ride && (
            <TouchableOpacity
              style={styles.activeBtn}
              onPress={() => router.push(`/ride/active/${ride.id}`)}
            >
              <Navigation size={14} stroke={Colors.black} />
              <Text style={styles.activeBtnText}>Prati vožnju</Text>
            </TouchableOpacity>
          )}

          {isCompleted && ride && (
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => router.push(`/rate/${ride.id}?ocenitiId=${ride.vozac_id}&tip=putnik_ocenjuje_vozaca`)}
            >
              <Star size={14} stroke={Colors.warning} />
              <Text style={styles.rateBtnText}>Oceni vozača</Text>
            </TouchableOpacity>
          )}

          {item.status === 'pending' && (
            confirmCancel === item.id ? (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmText}>Otkazati rezervaciju?</Text>
                <TouchableOpacity
                  style={styles.confirmYes}
                  onPress={() => handleCancel(item.id)}
                  disabled={cancelling === item.id}
                >
                  {cancelling === item.id
                    ? <ActivityIndicator size="small" color={Colors.white} />
                    : <Text style={styles.confirmYesText}>Da</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmNo} onPress={() => setConfirmCancel(null)}>
                  <Text style={styles.confirmNoText}>Ne</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmCancel(item.id)}
              >
                <XCircle size={14} stroke={Colors.error} />
                <Text style={styles.cancelBtnText}>Otkaži</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Moje rezervacije</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
              {tab === 'Nadolazeće' && upcoming.length > 0 && (
                <Text style={styles.tabBadge}> {upcoming.length}</Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.centered}>
          <MapPin size={40} stroke={Colors.gray700} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'Nadolazeće' ? 'Nema nadolazećih rezervacija' : 'Nema istorije'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'Nadolazeće'
              ? 'Pronađite vožnju i rezervišite mesto.'
              : 'Vaše prošle rezervacije će se ovde pojaviti.'}
          </Text>
          {activeTab === 'Nadolazeće' && (
            <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.searchBtnText}>Pretraži vožnje →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  title: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  tabs: {
    flexDirection: 'row', gap: 4, marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.cardBg, borderRadius: 14,
    padding: 4, borderWidth: 1, borderColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  tabActive: { backgroundColor: Colors.text },
  tabText: { color: Colors.textDim, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.black },
  tabBadge: { color: Colors.accent },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  emptyTitle: { color: Colors.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: Colors.gray400, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  searchBtn: {
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: Colors.accentSoft, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accent,
  },
  searchBtnText: { color: Colors.accent, fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: Colors.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  cardMain: { padding: 16, gap: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: Colors.accent,
  },
  routeLineH: { flex: 1, height: 1, backgroundColor: Colors.border },
  routeDotEnd: { width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.text },
  city: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: Colors.gray400, fontSize: 12 },
  price: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  todayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  todayText: { color: Colors.black, fontSize: 11, fontWeight: '700' },
  chevron: { position: 'absolute', right: 16, top: 16 },

  actions: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 10, flexDirection: 'row', gap: 8,
  },
  activeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 9,
  },
  activeBtnText: { color: Colors.black, fontSize: 13, fontWeight: '700' },
  rateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.warning + '18', borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.warning + '44',
  },
  rateBtnText: { color: Colors.warning, fontSize: 13, fontWeight: '600' },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.error + '15', borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.error + '44',
  },
  cancelBtnText: { color: Colors.error, fontSize: 13, fontWeight: '600' },
  confirmRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.error + '15', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  confirmText: { color: Colors.error, fontSize: 12, flex: 1 },
  confirmYes: {
    backgroundColor: Colors.error, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  confirmYesText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  confirmNo: {
    backgroundColor: Colors.inputBg, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  confirmNoText: { color: Colors.gray300, fontSize: 12 },
});
