import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, Search, Car, Clock, Users, ChevronRight, Bell, Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useRideStore } from '@/stores/rideStore';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { Button } from '@/components/ui/Button';

const RECENT_DESTINATIONS = ['Novi Sad', 'Niš', 'Kragujevac', 'Subotica'];

const POPULAR_ROUTES = [
  { from: 'Beograd', to: 'Novi Sad', price: 600, time: '1h 15m' },
  { from: 'Beograd', to: 'Niš', price: 1200, time: '2h 45m' },
  { from: 'Novi Sad', to: 'Subotica', price: 400, time: '1h 05m' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { setSearchParams } = useRideStore();
  const [activeTab, setActiveTab] = useState<'putnik' | 'vozac'>('putnik');
  const [polaziste, setPolaziste] = useState('');
  const [odrediste, setOdrediste] = useState('');

  const goToSearch = (params: { polaziste?: string; odrediste?: string }) => {
    setSearchParams({
      polaziste: params.polaziste ?? polaziste,
      odrediste: params.odrediste ?? odrediste,
    });
    router.push('/(tabs)/search');
  };

  const handleSearch = () => {
    if (!polaziste || !odrediste) return;
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSmall}>{greeting()}</Text>
            <Text style={styles.greetingName}>{profile?.ime ?? 'Dobrodošli'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} accessibilityLabel="Notifikacije">
              <Bell size={18} stroke={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
              {avatarUrl ? (
                <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {profile ? `${profile.ime[0]}${profile.prezime[0]}` : '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          {([
            { k: 'putnik', label: 'Putnik', icon: Search },
            { k: 'vozac', label: 'Vozač', icon: Car },
          ] as const).map((o) => (
            <TouchableOpacity
              key={o.k}
              style={[styles.modeTab, activeTab === o.k && styles.modeTabActive]}
              onPress={() => {
                setActiveTab(o.k);
                if (o.k === 'vozac') router.push('/(tabs)/offer');
              }}
              activeOpacity={0.8}
            >
              <o.icon size={16} stroke={activeTab === o.k ? Colors.black : Colors.textDim} />
              <Text style={[styles.modeTabText, activeTab === o.k && styles.modeTabTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Where To Card */}
        <View style={styles.whereToCard}>
          <TouchableOpacity
            style={styles.whereToInner}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.9}
          >
            <View style={styles.whereToRow}>
              <View style={styles.dotStart} />
              <View style={styles.whereToRowContent}>
                <Text style={styles.whereToLabel}>POLAZIŠTE</Text>
                <Text style={styles.whereToCity}>{polaziste || 'Beograd'}</Text>
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
          </TouchableOpacity>

          {/* Date + Passengers */}
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
        </View>

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
        <TouchableOpacity
          style={styles.promoBanner}
          onPress={() => router.push('/(tabs)/offer')}
          activeOpacity={0.88}
        >
          <Car size={32} stroke={Colors.black} strokeWidth={1.8} />
          <View style={styles.promoText}>
            <Text style={styles.promoTitle}>Vozite? Zaradite uz put.</Text>
            <Text style={styles.promoSub}>Ponudite slobodna mesta u svom autu</Text>
          </View>
          <ChevronRight size={22} stroke={Colors.black} strokeWidth={2.4} />
        </TouchableOpacity>

      </ScrollView>
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
  whereToRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16, gap: 14,
  },
  whereToRowContent: { flex: 1 },
  whereToLabel: {
    fontSize: 10, color: Colors.gray400, fontWeight: '600',
    letterSpacing: 0.5, marginBottom: 3,
  },
  whereToCity: { fontSize: 18, fontWeight: '600', color: Colors.text },
  whereToCityPlaceholder: { color: Colors.textDim },
  dotStart: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2.5, borderColor: Colors.accent, backgroundColor: 'transparent',
  },
  dotEnd: { width: 12, height: 12, borderRadius: 2, backgroundColor: Colors.text },
  whereToDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 0 },
  metaTiles: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border,
  },
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
