import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Search, Car, Clock, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useRideStore } from '@/stores/rideStore';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { Button } from '@/components/ui/Button';

const RECENT_DESTINATIONS = ['Novi Sad', 'Niš', 'Kragujevac', 'Subotica'];

const POPULAR_ROUTES = [
  { from: 'Beograd', to: 'Novi Sad', price: '600' },
  { from: 'Beograd', to: 'Niš', price: '1.200' },
  { from: 'Novi Sad', to: 'Subotica', price: '400' },
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

  const handleChipPress = (dest: string) => {
    setOdrediste(dest);
    goToSearch({ odrediste: dest });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Zdravo{profile?.ime ? `, ${profile.ime}` : ''} 👋
          </Text>
          <Text style={styles.greetingSubtitle}>Kuda putuješ danas?</Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'putnik' && styles.tabActive]}
              onPress={() => setActiveTab('putnik')}
            >
              <Search size={16} stroke={activeTab === 'putnik' ? Colors.black : Colors.gray400} />
              <Text style={[styles.tabText, activeTab === 'putnik' && styles.tabTextActive]}>
                Putnik
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'vozac' && styles.tabActive]}
              onPress={() => {
                setActiveTab('vozac');
                router.push('/(tabs)/offer');
              }}
            >
              <Car size={16} stroke={activeTab === 'vozac' ? Colors.black : Colors.gray400} />
              <Text style={[styles.tabText, activeTab === 'vozac' && styles.tabTextActive]}>
                Vozač
              </Text>
            </TouchableOpacity>
          </View>

          <CityAutocomplete
            value={polaziste}
            onSelect={setPolaziste}
            placeholder="Odakle?"
            label="Polazište"
          />
          <CityAutocomplete
            value={odrediste}
            onSelect={setOdrediste}
            placeholder="Kuda?"
            label="Odredište"
          />

          <Button
            title="Pretraži vožnje"
            onPress={handleSearch}
            size="lg"
            disabled={!polaziste || !odrediste}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={16} stroke={Colors.gray400} />
            <Text style={styles.sectionTitle}>Nedavne destinacije</Text>
          </View>
          <View style={styles.chips}>
            {RECENT_DESTINATIONS.map((dest) => (
              <TouchableOpacity
                key={dest}
                style={styles.chip}
                onPress={() => handleChipPress(dest)}
                activeOpacity={0.7}
              >
                <MapPin size={12} stroke={Colors.accent} />
                <Text style={styles.chipText}>{dest}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.chipHint}>
            Tapnite grad da pretražite vožnje ka njemu
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popularne rute</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.seeAll}>Sve</Text>
            </TouchableOpacity>
          </View>
          {POPULAR_ROUTES.map((route) => (
            <TouchableOpacity
              key={route.from + route.to}
              style={styles.routeCard}
              onPress={() => goToSearch({ polaziste: route.from, odrediste: route.to })}
              activeOpacity={0.8}
            >
              <View style={styles.routeInfo}>
                <Text style={styles.routeText}>{route.from} → {route.to}</Text>
                <Text style={styles.routePrice}>od {route.price} RSD</Text>
              </View>
              <ChevronRight size={18} stroke={Colors.gray500} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { padding: 20, gap: 24, paddingBottom: 40 },
  greeting: { gap: 4 },
  greetingText: { color: Colors.white, fontSize: 28, fontWeight: '800' },
  greetingSubtitle: { color: Colors.gray400, fontSize: 15 },
  sheet: {
    backgroundColor: Colors.cardBg, borderRadius: 24,
    padding: 20, gap: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.inputBg,
  },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { color: Colors.gray400, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: Colors.black },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: Colors.white, fontSize: 16, fontWeight: '700', flex: 1 },
  seeAll: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.cardBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { color: Colors.white, fontSize: 13 },
  chipHint: { color: Colors.gray600, fontSize: 11, marginTop: 2 },
  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBg, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  routeInfo: { flex: 1, gap: 3 },
  routeText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  routePrice: { color: Colors.gray400, fontSize: 13 },
});
