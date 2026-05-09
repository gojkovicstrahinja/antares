import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRealtimeMessages } from '@/hooks/useRealtime';
import { Input } from '@/components/ui/Input';
import type { Message, Profile } from '@/types';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user || !userId) return;
    loadData();
  }, [user, userId]);

  useRealtimeMessages(user?.id ?? '', userId ?? '', (msg) => {
    setMessages((prev) => [...prev, msg]);
    markRead();
  });

  const loadData = async () => {
    if (!user || !userId) return;

    const [profileRes, messagesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true }),
    ]);

    if (profileRes.data) setOtherProfile(profileRes.data);
    if (messagesRes.data) setMessages(messagesRes.data);
    setLoading(false);
    markRead();
  };

  const markRead = async () => {
    if (!user || !userId) return;
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', userId)
      .eq('receiver_id', user.id)
      .eq('read', false);
  };

  const sendMessage = async () => {
    if (!text.trim() || !user || !userId) return;
    const content = text.trim();
    setText('');
    setSending(true);
    setSendError(false);
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: userId, content })
      .select()
      .single();
    setSending(false);
    if (error) {
      setSendError(true);
      setText(content);
    } else if (data) {
      setMessages((prev) => [...prev, data]);
    }
  };

  const QUICK_REPLIES = ['Stižem za 5 min', 'Gde si tačno?', 'Otkazujem'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats')}>
          <ArrowLeft size={24} stroke={Colors.white} />
        </TouchableOpacity>
        {otherProfile && (
          <View style={styles.headerProfile}>
            <Image
              source={otherProfile.foto_url ?? `https://ui-avatars.com/api/?name=${otherProfile.ime}+${otherProfile.prezime}&background=1A1A1A&color=00C566`}
              style={styles.headerAvatar}
              contentFit="cover"
            />
            <Text style={styles.headerName}>{otherProfile.ime} {otherProfile.prezime}</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isMine = item.sender_id === user?.id;
              return (
                <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                      {item.content}
                    </Text>
                    <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                      {format(new Date(item.created_at), 'HH:mm', { locale: sr })}
                    </Text>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {sendError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>Poruka nije poslata. Pokušajte ponovo.</Text>
            <TouchableOpacity onPress={() => setSendError(false)}>
              <Text style={styles.errorBannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickReplies}>
          {QUICK_REPLIES.map((reply) => (
            <TouchableOpacity
              key={reply}
              style={styles.quickReply}
              onPress={() => { setText(reply); }}
            >
              <Text style={styles.quickReplyText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <Input
            value={text}
            onChangeText={setText}
            placeholder="Napišite poruku..."
            containerStyle={styles.inputContainer}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
          >
            <Send size={20} stroke={Colors.black} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerName: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  messages: { padding: 16, gap: 8 },
  messageRow: { flexDirection: 'row', marginBottom: 4 },
  messageRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 18, padding: 12, gap: 4 },
  bubbleMine: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.cardBg, borderBottomLeftRadius: 4 },
  bubbleText: { color: Colors.white, fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: Colors.black },
  bubbleTime: { color: Colors.gray500, fontSize: 11, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(0,0,0,0.5)' },
  quickReplies: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8, flexWrap: 'wrap',
  },
  quickReply: {
    backgroundColor: Colors.cardBg, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickReplyText: { color: Colors.gray300, fontSize: 13 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  inputContainer: { flex: 1 },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.error + '22', borderTopWidth: 1, borderTopColor: Colors.error,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  errorBannerText: { color: Colors.error, fontSize: 13, flex: 1 },
  errorBannerClose: { color: Colors.error, fontSize: 16, paddingLeft: 12 },
});
