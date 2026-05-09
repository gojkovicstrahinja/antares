import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Users, ChevronRight, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useMyRides } from '@/hooks/useRides';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import type { RideWithDriver, Booking } from '@/types';
import { formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  aktivna: { label: 'Aktivna', color: Colors.accent },
  u_toku: { label: 'U toku', color: Colors.info },
  zavrsena: { label: 'Završena', color: Colors.gray500 },
  otkazana: { label: 'Otkazana', color: Colors.error },
};

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Čeka potvrdu', color: Colors.warning },
  confirmed: { label: 'Potvrđena',   color: Colors.accent },
  rejected:  { label: 'Odbijena',    color: Colors.error },
  cancelled: { label: 'Otkazana',    color: Colors.gray500 },
  completed: { label: 'Završena',    color: Colors.gray500 },
};

export default function MyRidesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: rides = [], isLoading } = useMyRides(user?.id ?? '');
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const handleBookingAction = async (
    bookingId: string,
    action: 'confirmed' | 'rejected'
  ) => {
    setActionLoading(bookingId);
    await supabase.from('bookings').update({ status: action }).eq('id', bookingId);
    setActionLoading(null);
    queryClient.invalidateQueries({ queryKey: ['my-rides'] });
  };

  const handleCancelRide = async (rideId: string) => {
    setActionLoading(rideId);
    await supabase.from('rides').update({ status: 'otkazana' }).eq('id', rideId);
    setActionLoading(null);
    queryClient.invalidateQueries({ queryKey: ['my-rides'] });
  };

  const handleDeleteRide = async (rideId: string) => {
    setActionLoading(rideId);
    await supabase.from('rides').delete().eq('id', rideId);
    setActionLoading(null);
    queryClient.invalidateQueries({ queryKey: ['my-rides'] });
  };

  const renderRide = ({ item: ride }: { item: RideWithDriver }) => {
    const status = STATUS_LABEL[ride.status] ?? STATUS_LABEL.aktivna;
    const pendingBookings = ride.bookings?.filter((b) => b.status === 'pending') ?? [];
    const confirmedBookings = ride.bookings?.filter((b) => b.status === 'confirmed') ?? [];
    const isOpen = expanded === ride.id;

    return (
      <View style={styles.rideCard}>
        <TouchableOpacity
          style={styles.rideHeader}
          onPress={() => setExpanded(isOpen ? null : ride.id)}
          activeOpacity={0.8}
        >
          <View style={styles.rideRoute}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, styles.dotStart]} />
              <Text style={styles.cityText}>{ride.polaziste}</Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, styles.dotEnd]} />
              <Text style={styles.cityText}>{ride.odrediste}</Text>
            </View>
          </View>

          <View style={styles.rideMeta}>
            <View style={styles.metaRow}>
              <Clock size={13} stroke={Colors.gray400} />
              <Text style={styles.metaText}>{formatDate(ride.datum)} · {ride.vreme_polaska.slice(0, 5)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Users size={13} stroke={Colors.gray400} />
              <Text style={styles.metaText}>
                {confirmedBookings.length}/{ride.slobodna_mesta} mesta
              </Text>
              {pendingBookings.length > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingBookings.length} čeka</Text>
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.cenaText}>{ride.cena_po_osobi.toLocaleString()} RSD</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.color + '22', borderColor: status.color }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          </View>

          <ChevronRight
            size={18}
            stroke={Colors.gray500}
            style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.rideDetails}>
            {/* Rezervacije */}
            {(ride.bookings?.length ?? 0) === 0 ? (
              <Text style={styles.noBookings}>Još nema rezervacija.</Text>
            ) : (
              <>
                <Text style={styles.bookingsTitle}>Rezervacije</Text>
                {ride.bookings?.map((booking: Booking) => (
                  <View key={booking.id} style={styles.bookingRow}>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingName}>
                        {booking.polazna_stanica
                          ? `${booking.polazna_stanica} → ${booking.izlazna_stanica}`
                          : 'Cela ruta'}
                      </Text>
                      <View style={[
                        styles.bookingStatus,
                        { backgroundColor: (BOOKING_STATUS[booking.status]?.color ?? Colors.gray500) + '22' }
                      ]}>
                        <Text style={[
                          styles.bookingStatusText,
                          { color: BOOKING_STATUS[booking.status]?.color ?? Colors.gray500 }
                        ]}>
                          {BOOKING_STATUS[booking.status]?.label ?? booking.status}
                        </Text>
                      </View>
                    </View>
                    {booking.status === 'pending' && (
                      <View style={styles.bookingActions}>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleBookingAction(booking.id, 'rejected')}
                          disabled={actionLoading === booking.id}
                        >
                          <XCircle size={18} stroke={Colors.error} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() => handleBookingAction(booking.id, 'confirmed')}
                          disabled={actionLoading === booking.id}
                        >
                          {actionLoading === booking.id
                            ? <ActivityIndicator size="small" color={Colors.black} />
                            : <CheckCircle size={18} stroke={Colors.black} />
                          }
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* Akcije */}
            <View style={styles.rideActions}>
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => router.push(`/ride/${ride.id}`)}
              >
                <MapPin size={15} stroke={Colors.accent} />
                <Text style={styles.viewBtnText}>Pogledaj</Text>
              </TouchableOpacity>
              {ride.status === 'otkazana' && (
                confirmDelete === ride.id ? (
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmText}>Sigurno izbrišeš?</Text>
                    <TouchableOpacity style={styles.confirmYes} onPress={() => { setConfirmDelete(null); handleDeleteRide(ride.id); }} disabled={actionLoading === ride.id}>
                      {actionLoading === ride.id
                        ? <ActivityIndicator size="small" color={Colors.black} />
                        : <Text style={styles.confirmYesText}>Da</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmNo} onPress={() => setConfirmDelete(null)}>
                      <Text style={styles.confirmNoText}>Ne</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => setConfirmDelete(ride.id)}
                    disabled={actionLoading === ride.id}
                  >
                    <Trash2 size={15} stroke={Colors.error} />
                    <Text style={styles.cancelBtnText}>Izbriši</Text>
                  </TouchableOpacity>
                )
              )}
              {ride.status === 'aktivna' && (
                confirmCancel === ride.id ? (
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmText}>Otkaži vožnju?</Text>
                    <TouchableOpacity style={styles.confirmYes} onPress={() => { setConfirmCancel(null); handleCancelRide(ride.id); }} disabled={actionLoading === ride.id}>
                      {actionLoading === ride.id
                        ? <ActivityIndicator size="small" color={Colors.black} />
                        : <Text style={styles.confirmYesText}>Da</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmNo} onPress={() => setConfirmCancel(null)}>
                      <Text style={styles.confirmNoText}>Ne</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setConfirmCancel(ride.id)}
                    disabled={actionLoading === ride.id}
                  >
                    <Trash2 size={15} stroke={Colors.error} />
                    <Text style={styles.cancelBtnText}>Otkaži vožnju</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.backBtn}>
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Moje vožnje</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(tabs)/offer?from=my-rides')}
        >
          <Plus size={22} stroke={Colors.accent} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Još niste objavili vožnju</Text>
          <Text style={styles.emptyText}>
            Podelite prevoz i pomozite drugima da stignu do cilja.
          </Text>
          <TouchableOpacity
            style={styles.offerBtn}
            onPress={() => router.push('/(tabs)/offer')}
          >
            <Plus size={18} stroke={Colors.black} />
            <Text style={styles.offerBtnText}>Objavi prvu vožnju</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={renderRide}
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, color: Colors.white, fontSize: 20, fontWeight: '700', marginLeft: 12 },
  addBtn: { padding: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  emptyTitle: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  emptyText: { color: Colors.gray400, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  offerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  offerBtnText: { color: Colors.black, fontSize: 15, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },

  rideCard: {
    backgroundColor: Colors.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  rideHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
  },
  rideRoute: { width: 110, gap: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeConnector: { height: 12, width: 2, backgroundColor: Colors.border, marginLeft: 5, marginVertical: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  dotStart: { borderColor: Colors.accent },
  dotEnd: { borderColor: Colors.gray400, backgroundColor: Colors.gray400 },
  cityText: { color: Colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
  rideMeta: { flex: 1, gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: Colors.gray400, fontSize: 12 },
  cenaText: { color: Colors.white, fontSize: 13, fontWeight: '700', flex: 1 },
  pendingBadge: {
    backgroundColor: Colors.warning + '33', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  pendingBadgeText: { color: Colors.warning, fontSize: 11, fontWeight: '700' },
  statusBadge: {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  rideDetails: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 16, gap: 12,
  },
  noBookings: { color: Colors.gray500, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  bookingsTitle: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  bookingRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg, borderRadius: 10,
    padding: 10, gap: 10,
  },
  bookingInfo: { flex: 1, gap: 4 },
  bookingName: { color: Colors.white, fontSize: 13 },
  bookingStatus: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  bookingStatusText: { fontSize: 11, fontWeight: '700' },
  bookingActions: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.error + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  rideActions: { flexDirection: 'row', gap: 10 },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(0,197,102,0.1)',
    borderWidth: 1, borderColor: Colors.accent,
  },
  viewBtnText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.error + '15',
    borderWidth: 1, borderColor: Colors.error,
  },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.error + '15',
    borderWidth: 1, borderColor: Colors.error,
  },
  cancelBtnText: { color: Colors.error, fontSize: 13, fontWeight: '600' },
  confirmRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.error + '15', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.error,
  },
  confirmText: { color: Colors.error, fontSize: 12, flex: 1 },
  confirmYes: {
    backgroundColor: Colors.error, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  confirmYesText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  confirmNo: {
    backgroundColor: Colors.inputBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  confirmNoText: { color: Colors.gray300, fontSize: 12, fontWeight: '600' },
});
