import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { ArrowLeft, Filter, Users, X, Star, Clock, Banknote, RotateCcw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useRideStore } from '@/stores/rideStore';
import { useSearchRides } from '@/hooks/useRides';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { RideCard } from '@/components/cards/RideCard';
import { Button } from '@/components/ui/Button';
import { RouteMap } from '@/components/maps/RouteMap';
import type { RideWithDriver } from '@/types';

interface Filters {
  maxCena: number | null;
  minOcena: number | null;
  vremeOd: string | null;   // "jutro" | "popodne" | "vece"
  sortBy: 'vreme' | 'cena' | 'ocena';
}

const DEFAULT_FILTERS: Filters = {
  maxCena: null,
  minOcena: null,
  vremeOd: null,
  sortBy: 'vreme',
};

const VREME_OPTIONS = [
  { key: 'jutro', label: 'Jutro', sub: '00:00 – 12:00' },
  { key: 'popodne', label: 'Popodne', sub: '12:00 – 18:00' },
  { key: 'vece', label: 'Veče', sub: '18:00 – 00:00' },
];

const SORT_OPTIONS = [
  { key: 'vreme', label: 'Vreme polaska' },
  { key: 'cena', label: 'Najniža cena' },
  { key: 'ocena', label: 'Ocena vozača' },
];

const CENA_OPTIONS = [500, 1000, 1500, 2000];
const OCENA_OPTIONS = [4, 4.5, 4.8];

function applyFilters(rides: RideWithDriver[], f: Filters): RideWithDriver[] {
  let result = [...rides];

  if (f.maxCena !== null) {
    result = result.filter((r) => r.cena_po_osobi <= f.maxCena!);
  }
  if (f.minOcena !== null) {
    result = result.filter((r) => r.profiles.ocena_prosek >= f.minOcena!);
  }
  if (f.vremeOd !== null) {
    result = result.filter((r) => {
      const h = parseInt(r.vreme_polaska.slice(0, 2));
      if (f.vremeOd === 'jutro') return h < 12;
      if (f.vremeOd === 'popodne') return h >= 12 && h < 18;
      return h >= 18;
    });
  }

  result.sort((a, b) => {
    if (f.sortBy === 'cena') return a.cena_po_osobi - b.cena_po_osobi;
    if (f.sortBy === 'ocena') return b.profiles.ocena_prosek - a.profiles.ocena_prosek;
    return a.vreme_polaska.localeCompare(b.vreme_polaska);
  });

  return result;
}

function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.maxCena !== null) n++;
  if (f.minOcena !== null) n++;
  if (f.vremeOd !== null) n++;
  if (f.sortBy !== 'vreme') n++;
  return n;
}

