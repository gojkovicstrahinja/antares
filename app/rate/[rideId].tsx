import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// rideId, ocenitiId (ko se ocenjuje), tip (vozac_ocenjuje_putnika | putnik_ocenjuje_vozaca)
export default function RateScreen() {
  const { rideId, ocenitiId, tip } = useLocalSearchParams<{
    rideId: string;
    ocenitiId: string;
    tip: string;
  }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [ocena, setOcena] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [komentar, setKomentar] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [otherName, setOtherName] = useState('');

  useEffect(() => {
    if (!ocenitiId) return;
    supabase.from('profiles').select('ime, prezime').eq('id', ocenitiId).single()
      .then(({ data }) => {
        if (data) setOtherName(`${data.ime} ${data.prezime}`);
      });
  }, [ocenitiId]);

  const handleSubmit = async () => {
    if (!user || !rideId || !ocenitiId) return;
    if (ocena === 0) { setError('Izaberite ocenu (1–5 zvezdica).'); return; }
    setError('');
    setLoading(true);

    const { error: insertError } = await supabase.from('reviews').insert({
      ride_id: rideId,
      ocenjivac_id: user.id,
      oceniti_id: ocenitiId,
      ocena,
      komentar: komentar.trim() || null,
      tip: tip ?? 'putnik_ocenjuje_vozaca',
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Recalculate rating on the rated profile
    await supabase.rpc('recalculate_profile_rating', { profile_id: ocenitiId });

    setLoading(false);
    setDone(true);
  };

  const goHome = () => router.replace('/(tabs)');

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successScreen}>
          <CheckCircle size={72} stroke={Colors.accent} strokeWidth={1.5} />
          <Text style={styles.successTitle}>Hvala na oceni!</Text>
          <Text style={styles.successText}>
            Vaša ocena za{otherName ? ` ${otherName}` : ''} je sačuvana.
          </Text>
          <Button title="Na početnu" onPress={goHome} size="lg" style={{ width: '100%' }} />
        </View>
      </SafeAreaView>
    );
  }

  const displayOcena = hovered || ocena;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ocenite vožnju</Text>
        {otherName ? (
          <Text style={styles.subtitle}>Kako je bilo sa {otherName}?</Text>
        ) : null}

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setOcena(n)}
              onPressIn={() => setHovered(n)}
              onPressOut={() => setHovered(0)}
              activeOpacity={0.8}
              style={styles.starBtn}
            >
              <Star
                size={48}
                stroke={n <= displayOcena ? Colors.warning : Colors.border}
                fill={n <= displayOcena ? Colors.warning : 'transparent'}
                strokeWidth={1.8}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingLabel}>
          {displayOcena === 0 && 'Izaberite ocenu'}
          {displayOcena === 1 && 'Loše'}
          {displayOcena === 2 && 'Ispod proseka'}
          {displayOcena === 3 && 'Dobro'}
          {displayOcena === 4 && 'Vrlo dobro'}
          {displayOcena === 5 && 'Odlično!'}
        </Text>

        <Input
          label="Komentar (opciono)"
          value={komentar}
          onChangeText={setKomentar}
          placeholder="Podelite iskustvo sa zajednicom..."
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={15} stroke={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          title="Pošalji ocenu"
          onPress={handleSubmit}
          loading={loading}
          disabled={ocena === 0}
          size="lg"
        />

        <TouchableOpacity onPress={goHome} style={styles.skipBtn}>
          <Text style={styles.skipText}>Preskoči</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { padding: 28, gap: 24, flexGrow: 1 },
  title: { color: Colors.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.gray400, fontSize: 15, marginTop: -12 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  starBtn: { padding: 4 },
  ratingLabel: {
    textAlign: 'center', color: Colors.textDim, fontSize: 15, fontWeight: '600',
    marginTop: -12,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: Colors.gray500, fontSize: 14 },
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 20,
  },
  successTitle: { color: Colors.white, fontSize: 28, fontWeight: '800' },
  successText: { color: Colors.gray400, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
