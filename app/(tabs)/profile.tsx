import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ScreenView } from '@/components/ui/ScreenView';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Star, Shield, Car, ChevronRight, Bell, Pencil, Trash2, LogOut, AlertCircle,
  Mail, Phone, CreditCard, Route, Ticket,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!profile) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  const verifications = [
    { icon: Mail, label: 'Email', sub: 'Verifikovan', done: true },
    { icon: Phone, label: 'Telefon', sub: profile.verifikovan_telefon ? 'Verifikovan' : 'Dodaj broj', done: profile.verifikovan_telefon },
    { icon: CreditCard, label: 'Lična karta', sub: profile.verifikovan_id ? 'Verified bedž aktivan' : 'Dobij Verified bedž', done: profile.verifikovan_id, highlight: !profile.verifikovan_id },
  ];

  const settings = [
    {
      icon: Bell, label: 'Notifikacije', rightElement: (
        <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: Colors.border, true: Colors.accent }} thumbColor={Colors.white} />
      ),
    },
    { icon: Ticket, label: 'Moje rezervacije', sub: '', onPress: () => router.push('/my-bookings') },
    { icon: Route, label: 'Moje vožnje', sub: '', onPress: () => router.push('/my-rides') },
    { icon: Shield, label: 'Privatnost i sigurnost', onPress: () => {} },
  ];

  const initials = `${profile.ime[0]}${profile.prezime[0]}`.toUpperCase();
  const avatarSrc = profile.foto_url
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.ime)}+${encodeURIComponent(profile.prezime)}&background=0E8C4D&color=19E07A&bold=true&size=200`;

  const verDone = verifications.filter((v) => v.done).length;

  return (
    <ScreenView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero gradient header */}
        <View style={styles.hero}>
          <View style={styles.heroGradient} />
          <View style={styles.heroContent}>
            <View style={styles.heroAvatarRow}>
              <View style={styles.avatarRingWrapper}>
                <Image source={avatarSrc} style={styles.avatar} contentFit="cover" />
                {profile.verifikovan_id && (
                  <View style={styles.verifiedBadge}>
                    <Shield size={12} stroke={Colors.black} fill={Colors.black} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push('/edit-profile')}
              >
                <Pencil size={12} stroke={Colors.text} />
                <Text style={styles.editBtnText}>Uredi profil</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{profile.ime} {profile.prezime}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.since}>Član od {new Date(profile.created_at).getFullYear()}</Text>
              {profile.verifikovan_id && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Shield size={13} stroke={Colors.accent} strokeWidth={2.4} />
                  <Text style={styles.verified}>Verifikovan</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          {[
            { v: profile.ocena_prosek > 0 ? profile.ocena_prosek.toFixed(1) : '—', l: 'OCENA', icon: <Star size={14} stroke={Colors.warning} fill={Colors.warning} /> },
            { v: String(profile.broj_voznji), l: 'VOŽNJI', icon: <Route size={14} stroke={Colors.text} /> },
            { v: `${verDone}/3`, l: 'VERIF.', icon: <Shield size={14} stroke={Colors.accent} /> },
          ].map((s, i) => (
            <React.Fragment key={s.l}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.stat}>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{s.v}</Text>
                  {s.icon}
                </View>
                <Text style={styles.statLabel}>{s.l}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Verifications */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => router.push('/verification')}
          activeOpacity={0.9}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verifikacije</Text>
            <Text style={styles.sectionLink}>Upravljaj →</Text>
          </View>
          <View style={styles.verList}>
            {verifications.map((v, i) => (
              <View
                key={v.label}
                style={[
                  styles.verItem,
                  v.highlight && styles.verItemHighlight,
                  i < verifications.length - 1 && styles.verItemBorder,
                ]}
              >
                <View style={[styles.verIconBox, v.done && styles.verIconBoxDone]}>
                  <v.icon size={18} stroke={v.done ? Colors.accent : Colors.textDim} />
                </View>
                <View style={styles.verText}>
                  <Text style={styles.verLabel}>{v.label}</Text>
                  <Text style={styles.verSub}>{v.sub}</Text>
                </View>
                {v.done ? (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                ) : (
                  <ChevronRight size={18} stroke={Colors.gray400} />
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Settings */}
        <View style={styles.settingsCard}>
          {settings.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              style={[styles.settingsRow, i < settings.length - 1 && styles.settingsRowBorder]}
              onPress={row.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.settingsIcon}>
                <row.icon size={16} stroke={Colors.text} />
              </View>
              <View style={styles.settingsText}>
                <Text style={styles.settingsLabel}>{row.label}</Text>
                {row.sub ? <Text style={styles.settingsSub}>{row.sub}</Text> : null}
              </View>
              {row.rightElement ?? <ChevronRight size={18} stroke={Colors.gray400} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        {confirmSignOut ? (
          <View style={styles.confirmBox}>
            <View style={styles.confirmHeader}>
              <AlertCircle size={20} stroke={Colors.warning} />
              <Text style={styles.confirmTitle}>Da li ste sigurni?</Text>
            </View>
            <Text style={styles.confirmText}>Bićete odjavljeni sa svog naloga.</Text>
            <View style={styles.confirmBtns}>
              <Button title="Otkaži" onPress={() => setConfirmSignOut(false)} variant="secondary" style={{ flex: 1 }} />
              <Button title="Odjavi se" onPress={handleSignOut} loading={signingOut} variant="danger" style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.signOutBtn} onPress={() => setConfirmSignOut(true)} activeOpacity={0.7}>
            <LogOut size={16} stroke={Colors.error} />
            <Text style={styles.signOutText}>Odjavi se</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>Antares · v1.0.0</Text>
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { gap: 20, paddingBottom: 48 },

  hero: { position: 'relative' },
  heroGradient: {
    height: 120,
    backgroundColor: Colors.accentSoft,
  },
  heroContent: { paddingHorizontal: 20, marginTop: -52 },
  heroAvatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  avatarRingWrapper: { position: 'relative' },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: Colors.black,
  },
  verifiedBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: Colors.accent, borderRadius: 12, width: 22, height: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.black,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.cardBg,
    borderWidth: 1, borderColor: Colors.border,
  },
  editBtnText: { color: Colors.text, fontSize: 12, fontWeight: '600' },
  name: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  since: { fontSize: 13, color: Colors.textDim, fontWeight: '500' },
  metaDot: { fontSize: 13, color: Colors.textDim },
  verified: { fontSize: 13, color: Colors.textDim, fontWeight: '500' },

  statsCard: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: Colors.cardBg, borderRadius: 20, padding: 4,
    marginHorizontal: 20, borderWidth: 1, borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1, color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.gray400, fontWeight: '600', marginTop: 6, letterSpacing: 0.4 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 12 },

  section: { paddingHorizontal: 20, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  sectionLink: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  verList: {
    backgroundColor: Colors.cardBg, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  verItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  verItemHighlight: { borderColor: Colors.accentSoft2 },
  verItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  verIconBox: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  verIconBoxDone: { backgroundColor: Colors.accentSoft },
  verText: { flex: 1 },
  verLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  verSub: { fontSize: 12, color: Colors.gray400, marginTop: 1 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: Colors.black, fontSize: 13, fontWeight: '800' },

  settingsCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.cardBg, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: '14px 16px' as never, paddingHorizontal: 16, paddingVertical: 14 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingsIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsText: { flex: 1 },
  settingsLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  settingsSub: { fontSize: 11, color: Colors.gray400, marginTop: 1 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginHorizontal: 20,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
  },
  signOutText: { color: Colors.error, fontSize: 14, fontWeight: '600' },
  confirmBox: {
    marginHorizontal: 20, backgroundColor: Colors.cardBg,
    borderRadius: 16, padding: 20, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  confirmText: { color: Colors.textDim, fontSize: 14 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  version: { textAlign: 'center', fontSize: 11, color: Colors.gray400, fontWeight: '500' },
});
