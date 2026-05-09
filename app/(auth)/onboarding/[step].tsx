import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Phone, User, Camera, Car } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

const STEPS = [
  { id: 1, title: 'Vaš broj telefona', subtitle: 'Potreban za verifikaciju i kontakt sa saputnicima', icon: Phone },
  { id: 2, title: 'Kompletan profil', subtitle: 'Kako da vas prepoznaju', icon: User },
  { id: 3, title: 'Kakvu ulogu ima?', subtitle: 'Možete promeniti ovo kad god poželite', icon: Car },
];

export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const currentStep = parseInt(step ?? '1', 10);
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();

  const [telefon, setTelefon] = useState('');
  const [uloga, setUloga] = useState<'putnik' | 'vozac' | 'oboje'>('putnik');
  const [loading, setLoading] = useState(false);

  const totalSteps = STEPS.length;
  const stepData = STEPS[currentStep - 1];
  const StepIcon = stepData?.icon ?? User;

  const handleNext = async () => {
    if (currentStep === 1 && !telefon) {
      Alert.alert('Unesite broj telefona');
      return;
    }

    if (currentStep < totalSteps) {
      router.push(`/(auth)/onboarding/${currentStep + 1}`);
      return;
    }

    setLoading(true);
    const updates: { uloga: 'putnik' | 'vozac' | 'oboje'; telefon?: string } = { uloga };
    if (telefon) updates.telefon = telefon;

    const { error } = await supabase.from('profiles').update(updates).eq('id', user!.id);
    setLoading(false);

    if (error) {
      Alert.alert('Greška', error.message);
    } else {
      await fetchProfile();
      router.replace('/(tabs)');
    }
  };

  const roleOptions = [
    { value: 'putnik' as const, label: 'Putnik', desc: 'Tražim prevoz' },
    { value: 'vozac' as const, label: 'Vozač', desc: 'Nudim prevoz' },
    { value: 'oboje' as const, label: 'Oboje', desc: 'I tražim i nudim' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progressBar}>
        {STEPS.map((s) => (
          <View
            key={s.id}
            style={[styles.progressStep, s.id <= currentStep && styles.progressStepActive]}
          />
        ))}
      </View>

      <View style={styles.iconWrapper}>
        <StepIcon size={32} color={Colors.accent} />
      </View>

      <Text style={styles.title}>{stepData?.title}</Text>
      <Text style={styles.subtitle}>{stepData?.subtitle}</Text>

      <View style={styles.form}>
        {currentStep === 1 && (
          <Input
            label="Broj telefona"
            value={telefon}
            onChangeText={setTelefon}
            placeholder="+381 60 123 4567"
            keyboardType="phone-pad"
          />
        )}

        {currentStep === 2 && (
          <View style={styles.avatarSection}>
            <View style={styles.avatarPlaceholder}>
              <Camera size={32} color={Colors.gray500} />
            </View>
            <Text style={styles.avatarHint}>Dodajte profilnu sliku (opciono)</Text>
            <Button title="Izaberite sliku" onPress={() => {}} variant="secondary" />
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.roleOptions}>
            {roleOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.roleCard, uloga === opt.value && styles.roleCardSelected]}
                onPress={() => setUloga(opt.value)}
              >
                <Text style={[styles.roleLabel, uloga === opt.value && styles.roleLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.roleDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title={currentStep === totalSteps ? 'Završi' : 'Nastavi'}
          onPress={handleNext}
          loading={loading}
          size="lg"
        />
        {currentStep > 1 && (
          <Button title="Nazad" onPress={() => router.back()} variant="ghost" size="lg" />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  content: { padding: 24, gap: 24, paddingTop: 60 },
  progressBar: { flexDirection: 'row', gap: 8 },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressStepActive: { backgroundColor: Colors.accent },
  iconWrapper: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,197,102,0.1)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },
  title: { color: Colors.white, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.gray400, fontSize: 15, lineHeight: 22 },
  form: { gap: 16 },
  avatarSection: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.cardBg, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { color: Colors.gray500, fontSize: 13 },
  roleOptions: { gap: 12 },
  roleCard: {
    padding: 16, borderRadius: 16,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
  },
  roleCardSelected: { borderColor: Colors.accent, backgroundColor: 'rgba(0,197,102,0.1)' },
  roleLabel: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  roleLabelSelected: { color: Colors.accent },
  roleDesc: { color: Colors.gray500, fontSize: 13, marginTop: 4 },
  actions: { gap: 12 },
});
