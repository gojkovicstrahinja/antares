import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Message, Profile } from '@/types';

interface ConversationItem {
  otherId: string;
  otherProfile: Profile;
  lastMessage: Message;
  unreadCount: number;
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*), receiver:receiver_id(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!messages) { setLoading(false); return; }

    const conversationMap = new Map<string, ConversationItem>();

    for (const msg of messages as unknown as (Message & { sender: Profile; receiver: Profile })[]) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          otherId,
          otherProfile,
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      const conv = conversationMap.get(otherId)!;
      if (!msg.read && msg.receiver_id === user.id) {
        conv.unreadCount++;
      }
    }

    setConversations(Array.from(conversationMap.values()));
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Poruke</Text>

      {conversations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nema poruka</Text>
          <Text style={styles.emptyText}>
            Pošaljite poruku vozaču ili putniku iz detalja vožnje.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.otherId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => router.push(`/chat/${item.otherId}`)}
            >
              <View style={styles.avatarWrapper}>
                <Image
                  source={item.otherProfile.foto_url ?? `https://ui-avatars.com/api/?name=${item.otherProfile.ime}+${item.otherProfile.prezime}&background=1A1A1A&color=00C566`}
                  style={styles.avatar}
                  contentFit="cover"
                />
                {item.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>
                    {item.otherProfile.ime} {item.otherProfile.prezime}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {format(new Date(item.lastMessage.created_at), 'HH:mm', { locale: sr })}
                  </Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage.sender_id === user?.id ? 'Vi: ' : ''}
                  {item.lastMessage.content}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  title: { color: Colors.white, fontSize: 28, fontWeight: '800', padding: 20, paddingBottom: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  emptyText: { color: Colors.gray400, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  conversationItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  badge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.accent, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: Colors.black, fontSize: 11, fontWeight: '700' },
  conversationInfo: { flex: 1, gap: 4 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  conversationName: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  conversationTime: { color: Colors.gray500, fontSize: 12 },
  lastMessage: { color: Colors.gray400, fontSize: 13 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 80 },
});
