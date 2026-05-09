import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Star, Shield, Car, ChevronRight, Bell, Pencil, Trash2,
  LogOut, AlertCircle,
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

  const menuItems = [
    {
      icon: Bell,
      label: 'Notifikacije',
      onPress: () => {},
      rightElement: (
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: Colors.border, true: Colors.accent }}
          thumbColor={Colors.white}
        />
      ),
    },
    { icon: Car, label: 'Moje vožnje', onPress: () => router.push('/my-rides') },
    { icon: Shield, label: 'Verifikacija', onPress: () => router.push('/verification') },
    { icon: Trash2, label: 'Obriši nalog', onPress: () => {}, danger: true },
  ];

  const verItems = [
    { label: 'Telefon', done: profile.verifikovan_telefon },
    { label: 'Email', done: true },
    { label: 'Lična karta', done: profile.verifikovan_id },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}
          >
            <Pencil size={15} stroke={Colors.white} />
            <Text style={styles.editBtnText}>Uredi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.85}
          >
            <View style={styles.avatarWrapper}>
              <Image
                source={profile.foto_url
                  ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.ime)}+${encodeURIComponent(profile.prezime)}&background=1A1A1A&color=00C566&size=200`}
                style={styles.avatar}
                contentFit="cover"
              />
              {profile.verifikovan_id && (
                <View style={styles.verifiedBadge}>
                  <Shield size={13} stroke={Colors.black} fill={Colors.black} />
                </View>
              )}
              <View style={styles.avatarEditOverlay}>
                <Pencil size={16} stroke={Colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{profile.ime} {profile.prezime}</Text>
          <Text style={styles.memberSince}>
            Član od {new Date(profile.created_at).getFullYear()} ·{' '}
            {profile.uloga === 'putnik' ? 'Putnik' : profile.uloga === 'vozac' ? 'Vozač' : 'Putnik & Vozač'}
          </Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{profile.ocena_prosek.toFixed(1)}</Text>
                <Star size={13} stroke={Colors.accent} fill={Colors.accent} />
              </View>
              <Text style={styles.statLabel}>Ocena</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.broj_voznji}</Text>
              <Text style={styles.statLabel}>Vožnji</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {verItems.filter((v) => v.done).length}/{verItems.length}
              </Text>
              <Text style={styles.statLabel}>Verif.</Text>
            </View>
          </View>
        </View>

        {/* Verifikacije */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => router.push('/verification')}
          activeOpacity={0.85}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verifikacije</Text>
            <Text style={styles.sectionLink}>Upravljaj →</Text>
          </View>
          <View style={styles.verificationRow}>
            {verItems.map((v) => (
              <View key={v.label} style={[styles.verItem, v.done && styles.verItemDone]}>
                <Text style={[styles.verText, v.done && styles.verTextDone]}>
                  {v.done ? '✓ ' : '○ '}{v.label}
                </Text>
              </View>
            ))}
          </View>
          {!profile.verifikovan_id && (
            <Text style={styles.verHint}>
              Verifikujte ličnu kartu i dobijte "Verified" bedž
            </Text>
          )}
        </TouchableOpacity>

        {/* Meni */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <item.icon size={20} stroke={item.danger ? Colors.error : Colors.gray300} />
              <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                {item.label}
              </Text>
              {item.rightElement ?? <ChevronRight size={18} stroke={Colors.gray600} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Odjava */}
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
            <LogOut size={18} stroke={Colors.gray400} />
            <Text style={styles.signOutText}>Odjavi se</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { gap: 20, paddingBottom: 48 },

  hero: { alignItems: 'center', gap: 8, paddingTop: 20, paddingBottom: 8, position: 'relative' },
  editBtn: {
    position: 'absolute', top: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.cardBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.border,
  },
  editBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarEditOverlay: {
    position: 'absolute', inset: 0, borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
    opacity: 0,
  },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.accent, borderRadius: 12, width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.black,
  },
  name: { color: Colors.white, fontSize: 24, fontWeight: '800' },
  memberSince: { color: Colors.gray500, fontSize: 13 },
  stats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBg, borderRadius: 20, padding: 20,
    marginTop: 8, alignSelf: 'stretch', marginHorizontal: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  statLabel: { color: Colors.gray500, fontSize: 12 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  section: { paddingHorizontal: 24, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  sectionLink: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  verificationRow: { flexDirection: 'row', gap: 8 },
  verItem: {
    flex: 1, backgroundColor: Colors.cardBg, borderRadius: 10,
    padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  verItemDone: { backgroundColor: 'rgba(0,197,102,0.1)', borderColor: Colors.accent },
  verText: { color: Colors.gray500, fontSize: 12, fontWeight: '600' },
  verTextDone: { color: Colors.accent },
  verHint: { color: Colors.gray600, fontSize: 12 },

  menu: { paddingHorizontal: 24, gap: 0 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuLabel: { flex: 1, color: Colors.white, fontSize: 15 },
  menuLabelDanger: { color: Colors.error },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginHorizontal: 24,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
  },
  signOutText: { color: Colors.gray300, fontSize: 15, fontWeight: '600' },
  confirmBox: {
    marginHorizontal: 24, backgroundColor: Colors.cardBg,
    borderRadius: 16, padding: 20, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmTitle: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  confirmText: { color: Colors.gray400, fontSize: 14 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
});