export default function SearchScreen() {
  const router = useRouter();
  const { searchParams, setSearchParams, setSelectedRide } = useRideStore();
  const [datum] = useState(searchParams.datum || new Date().toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS);

  const { data: rides = [], isLoading, refetch } = useSearchRides(
    searchParams.polaziste,
    searchParams.odrediste,
    datum,
    searchParams.brPutnika,
  );

  const filteredRides = useMemo(() => applyFilters(rides, filters), [rides, filters]);
  const activeCount = countActiveFilters(filters);

  const handleRidePress = (ride: RideWithDriver) => {
    setSelectedRide(ride);
    router.push(`/ride/${ride.id}`);
  };

  const openFilters = () => {
    setPendingFilters(filters);
    setShowFilters(true);
  };

  const applyFiltersNow = () => {
    setFilters(pendingFilters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setPendingFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setShowFilters(false);
  };

  const setP = (patch: Partial<Filters>) =>
    setPendingFilters((prev) => ({ ...prev, ...patch }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Pronađi vožnju</Text>
      </View>

      <View style={styles.searchBar}>
        <CityAutocomplete
          value={searchParams.polaziste}
          onSelect={(c) => setSearchParams({ polaziste: c })}
          placeholder="Odakle?"
          containerStyle={{ flex: 1 }}
        />
        <CityAutocomplete
          value={searchParams.odrediste}
          onSelect={(c) => setSearchParams({ odrediste: c })}
          placeholder="Kuda?"
          containerStyle={{ flex: 1 }}
        />
      </View>

      <View style={styles.filterBar}>
        <View style={styles.filterInfo}>
          <Text style={styles.filterDate}>
            {format(new Date(datum), 'd. MMMM', { locale: sr })}
          </Text>
          <View style={styles.filterSeats}>
            <Users size={14} stroke={Colors.gray400} />
            <Text style={styles.filterSeatsText}>{searchParams.brPutnika} putnik</Text>
          </View>
          {filteredRides.length > 0 && (
            <Text style={styles.resultCount}>{filteredRides.length} vožnji</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={openFilters}
          activeOpacity={0.7}
        >
          <Filter size={15} stroke={activeCount > 0 ? Colors.black : Colors.white} />
          <Text style={[styles.filterBtnText, activeCount > 0 && styles.filterBtnTextActive]}>
            Filteri{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterPanelHeader}>
            <Text style={styles.filterPanelTitle}>Filteri</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={20} stroke={Colors.gray400} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sortiraj po */}
            <Text style={styles.filterGroupTitle}>Sortiraj po</Text>
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.key}
                  style={[styles.chip, pendingFilters.sortBy === o.key && styles.chipActive]}
                  onPress={() => setP({ sortBy: o.key as Filters['sortBy'] })}
                >
                  <Text style={[styles.chipText, pendingFilters.sortBy === o.key && styles.chipTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Vreme polaska */}
            <Text style={styles.filterGroupTitle}>
              <Clock size={13} stroke={Colors.gray400} /> Vreme polaska
            </Text>
            <View style={styles.chipRow}>
              {VREME_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.key}
                  style={[styles.chip, pendingFilters.vremeOd === o.key && styles.chipActive]}
                  onPress={() => setP({ vremeOd: pendingFilters.vremeOd === o.key ? null : o.key })}
                >
                  <Text style={[styles.chipText, pendingFilters.vremeOd === o.key && styles.chipTextActive]}>
                    {o.label}
                  </Text>
                  <Text style={[styles.chipSub, pendingFilters.vremeOd === o.key && styles.chipSubActive]}>
                    {o.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Max cena */}
            <Text style={styles.filterGroupTitle}>
              <Banknote size={13} stroke={Colors.gray400} /> Maksimalna cena
            </Text>
            <View style={styles.chipRow}>
              {CENA_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, pendingFilters.maxCena === c && styles.chipActive]}
                  onPress={() => setP({ maxCena: pendingFilters.maxCena === c ? null : c })}
                >
                  <Text style={[styles.chipText, pendingFilters.maxCena === c && styles.chipTextActive]}>
                    do {c.toLocaleString()} RSD
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Min ocena */}
            <Text style={styles.filterGroupTitle}>
              <Star size={13} stroke={Colors.gray400} /> Minimalna ocena vozača
            </Text>
            <View style={styles.chipRow}>
              {OCENA_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[styles.chip, pendingFilters.minOcena === o && styles.chipActive]}
                  onPress={() => setP({ minOcena: pendingFilters.minOcena === o ? null : o })}
                >
                  <Text style={[styles.chipText, pendingFilters.minOcena === o && styles.chipTextActive]}>
                    ★ {o}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <RotateCcw size={15} stroke={Colors.gray400} />
              <Text style={styles.resetText}>Resetuj</Text>
            </TouchableOpacity>
            <Button title="Primeni filtere" onPress={applyFiltersNow} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {!showFilters && (
        <>
          {searchParams.polaziste && searchParams.odrediste && (
            <RouteMap
              polaziste={searchParams.polaziste}
              odrediste={searchParams.odrediste}
              style={styles.map}
            />
          )}

          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={Colors.accent} size="large" />
            </View>
          ) : filteredRides.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>
                {rides.length > 0 ? 'Nema rezultata za filtere' : 'Nema vožnji'}
              </Text>
              <Text style={styles.emptyText}>
                {rides.length > 0
                  ? 'Pokušajte sa manje restriktivnim filterima.'
                  : searchParams.polaziste && searchParams.odrediste
                    ? `Nema vožnji ${searchParams.polaziste} → ${searchParams.odrediste} za ovaj datum.`
                    : 'Unesite polazište i odredište za pretragu.'}
              </Text>
              {rides.length > 0
                ? <Button title="Resetuj filtere" onPress={resetFilters} variant="secondary" />
                : <Button title="Osveži" onPress={() => refetch()} variant="secondary" />
              }
            </View>
          ) : (
            <FlatList
              data={filteredRides}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RideCard ride={item} onPress={() => handleRidePress(item)} />
              )}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={<View style={{ height: 4 }} />}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingBottom: 12 },
  backBtn: { padding: 4 },
  title: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  searchBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12, zIndex: 10 },
  filterBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  filterInfo: { flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 },
  filterDate: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  filterSeats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterSeatsText: { color: Colors.gray400, fontSize: 13 },
  resultCount: { color: Colors.gray500, fontSize: 12 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.cardBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  filterBtnTextActive: { color: Colors.black },

  // Filter panel
  filterPanel: {
    flex: 1, marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.cardBg, borderRadius: 20,
    padding: 20, gap: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterPanelTitle: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  filterGroupTitle: { color: Colors.gray300, fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.inputBg,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: 'rgba(0,197,102,0.15)', borderColor: Colors.accent },
  chipText: { color: Colors.gray300, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.accent },
  chipSub: { color: Colors.gray600, fontSize: 11, marginTop: 1 },
  chipSubActive: { color: Colors.accentDark },
  filterActions: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.inputBg, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  resetText: { color: Colors.gray400, fontSize: 13, fontWeight: '600' },

  map: { marginHorizontal: 20, marginBottom: 12, height: 200 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  emptyTitle: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  emptyText: { color: Colors.gray400, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
