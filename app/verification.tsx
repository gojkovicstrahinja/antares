import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft, Shield, Phone, Mail, CreditCard, Car, Upload, CheckCircle, Clock,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface VerifItem {
  key: string;
  label: string;
  desc: string;
  done: boolean;
  icon: React.ComponentType<{ size: number; stroke: string }>;
  uploadable?: boolean;
  bucket?: string;
}

export default function VerificationScreen() {
  const router = useRouter();
  const { profile, fetchProfile, user } = useAuthStore();
  const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatus>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const uploadFile = async (bucket: string, key: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });

      if (result.canceled || !result.assets[0] || !user) return;
      const asset = result.assets[0];
      if (!asset.base64) return;

      setUploadStatus((s) => ({ ...s, [key]: 'uploading' }));

      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const fileName = `${user.id}/${key}.${ext}`;
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const byteArray = Uint8Array.from(atob(asset.base64), (c) => c.charCodeAt(0));

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, byteArray, { contentType, upsert: true });

      if (error) {
        setUploadStatus((s) => ({ ...s, [key]: 'error' }));
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setPreviews((p) => ({ ...p, [key]: publicUrl }));

      // Ako je lična karta, postavi saobracajna_url ili vozacka_url u vehicles/profiles
      if (key === 'licna_karta') {
        await supabase.from('profiles').update({ verifikovan_id: false }).eq('id', user.id);
        // Admin će ručno verifikovati
      }

      setUploadStatus((s) => ({ ...s, [key]: 'done' }));
      await fetchProfile();
    } catch {
      setUploadStatus((s) => ({ ...s, [key]: 'error' }));
    }
  };

  const items: VerifItem[] = [
    {
      key: 'email',
      label: 'Email adresa',
      desc: 'Potvrđena pri registraciji',
      done: true,
      icon: Mail,
    },
    {
      key: 'telefon',
      label: 'Broj telefona',
      desc: profile?.verifikovan_telefon
        ? 'Verifikovan'
        : 'Dodajte broj u edit profilu, verifikacija stiže SMS-om',
      done: !!profile?.verifikovan_telefon,
      icon: Phone,
    },
    {
      key: 'licna_karta',
      label: 'Lična karta',
      desc: profile?.verifikovan_id
        ? 'Verifikovana — dobijate "Verified" bedž'
        : 'Uploadujte fotografiju — admin proverava za 24h',
      done: !!profile?.verifikovan_id,
      icon: CreditCard,
      uploadable: true,
      bucket: 'documents',
    },
    {
      key: 'vozacka',
      label: 'Vozačka dozvola',
      desc: 'Obavezno za vozače — uploadujte obe strane',
      done: false,
      icon: Car,
      uploadable: true,
      bucket: 'documents',
    },
    {
      key: 'saobracajna',
      label: 'Saobraćajna dozvola',
      desc: 'Obavezno za vozače — potrebna za prvu vožnju',
      done: false,
      icon: Shield,
      uploadable: true,
      bucket: 'documents',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Verifikacija</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoBox}>
          <Shield size={20} stroke={Colors.accent} />
          <Text style={styles.infoText}>
            Verifikacija gradi poverenje između vozača i putnika. Što više verifikacija, više rezervacija.
          </Text>
        </View>

        {items.map((item) => {
          const status = uploadStatus[item.key];
          const preview = previews[item.key];

          return (
            <View key={item.key} style={[styles.card, item.done && styles.cardDone]}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconCircle, item.done && styles.iconCircleDone]}>
                  <item.icon size={20} stroke={item.done ? Colors.black : Colors.gray400} />
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  {item.done ? (
                    <View style={styles.doneBadge}>
                      <CheckCircle size={13} stroke={Colors.accent} />
                      <Text style={styles.doneBadgeText}>Verifikovano</Text>
                    </View>
                  ) : status === 'done' ? (
                    <View style={styles.pendingBadge}>
                      <Clock size={13} stroke={Colors.warning} />
                      <Text style={styles.pendingBadgeText}>Na čekanju</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardDesc}>{item.desc}</Text>

                {preview && (
                  <Image
                    source={preview}
                    style={styles.preview}
                    contentFit="cover"
                  />
                )}

                {item.uploadable && !item.done && (
                  <TouchableOpacity
                    style={[
                      styles.uploadBtn,
                      status === 'uploading' && styles.uploadBtnLoading,
                      status === 'done' && styles.uploadBtnDone,
                      status === 'error' && styles.uploadBtnError,
                    ]}
                    onPress={() => uploadFile(item.bucket!, item.key)}
                    disabled={status === 'uploading'}
                    activeOpacity={0.8}
                  >
                    {status === 'uploading' ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : status === 'done' ? (
                      <CheckCircle size={15} stroke={Colors.accent} />
                    ) : (
                      <Upload size={15} stroke={Colors.white} />
                    )}
                    <Text style={[
                      styles.uploadBtnText,
                      status === 'done' && styles.uploadBtnTextDone,
                    ]}>
                      {status === 'uploading' ? 'Učitavanje...'
                        : status === 'done' ? 'Poslato — čeka pregled'
                        : status === 'error' ? 'Greška — pokušaj ponovo'
                        : 'Uploaduj fotografiju'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
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
  scroll: { padding: 20, gap: 12, paddingBottom: 48 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(0,197,102,0.08)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.accent,
    marginBottom: 4,
  },
  infoText: { color: Colors.gray300, fontSize: 13, lineHeight: 20, flex: 1 },
  card: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.cardBg, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  cardDone: { borderColor: Colors.accent + '55' },
  cardLeft: { paddingTop: 2 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.inputBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  iconCircleDone: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  cardBody: { flex: 1, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  cardDesc: { color: Colors.gray400, fontSize: 13, lineHeight: 19 },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,197,102,0.15)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  doneBadgeText: { color: Colors.accent, fontSize: 11, fontWeight: '700' },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,149,0,0.15)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pendingBadgeText: { color: Colors.warning, fontSize: 11, fontWeight: '700' },
  preview: { width: '100%', height: 120, borderRadius: 10, marginTop: 4 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.inputBg, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border, marginTop: 4,
    alignSelf: 'flex-start',
  },
  uploadBtnLoading: { opacity: 0.7 },
  uploadBtnDone: { borderColor: Colors.accent, backgroundColor: 'rgba(0,197,102,0.1)' },
  uploadBtnError: { borderColor: Colors.error, backgroundColor: 'rgba(255,59,48,0.1)' },
  uploadBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  uploadBtnTextDone: { color: Colors.accent },
});
