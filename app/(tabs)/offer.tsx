import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Plus, Minus, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { formatDate } from '@/lib/utils';

const TOTAL_STEPS = 6;

const stepTitles = [
  'Polazište',
  'Odredište',
  'Datum i vreme',
  'Slobodna mesta',
  'Cena po osobi',
  'Napomene i pregled',
];

const stepSubtitles = [
  'Odakle krećete?',
  'Kuda idete?',
  'Kada polazite?',
  'Koliko putnika možete primiti?',
  'Koliko košta jedno mesto?',
  'Još nešto za putnike? Pregledajte pre objave.',
];

function haptic(type: 'light' | 'success') {
  if (Platform.OS === 'web') return;
  import('expo-haptics').then(({ impactAsync, notificationAsync, ImpactFeedbackStyle, NotificationFeedbackType }) => {
    if (type === 'light') impactAsync(ImpactFeedbackStyle.Light);
    else notificationAsync(NotificationFeedbackType.Success);
  }).catch(() => {});
}

export default function OfferScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { user } = useAuthStore();

  const goBack = () => {
    if (from === 'my-rides') {
      router.replace('/my-rides');
    } else {
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    }
  };
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [polaziste, setPolaziste] = useState('');
  const [odrediste, setOdrediste] = useState('');
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [vreme, setVreme] = useState('08:00');
  const [mesta, setMesta] = useState(3);
  const [cena, setCena] = useState('');
  const [napomene, setNapomene] = useState('');

  const canProceed = () => {
    switch (step) {
      case 1: return !!polaziste;
      case 2: return !!odrediste && odrediste !== polaziste;
      case 3: return !!datum && !!vreme;
      case 4: return mesta >= 1;
      case 5: return !!cena && parseInt(cena) > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    haptic('light');
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError('');
    setLoading(true);
    const { error: insertError } = await supabase.from('rides').insert({
      vozac_id: user.id,
      polaziste,
      odrediste,
      datum,
      vreme_polaska: vreme,
      slobodna_mesta: mesta,
      cena_po_osobi: parseInt(cena),
      napomene: napomene || null,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      haptic('success');
      setDone(true);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPolaziste('');
    setOdrediste('');
    setDatum(new Date().toISOString().split('T')[0]);
    setVreme('08:00');
    setMesta(3);
    setCena('');
    setNapomene('');
    setDone(false);
    setError('');
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successScreen}>
          <CheckCircle size={72} stroke={Colors.accent} />
          <Text style={styles.successTitle}>Vožnja je objavljena!</Text>
          <Text style={styles.successText}>
            {polaziste} → {odrediste}{'\n'}
            {formatDate(datum)} u {vreme} · {mesta} mesta · {parseInt(cena).toLocaleString()} RSD
          </Text>
          <View style={styles.successActions}>
            <Button title="Vidi moje vožnje" onPress={() => { handleReset(); router.push('/my-rides'); }} size="lg" />
            <Button title="Objavi još jednu" onPress={handleReset} variant="secondary" size="lg" />
            <Button title="Na početnu" onPress={() => { handleReset(); goBack(); }} variant="ghost" size="lg" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step > 1 ? setStep(step - 1) : goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={28} stroke={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ponudi vožnju</Text>
        <Text style={styles.stepCounter}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` as `${number}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{stepTitles[step - 1]}</Text>
          <Text style={styles.stepSubtitle}>{stepSubtitles[step - 1]}</Text>
        </View>

        {step === 1 && (
          <CityAutocomplete value={polaziste} onSelect={setPolaziste} placeholder="Npr. Beograd" />
        )}

        {step === 2 && (
          <>
            <CityAutocomplete value={odrediste} onSelect={setOdrediste} placeholder="Npr. Novi Sad" />
            {odrediste && odrediste === polaziste && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} stroke={Colors.error} />
                <Text style={styles.errorText}>Odredište mora biti drugačije od polazišta.</Text>
              </View>
            )}
          </>
        )}

        {step === 3 && (
          <View style={styles.form}>
            <DatePicker value={datum} onChange={setDatum} minDate={new Date()} />
            <TimePicker value={vreme} onChange={setVreme} />
          </View>
        )}

        {step === 4 && (
          <View style={styles.seatsControl}>
            <TouchableOpacity
              style={[styles.seatsBtn, mesta <= 1 && styles.seatsBtnDisabled]}
              onPress={() => mesta > 1 && setMesta(mesta - 1)}
              activeOpacity={0.7}
            >
              <Minus size={26} stroke={mesta > 1 ? Colors.white : Colors.gray600} />
            </TouchableOpacity>
            <View style={styles.seatsNumWrapper}>
              <Text style={styles.seatsNum}>{mesta}</Text>
              <Text style={styles.seatsLabel}>{mesta === 1 ? 'mesto' : mesta < 5 ? 'mesta' : 'mesta'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.seatsBtn, mesta >= 8 && styles.seatsBtnDisabled]}
              onPress={() => mesta < 8 && setMesta(mesta + 1)}
              activeOpacity={0.7}
            >
              <Plus size={26} stroke={mesta < 8 ? Colors.white : Colors.gray600} />
            </TouchableOpacity>
          </View>
        )}

        {step === 5 && (
          <View style={styles.form}>
            <Input
              label="Cena po osobi (RSD)"
              value={cena}
              onChangeText={(t) => setCena(t.replace(/[^0-9]/g, ''))}
              placeholder="npr. 1200"
              keyboardType="numeric"
            />
            {cena ? (
              <View style={styles.pricePreview}>
                <Text style={styles.pricePreviewLabel}>Cena po mestu</Text>
                <Text style={styles.pricePreviewValue}>{parseInt(cena).toLocaleString()} RSD</Text>
              </View>
            ) : null}
          </View>
        )}

        {step === 6 && (
          <View style={styles.form}>
            <Input
              label="Napomene za putnike (opciono)"
              value={napomene}
              onChangeText={setNapomene}
              placeholder="Npr. Nema kućnih ljubimaca, muzika da, pušenje ne..."
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Pregled vožnje</Text>
              {([
                ['Polazište', polaziste],
                ['Odredište', odrediste],
                ['Datum', formatDate(datum)],
                ['Vreme', vreme],
                ['Slobodna mesta', mesta.toString()],
                ['Cena po osobi', `${parseInt(cena).toLocaleString()} RSD`],
              ] as [string, string][]).map(([lbl, val]) => (
                <View key={lbl} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{lbl}</Text>
                  <Text style={styles.summaryValue}>{val}</Text>
                </View>
              ))}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} stroke={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={step === TOTAL_STEPS ? 'Objavi vožnju' : 'Nastavi →'}
          onPress={handleNext}
          loading={loading}
          disabled={!canProceed()}
          size="lg"
          style={styles.nextBtn}
        />
      </View>
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
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  stepCounter: { color: Colors.gray500, fontSize: 14, fontWeight: '600' },
  progressTrack: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: '100%', backgroundColor: Colors.accent },
  content: { padding: 24, gap: 28, flexGrow: 1 },
  stepHeader: { gap: 6 },
  stepTitle: { color: Colors.white, fontSize: 28, fontWeight: '800' },
  stepSubtitle: { color: Colors.gray400, fontSize: 14 },
  form: { gap: 16 },
  seatsControl: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 32, paddingVertical: 32,
  },
  seatsBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  seatsBtnDisabled: { opacity: 0.4 },
  seatsNumWrapper: { alignItems: 'center', minWidth: 80 },
  seatsNum: { color: Colors.white, fontSize: 56, fontWeight: '800', lineHeight: 64 },
  seatsLabel: { color: Colors.gray400, fontSize: 14 },
  pricePreview: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.cardBg, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  pricePreviewLabel: { color: Colors.gray400, fontSize: 14 },
  pricePreviewValue: { color: Colors.accent, fontSize: 22, fontWeight: '800' },
  summary: { gap: 12, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  summaryTitle: { color: Colors.white, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryLabel: { color: Colors.gray400, fontSize: 14 },
  summaryValue: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 20 },
  nextBtn: { width: '100%' },
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 20,
  },
  successTitle: { color: Colors.white, fontSize: 28, fontWeight: '800' },
  successText: { color: Colors.gray400, fontSize: 15, textAlign: 'center', lineHeight: 24 },
  successActions: { gap: 12, width: '100%', marginTop: 8 },
});
