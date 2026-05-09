import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Star, Shield, MessageCircle, Flag, Car } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Profile, Review } from '@/types';
import { formatDate } from '@/lib/utils';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<(Review & { ocenjivac: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    const [profileRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase
        .from('reviews')
        .select('*, ocenjivac:ocenjivac_id(*)')
        .eq('oceniti_id', id)
        .eq('tip', 'putnik_ocenjuje_vozaca')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data as unknown as (Review & { ocenjivac: Profile })[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Profil nije pronađen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = user?.id === id;
  const avatarUrl = profile.foto_url
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.ime)}+${encodeURIComponent(profile.prezime)}&background=1A1A1A&color=00C566&size=200`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        {!isOwnProfile && (
          <TouchableOpacity onPress={() => router.push(`/chat/${id}`)} style={styles.chatBtn}>
            <MessageCircle size={22} stroke={Colors.accent} />
          </TouchableOpacity>
        )}
        {isOwnProfile && <View style={{ width: 40 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar i ime */}
        <View style={styles.hero}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
            {profile.verifikovan_id && (
              <View style={styles.verifiedBadge}>
                <Shield size={13} stroke={Colors.black} fill={Colors.black} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile.ime} {profile.prezime}</Text>
          <Text style={styles.since}>
            Član od {new Date(profile.created_at).getFullYear()}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.ocena_prosek > 0 ? profile.ocena_prosek.toFixed(1) : '—'}</Text>
              <View style={styles.statStarRow}>
                <Star size={12} stroke={Colors.accent} fill={Colors.accent} />
                <Text style={styles.statLabel}>Ocena</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.broj_voznji}</Text>
              <Text style={styles.statLabel}>Vožnji</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{reviews.length}</Text>
              <Text style={styles.statLabel}>Recenzija</Text>
            </View>
          </View>
        </View>

        {/* Verifikacije */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verifikacije</Text>
          <View style={styles.verificationsRow}>
            <VerificationItem label="Email" done />
            <VerificationItem label="Telefon" done={profile.verifikovan_telefon} />
            <VerificationItem label="Lična karta" done={profile.verifikovan_id} />
          </View>
        </View>

        {/* Recenzije */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recenzije {reviews.length > 0 ? `(${reviews.length})` : ''}
          </Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Text style={styles.emptyText}>Još nema recenzija.</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={(review.ocenjivac as Profile).foto_url
                      ?? `https://ui-avatars.com/api/?name=${encodeURIComponent((review.ocenjivac as Profile).ime)}+${encodeURIComponent((review.ocenjivac as Profile).prezime)}&background=1A1A1A&color=00C566`}
                    style={styles.reviewAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewerName}>
                      {(review.ocenjivac as Profile).ime} {(review.ocenjivac as Profile).prezime}
                    </Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          stroke={Colors.accent}
                          fill={s <= review.ocena ? Colors.accent : 'transparent'}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {formatDate(review.created_at.split('T')[0])}
                  </Text>
                </View>
                {review.komentar ? (
                  <Text style={styles.reviewComment}>{review.komentar}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Prijavi korisnika */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => {/* TODO: report modal */}}
          >
            <Flag size={15} stroke={Colors.error} />
            <Text style={styles.reportText}>Prijavi korisnika</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VerificationItem({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={[styles.verItem, done && styles.verItemDone]}>
      <Text style={[styles.verText, done && styles.verTextDone]}>
        {done ? '✓ ' : '○ '}{label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.gray400, fontSize: 15 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  chatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,197,102,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  scroll: { paddingBottom: 48 },
  hero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24, gap: 8 },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.accent, borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.black,
  },
  name: { color: Colors.white, fontSize: 24, fontWeight: '800' },
  since: { color: Colors.gray500, fontSize: 13 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBg, borderRadius: 20, padding: 20,
    marginTop: 12, alignSelf: 'stretch',
    borderWidth: 1, borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  statStarRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statLabel: { color: Colors.gray500, fontSize: 12 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  section: { paddingHorizontal: 24, paddingTop: 24, gap: 12 },
  sectionTitle: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  verificationsRow: { flexDirection: 'row', gap: 8 },
  verItem: {
    flex: 1, backgroundColor: Colors.cardBg,
    borderRadius: 10, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  verItemDone: { backgroundColor: 'rgba(0,197,102,0.1)', borderColor: Colors.accent },
  verText: { color: Colors.gray500, fontSize: 12, fontWeight: '600' },
  verTextDone: { color: Colors.accent },
  emptyReviews: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: Colors.gray500, fontSize: 14 },
  reviewCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    padding: 14, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewMeta: { flex: 1, gap: 3 },
  reviewerName: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewDate: { color: Colors.gray600, fontSize: 11 },
  reviewComment: { color: Colors.gray300, fontSize: 13, lineHeight: 20 },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 24, marginTop: 32,
    paddingVertical: 12,
  },
  reportText: { color: Colors.error, fontSize: 13 },
});
