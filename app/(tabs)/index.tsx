import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import {
  Search, Car, Clock, Users, ChevronRight, Bell, Navigation,
  ArrowRight, X, Star, Plus, MapPin, CheckCircle, XCircle, TrendingUp,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useRideStore } from '@/stores/rideStore';
import { useMyRides } from '@/hooks/useRides';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { Pressable } from '@/components/ui/Pressable';
import { formatDate } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import type { RideWithDriver, Booking } from '@/types';

function useFadeIn(delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 320, delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return anim;
}

function useSlideIn(delay = 0, fromY = 12) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 28, bounciness: 4 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

const RECENT_DESTINATIONS = ['Novi Sad', 'Niš', 'Kragujevac', 'Subotica'];

const POPULAR_ROUTES = [
  { from: 'Beograd', to: 'Novi Sad', price: 600, time: '1h 15m' },
  { from: 'Beograd', to: 'Niš', price: 1200, time: '2h 45m' },
  { from: 'Novi Sad', to: 'Subotica', price: 400, time: '1h 05m' },
];

// ─── Driver dashboard ──────────────────────────────────────────────────────

function DriverDashboard({ userId, profile, router }: {
  userId: string;
  profile: { ocena_prosek: number; ime: string } | null;
  router: ReturnType<typeof useRouter>;
}) {
  const queryClient = useQueryClient();
  const { data: rides = [], isLoading } = useMyRides(userId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const stat0 = useSlideIn(0);
  const stat1 = useSlideIn(60);
  const stat2 = useSlideIn(120);
  const nextRideAnim = useSlideIn(80);
  const pendingAnim = useSlideIn(160);
  const ctaAnim = useFadeIn(240);

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const finished = rides.filter((r) => r.status === 'zavrsena');
    const active = rides.filter((r) => r.status === 'aktivna');
    const totalPassengers = finished.reduce(
      (sum, r) => sum + (r.bookings?.filter((b) => b.status === 'confirmed').length ?? 0),
      0,
    );
    return {
      total: finished.length,
      active: active.length,
      passengers: totalPassengers,
    };
  }, [rides]);

  const nextRide: RideWithDriver | undefined = useMemo(() => {
    return rides
      .filter((r) => r.status === 'aktivna' && r.datum >= today)
      .sort((a, b) => {
        const da = a.datum + a.vreme_polaska;
        const db = b.datum + b.vreme_polaska;
        return da.localeCompare(db);
      })[0];
  }, [rides, today]);

  const pendingBookings: Array<{ booking: Booking; ride: RideWithDriver }> = useMemo(() => {
    const result: Array<{ booking: Booking; ride: RideWithDriver }> = [];
    for (const ride of rides) {
      for (const booking of ride.bookings ?? []) {
        if (booking.status === 'pending') {
          result.push({ booking, ride });
        }
      }
    }
    return result;
  }, [rides]);

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected') => {
    setActionLoading(bookingId);
    await supabase.from('bookings').update({ status: action }).eq('id', bookingId);
    setActionLoading(null);
    queryClient.invalidateQueries({ queryKey: ['my-rides'] });
  };

  if (isLoading) {
    return (
      <View style={d.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={d.container}>
      {/* Stats row */}
      <View style={d.statsRow}>
        <Animated.View style={[d.statCard, stat0]}>
          <Text style={d.statValue}>{stats.total}</Text>
          <Text style={d.statLabel}>Završenih</Text>
        </Animated.View>
        <Animated.View style={[d.statCard, d.statCardMid, stat1]}>
          <Text style={d.statValue}>{stats.active}</Text>
          <Text style={d.statLabel}>Aktivnih</Text>
        </Animated.View>
        <Animated.View style={[d.statCard, stat2]}>
          <View style={d.statRatingRow}>
            <Star size={13} stroke={Colors.warning} fill={Colors.warning} />
            <Text style={d.statValue}>{(profile?.ocena_prosek ?? 0).toFixed(1)}</Text>
          </View>
          <Text style={d.statLabel}>Ocena</Text>
        </Animated.View>
      </View>

      {/* Next ride */}
      {nextRide ? (
        <Animated.View style={[d.section, nextRideAnim]}>
          <Text style={d.sectionTitle}>Sledeća vožnja</Text>
          <Pressable
            style={d.nextRideCard}
            onPress={() => router.push(`/ride/${nextRide.id}`)}
            pressScale={0.985}
            hoverScale={1.01}
          >
            <View style={d.nextRideRoute}>
              <View style={d.routeDotStart} />
              <Text style={d.nextRideCity}>{nextRide.polaziste}</Text>
              <View style={d.routeLineH} />
              <Text style={d.nextRideCity}>{nextRide.odrediste}</Text>
              <View style={d.routeDotEnd} />
            </View>
            <View style={d.nextRideMeta}>
              <View style={d.nextRideMetaItem}>
                <Clock size={13} stroke={Colors.gray400} />
                <Text style={d.nextRideMetaText}>
                  {formatDate(nextRide.datum)} · {nextRide.vreme_polaska.slice(0, 5)}
                </Text>
              </View>
              <View style={d.nextRideMetaItem}>
                <Users size={13} stroke={Colors.gray400} />
                <Text style={d.nextRideMetaText}>
                  {nextRide.bookings?.filter((b) => b.status === 'confirmed').length ?? 0}/{nextRide.slobodna_mesta} mesta
                </Text>
              </View>
              <Text style={d.nextRidePrice}>{nextRide.cena_po_osobi.toLocaleString()} RSD</Text>
            </View>
            <ChevronRight size={16} stroke={Colors.gray400} style={d.nextRideChevron} />
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View style={[d.noRideBanner, nextRideAnim]}>
          <MapPin size={20} stroke={Colors.gray500} />
          <Text style={d.noRideText}>Nemate zakazanih vožnji</Text>
        </Animated.View>
      )}

      {/* Pending bookings */}
      {pendingBookings.length > 0 && (
        <Animated.View style={[d.section, pendingAnim]}>
          <View style={d.sectionHeader}>
            <Text style={d.sectionTitle}>Čeka potvrdu</Text>
            <View style={d.pendingBadge}>
              <Text style={d.pendingBadgeText}>{pendingBookings.length}</Text>
            </View>
          </View>
          {pendingBookings.map(({ booking, ride }) => (
            <View key={booking.id} style={d.pendingCard}>
              <View style={d.pendingInfo}>
                <Text style={d.pendingRoute}>
                  {booking.polazna_stanica
                    ? `${booking.polazna_stanica} → ${booking.izlazna_stanica}`
                    : `${ride.polaziste} → ${ride.odrediste}`}
                </Text>
                <Text style={d.pendingDate}>
                  {formatDate(ride.datum)} · {ride.vreme_polaska.slice(0, 5)}
                </Text>
              </View>
              <View style={d.pendingActions}>
                <TouchableOpacity
                  style={d.rejectBtn}
                  onPress={() => handleBookingAction(booking.id, 'rejected')}
                  disabled={actionLoading === booking.id}
                >
                  <XCircle size={20} stroke={Colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={d.confirmBtn}
                  onPress={() => handleBookingAction(booking.id, 'confirmed')}
                  disabled={actionLoading === booking.id}
                >
                  {actionLoading === booking.id
                    ? <ActivityIndicator size="small" color={Colors.black} />
                    : <CheckCircle size={20} stroke={Colors.black} />}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Stats teaser if no rides yet */}
      {stats.total === 0 && stats.active === 0 && (
        <Animated.View style={[d.tipCard, ctaAnim]}>
          <TrendingUp size={18} stroke={Colors.accent} />
          <Text style={d.tipText}>Objavite vožnju i počnite da zaradjujete uz put.</Text>
        </Animated.View>
      )}

      {/* CTA */}
      <Animated.View style={ctaAnim}>
        <Pressable style={d.offerBtn} onPress={() => router.push('/(tabs)/offer')} pressScale={0.97}>
          <Plus size={18} stroke={Colors.black} strokeWidth={2.5} />
          <Text style={d.offerBtnText}>Objavi novu vožnju</Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={[d.myRidesLink, ctaAnim]}>
        <Pressable onPress={() => router.push('/my-rides')} pressScale={0.97}>
          <Text style={d.myRidesLinkText}>Sve moje vožnje →</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const d = StyleSheet.create({
  container: { gap: 20 },
  loading: { paddingVertical: 40, alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: 0 },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 18,
    backgroundColor: Colors.cardBg,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 0,
  },
  statCardMid: {
    borderLeftWidth: 0, borderRightWidth: 0,
  },
  statValue: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Colors.gray400, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: Colors.text, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  pendingBadge: {
    backgroundColor: Colors.warning + '33', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  pendingBadgeText: { color: Colors.warning, fontSize: 11, fontWeight: '700' },

  nextRideCard: {
    backgroundColor: Colors.cardBg, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 12,
  },
  nextRideRoute: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDotStart: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: Colors.accent,
  },
  routeLineH: { flex: 1, height: 1, backgroundColor: Colors.border },
  routeDotEnd: {
    width: 10, height: 10, borderRadius: 2,
    backgroundColor: Colors.text,
  },
  nextRideCity: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  nextRideMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  nextRideMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nextRideMetaText: { color: Colors.gray400, fontSize: 12 },
  nextRidePrice: { color: Colors.accent, fontSize: 13, fontWeight: '700', marginLeft: 'auto' },
  nextRideChevron: { position: 'absolute', right: 16, top: 16 },

  noRideBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16,
  },
  noRideText: { color: Colors.gray400, fontSize: 13 },

  pendingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, gap: 12,
  },
  pendingInfo: { flex: 1, gap: 3 },
  pendingRoute: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  pendingDate: { color: Colors.gray400, fontSize: 12 },
  pendingActions: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.error + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.accentSoft, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accent + '30',
    padding: 14,
  },
  tipText: { color: Colors.gray300, fontSize: 13, flex: 1, lineHeight: 18 },

  offerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 16,
    paddingVertical: 15,
  },
  offerBtnText: { color: Colors.black, fontSize: 15, fontWeight: '700' },
  myRidesLink: { alignItems: 'center' },
  myRidesLinkText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
});

// ─── Home screen ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const { setSearchParams } = useRideStore();
  const { notifications, unreadCount, loading: notifLoading, markAllRead } = useNotifications(user?.id ?? '');
  const [activeTab, setActiveTab] = useState<'putnik' | 'vozac'>('putnik');
  const [polaziste, setPolaziste] = useState('');
  const [odrediste, setOdrediste] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Screen entrance animation (on tab focus)
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(10)).current;

  useFocusEffect(useCallback(() => {
    screenOpacity.setValue(0);
    screenTranslateY.setValue(10);
    Animated.parallel([
      Animated.timing(screenOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(screenTranslateY, { toValue: 0, useNativeDriver: true, speed: 28, bounciness: 3 }),
    ]).start();
  }, []));

  // Tab content transition
  const tabOpacity = useRef(new Animated.Value(1)).current;
  const tabTranslateY = useRef(new Animated.Value(0)).current;

  const switchTab = (tab: 'putnik' | 'vozac') => {
    if (tab === activeTab) return;
    Animated.parallel([
      Animated.timing(tabOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(tabTranslateY, { toValue: 6, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setActiveTab(tab);
      tabTranslateY.setValue(-6);
      Animated.parallel([
        Animated.timing(tabOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(tabTranslateY, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 3 }),
      ]).start();
    });
  };

  // Notification panel animation
  const notifOpacity = useRef(new Animated.Value(0)).current;
  const notifTranslateY = useRef(new Animated.Value(-10)).current;

  const toggleNotifications = () => {
    if (!showNotifications) {
      setShowNotifications(true);
      markAllRead();
      Animated.parallel([
        Animated.timing(notifOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(notifTranslateY, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 4 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(notifOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(notifTranslateY, { toValue: -8, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        setShowNotifications(false);
        notifTranslateY.setValue(-10);
      });
    }
  };

  const goToSearch = (params: { polaziste?: string; odrediste?: string }) => {
    setSearchParams({
      polaziste: params.polaziste ?? polaziste,
      odrediste: params.odrediste ?? odrediste,
    });
    router.push('/(tabs)/search');
  };

  const handleSearch = () => {
    if (!polaziste && !odrediste) return;
    goToSearch({ polaziste, odrediste });
  };

  const avatarUrl = profile
    ? (profile.foto_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.ime)}+${encodeURIComponent(profile.prezime)}&background=0E8C4D&color=19E07A&bold=true&size=200`)
    : null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Dobro jutro';
    if (h < 18) return 'Dobar dan';
    return 'Dobro veče';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: screenOpacity, transform: [{ translateY: screenTranslateY }] }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSmall}>{greeting()}</Text>
            <Text style={styles.greetingName}>{profile?.ime ?? 'Dobrodošli'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, showNotifications && styles.iconBtnActive]}
              onPress={toggleNotifications}
              accessibilityLabel="Notifikacije"
            >
              <Bell size={18} stroke={showNotifications ? Colors.accent : Colors.text} />
              {unreadCount > 0 && !showNotifications && (
                <View style={styles.notifDot}>
                  <Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
              {avatarUrl ? (
                <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {profile ? `${profile.ime?.[0] ?? ''}${profile.prezime?.[0] ?? ''}`.trim() || '?' : '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications panel */}
        {showNotifications && (
          <Animated.View style={[styles.notifPanel, { opacity: notifOpacity, transform: [{ translateY: notifTranslateY }] }]}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Obaveštenja</Text>
              <TouchableOpacity onPress={toggleNotifications} hitSlop={8}>
                <X size={18} stroke={Colors.gray400} />
              </TouchableOpacity>
            </View>
            {notifLoading ? (
              <View style={styles.notifEmpty}>
                <ActivityIndicator color={Colors.accent} size="small" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Bell size={32} stroke={Colors.gray700} strokeWidth={1.5} />
                <Text style={styles.notifEmptyText}>Nema novih obaveštenja</Text>
              </View>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <View key={n.id} style={[styles.notifItem, !n.read && styles.notifItemUnread]}>
                  {!n.read && <View style={styles.notifUnreadDot} />}
                  <View style={styles.notifItemContent}>
                    <Text style={styles.notifItemTitle}>{n.naslov}</Text>
                    <Text style={styles.notifItemBody}>{n.telo}</Text>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          {([
            { k: 'putnik', label: 'Putnik', icon: Search },
            { k: 'vozac', label: 'Vozač', icon: Car },
          ] as const).map((o) => (
            <TouchableOpacity
              key={o.k}
              style={[styles.modeTab, activeTab === o.k && styles.modeTabActive]}
              onPress={() => switchTab(o.k)}
              activeOpacity={0.8}
            >
              <o.icon size={16} stroke={activeTab === o.k ? Colors.black : Colors.textDim} />
              <Text style={[styles.modeTabText, activeTab === o.k && styles.modeTabTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View style={{ opacity: tabOpacity, transform: [{ translateY: tabTranslateY }] }}>
        {activeTab === 'vozac' ? (
          <DriverDashboard userId={user?.id ?? ''} profile={profile} router={router} />
        ) : (
          <>
            {/* Where To Card */}
            {!expanded ? (
              <TouchableOpacity
                style={styles.whereToCard}
                onPress={() => setExpanded(true)}
                activeOpacity={0.9}
              >
                <View style={styles.whereToInner}>
                  <View style={styles.whereToRow}>
                    <View style={styles.dotStart} />
                    <View style={styles.whereToRowContent}>
                      <Text style={styles.whereToLabel}>POLAZIŠTE</Text>
                      <Text style={[styles.whereToCity, !polaziste && styles.whereToCityPlaceholder]}>
                        {polaziste || 'Odakle putuješ?'}
                      </Text>
                    </View>
                    <Navigation size={16} stroke={Colors.gray400} />
                  </View>
                  <View style={styles.whereToDivider} />
                  <View style={styles.whereToRow}>
                    <View style={styles.dotEnd} />
                    <View style={styles.whereToRowContent}>
                      <Text style={styles.whereToLabel}>ODREDIŠTE</Text>
                      <Text style={[styles.whereToCity, !odrediste && styles.whereToCityPlaceholder]}>
                        {odrediste || 'Kuda putuješ?'}
                      </Text>
                    </View>
                    <ChevronRight size={16} stroke={Colors.text} />
                  </View>
                </View>
                <View style={styles.metaTiles}>
                  <View style={styles.metaTile}>
                    <Clock size={14} stroke={Colors.textDim} />
                    <View>
                      <Text style={styles.metaTileLabel}>POLAZAK</Text>
                      <Text style={styles.metaTileValue}>Danas</Text>
                    </View>
                  </View>
                  <View style={styles.metaTileDivider} />
                  <View style={styles.metaTile}>
                    <Users size={14} stroke={Colors.textDim} />
                    <View>
                      <Text style={styles.metaTileLabel}>PUTNIKA</Text>
                      <Text style={styles.metaTileValue}>1 osoba</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.searchForm}>
                <View style={styles.searchFormHeader}>
                  <Text style={styles.searchFormTitle}>Pronađi vožnju</Text>
                  <TouchableOpacity onPress={() => setExpanded(false)} hitSlop={8}>
                    <X size={20} stroke={Colors.gray400} />
                  </TouchableOpacity>
                </View>

                <View style={styles.routeInputs}>
                  <View style={styles.routeDots}>
                    <View style={styles.dotStart} />
                    <View style={styles.routeLine} />
                    <View style={styles.dotEnd} />
                  </View>
                  <View style={styles.routeFields}>
                    <CityAutocomplete value={polaziste} onSelect={setPolaziste} placeholder="Odakle?" />
                    <View style={styles.inputSpacer} />
                    <CityAutocomplete value={odrediste} onSelect={setOdrediste} placeholder="Kuda?" />
                  </View>
                </View>

                {(polaziste || odrediste) && (
                  <TouchableOpacity style={styles.searchSubmitBtn} onPress={handleSearch} activeOpacity={0.85}>
                    <Search size={18} stroke={Colors.black} strokeWidth={2.4} />
                    <Text style={styles.searchSubmitText}>
                      {polaziste && odrediste ? `${polaziste} → ${odrediste}` : 'Pretraži vožnje'}
                    </Text>
                    <ArrowRight size={18} stroke={Colors.black} strokeWidth={2.4} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Recent Destinations */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nedavno</Text>
                <Text style={styles.sectionHint}>Tapni za pretragu</Text>
              </View>
              <View style={styles.chips}>
                {RECENT_DESTINATIONS.map((dest) => (
                  <TouchableOpacity
                    key={dest}
                    style={styles.chip}
                    onPress={() => goToSearch({ odrediste: dest })}
                    activeOpacity={0.75}
                  >
                    <View style={styles.chipDot} />
                    <Text style={styles.chipText}>{dest}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular Routes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popularne rute</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text style={styles.seeAll}>Sve →</Text>
                </TouchableOpacity>
              </View>
              {POPULAR_ROUTES.map((route) => (
                <TouchableOpacity
                  key={route.from + route.to}
                  style={styles.routeCard}
                  onPress={() => goToSearch({ polaziste: route.from, odrediste: route.to })}
                  activeOpacity={0.8}
                >
                  <View style={styles.routeIconBox}>
                    <Navigation size={18} stroke={Colors.accent} />
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeText}>
                      {route.from}{' '}
                      <Text style={styles.routeArrow}>→</Text>{' '}
                      {route.to}
                    </Text>
                    <Text style={styles.routeMeta}>~{route.time} · od {route.price.toLocaleString()} RSD</Text>
                  </View>
                  <ChevronRight size={18} stroke={Colors.gray400} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Driver promo banner */}
            <Pressable
              style={styles.promoBanner}
              onPress={() => switchTab('vozac')}
              pressScale={0.97}
              hoverScale={1.01}
            >
              <Car size={32} stroke={Colors.black} strokeWidth={1.8} />
              <View style={styles.promoText}>
                <Text style={styles.promoTitle}>Vozite? Zaradite uz put.</Text>
                <Text style={styles.promoSub}>Ponudite slobodna mesta u svom autu</Text>
              </View>
              <ChevronRight size={22} stroke={Colors.black} strokeWidth={2.4} />
            </Pressable>
          </>
        )}
        </Animated.View>

      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { padding: 20, gap: 24, paddingBottom: 48 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingSmall: { fontSize: 13, color: Colors.gray400, fontWeight: '500' },
  greetingName: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -1, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: {},
  avatar: { width: 44, height: 44, borderRadius: 14 },
  avatarFallback: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.accentDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: Colors.accent, fontSize: 16, fontWeight: '700' },
  iconBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },

  notifPanel: {
    backgroundColor: Colors.cardBg, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  notifHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  notifTitle: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  notifEmpty: {
    alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 32,
  },
  notifEmptyText: { color: Colors.gray500, fontSize: 14 },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.black,
  },
  notifDotText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  notifItemUnread: { backgroundColor: 'rgba(25,224,122,0.04)' },
  notifUnreadDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.accent, marginTop: 4, flexShrink: 0,
  },
  notifItemContent: { flex: 1, gap: 2 },
  notifItemTitle: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  notifItemBody: { color: Colors.gray400, fontSize: 12, lineHeight: 17 },

  modeToggle: {
    flexDirection: 'row', gap: 4, padding: 4,
    backgroundColor: Colors.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
  },
  modeTabActive: { backgroundColor: Colors.text },
  modeTabText: { color: Colors.textDim, fontWeight: '600', fontSize: 14 },
  modeTabTextActive: { color: Colors.black },

  whereToCard: {
    backgroundColor: Colors.cardBg, borderRadius: 24,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  whereToInner: {},
  searchForm: {
    backgroundColor: Colors.cardBg, borderRadius: 24,
    borderWidth: 1, borderColor: Colors.border,
    padding: 18, gap: 16,
  },
  searchFormHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchFormTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  routeInputs: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  routeDots: { alignItems: 'center', paddingTop: 14, gap: 0, width: 16 },
  routeLine: { width: 2, flex: 1, minHeight: 28, backgroundColor: Colors.border, marginVertical: 4 },
  routeFields: { flex: 1, gap: 0 },
  inputSpacer: { height: 8 },
  searchSubmitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accent, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  searchSubmitText: { color: Colors.black, fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },

  whereToRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16, gap: 14,
  },
  whereToRowContent: { flex: 1 },
  whereToLabel: { fontSize: 10, color: Colors.gray400, fontWeight: '600', letterSpacing: 0.5, marginBottom: 3 },
  whereToCity: { fontSize: 18, fontWeight: '600', color: Colors.text },
  whereToCityPlaceholder: { color: Colors.textDim },
  dotStart: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2.5, borderColor: Colors.accent, backgroundColor: 'transparent',
  },
  dotEnd: { width: 12, height: 12, borderRadius: 2, backgroundColor: Colors.text },
  whereToDivider: { height: 1, backgroundColor: Colors.border },
  metaTiles: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  metaTile: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingHorizontal: 16, paddingVertical: 14,
  },
  metaTileDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },
  metaTileLabel: { fontSize: 10, color: Colors.gray400, fontWeight: '600', letterSpacing: 0.5 },
  metaTileValue: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 2 },

  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  sectionHint: { fontSize: 12, color: Colors.gray400 },
  seeAll: { fontSize: 12, color: Colors.accent, fontWeight: '600' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.cardBg, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  routeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.cardBg, borderRadius: 18,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  routeIconBox: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  routeInfo: { flex: 1 },
  routeText: { fontSize: 15, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  routeArrow: { color: Colors.gray400, fontWeight: '500' },
  routeMeta: { fontSize: 12, color: Colors.gray400, marginTop: 3 },

  promoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 22,
    backgroundColor: Colors.accentDark,
  },
  promoText: { flex: 1 },
  promoTitle: { fontSize: 16, fontWeight: '800', color: Colors.black, letterSpacing: -0.3 },
  promoSub: { fontSize: 12, color: 'rgba(0,0,0,0.65)', marginTop: 2, fontWeight: '500' },
});
