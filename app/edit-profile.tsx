import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Camera, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const ROLE_OPTIONS = [
  { value: 'putnik' as const, label: 'Putnik', desc: 'Tražim prevoz' },
  { value: 'vozac' as const, label: 'Vozač', desc: 'Nudim prevoz' },
  { value: 'oboje' as const, label: 'Oboje', desc: 'I tražim i nudim' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, fetchProfile, user } = useAuthStore();

  const [ime, setIme] = useState(profile?.ime ?? '');
  const [prezime, setPrezime] = useState(profile?.prezime ?? '');
  const [telefon, setTelefon] = useState(profile?.telefon ?? '');
  const [uloga, setUloga] = useState<'putnik' | 'vozac' | 'oboje'>(profile?.uloga ?? 'putnik');
  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url ?? '');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      if (!asset.base64 || !user) return;

      setUploadingPhoto(true);
      setError('');

      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const fileName = `${user.id}/avatar.${ext}`;
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      const base64Data = asset.base64;
      const byteArray = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, byteArray, { contentType, upsert: true });

      if (uploadError) {
        setError('Greška pri uploadu slike: ' + uploadError.message);
        setUploadingPhoto(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFotoUrl(publicUrl);
      setUploadingPhoto(false);
    } catch {
      setError('Nije moguće otvoriti galeriju.');
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!ime.trim() || !prezime.trim()) {
      setError('Ime i prezime su obavezni.');
      return;
    }
    setError('');
    setLoading(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ime: ime.trim(),
        prezime: prezime.trim(),
        telefon: telefon.trim() || null,
        uloga,
        foto_url: fotoUrl || null,
      })
      .eq('id', user.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      await fetchProfile();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
      }, 1200);
    }
  };

  const avatarSrc = fotoUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(ime || 'U')}+${encodeURIComponent(prezime || 'U')}&background=1A1A1A&color=00C566&size=200`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Uredi profil</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarSrc} style={styles.avatar} contentFit="cover" />
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={pickImage}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto
                ? <ActivityIndicator size="small" color={Colors.black} />
                : <Camera size={18} stroke={Colors.black} />
              }
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tapnite da promenite sliku</Text>
        </View>

        {/* Forma */}
        <View style={styles.form}>
          <View style={styles.row}>
            <Input
              label="Ime"
              value={ime}
              onChangeText={setIme}
              placeholder="Marko"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Prezime"
              value={prezime}
              onChangeText={setPrezime}
              placeholder="Marković"
              containerStyle={{ flex: 1 }}
            />
          </View>

          <Input
            label="Broj telefona"
            value={telefon}
            onChangeText={setTelefon}
            placeholder="+381 60 123 4567"
            keyboardType="phone-pad"
          />

          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>Uloga</Text>
            <View style={styles.roleOptions}>
              {ROLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.roleCard, uloga === opt.value && styles.roleCardSelected]}
                  onPress={() => setUloga(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleName, uloga === opt.value && styles.roleNameSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.roleDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={15} stroke={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <CheckCircle size={15} stroke={Colors.accent} />
              <Text style={styles.successText}>Profil je sačuvan!</Text>
            </View>
          ) : null}

          <Button title="Sačuvaj promene" onPress={handleSave} loading={loading} size="lg" />
        </View>
      </ScrollView>
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
  title: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  scroll: { padding: 24, gap: 28, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', gap: 10 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.accent, borderRadius: 18,
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.black,
  },
  avatarHint: { color: Colors.gray500, fontSize: 13 },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  roleSection: { gap: 8 },
  roleLabel: { color: Colors.gray300, fontSize: 13, fontWeight: '600' },
  roleOptions: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1, padding: 12, borderRadius: 14,
    backgroundColor: Colors.cardBg,
    borderWidth: 1, borderColor: Colors.border,
  },
  roleCardSelected: { borderColor: Colors.accent, backgroundColor: 'rgba(0,197,102,0.1)' },
  roleName: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  roleNameSelected: { color: Colors.accent },
  roleDesc: { color: Colors.gray500, fontSize: 11, marginTop: 3 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,197,102,0.1)', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.accent,
  },
  successText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
});
