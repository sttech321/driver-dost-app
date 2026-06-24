import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Avatar, Icon } from '@/components';
import { bookingApi } from '@/api/booking.api';
import { driverPortalApi } from '@/api/driverPortal.api';
import { ChatMessage } from '@/api/types';
import { getSocket, joinBooking } from '@/realtime/socket';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { bookingId, peerName, asDriver } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Append without duplicating (socket echo + poll can both deliver a message).
  const appendMessage = (m: ChatMessage) =>
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

  const load = async () => {
    try {
      const data = asDriver
        ? await driverPortalApi.listMessages(bookingId)
        : await bookingApi.listMessages(bookingId);
      setMessages(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    // Realtime: join the room and receive messages instantly.
    joinBooking(bookingId);
    const socket = getSocket();
    const onMessage = (m: ChatMessage) => {
      if (m.bookingId === bookingId) {
        appendMessage(m);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      }
    };
    socket?.on('chat:message', onMessage);
    // Fallback poll (socket is primary; reconciles if it dropped).
    const t = setInterval(load, 20000);
    return () => {
      socket?.off('chat:message', onMessage);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    const socket = getSocket();
    try {
      if (socket?.connected) {
        // Server persists + broadcasts (echo arrives via 'chat:message').
        socket.emit('chat:message', { bookingId, text: value });
      } else {
        const msg = asDriver
          ? await driverPortalApi.sendMessage(bookingId, value)
          : await bookingApi.sendMessage(bookingId, value, 'USER');
        appendMessage(msg);
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      /* ignore */
    }
  };

  const mySide = asDriver ? 'DRIVER' : 'USER';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Icon name="chevron-left" size={26} color={colors.white} />
          </Pressable>
          <Avatar size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{peerName}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
          <Pressable hitSlop={8}>
            <Icon name="phone" size={22} color={colors.white} />
          </Pressable>
          <Pressable hitSlop={8} style={{ marginLeft: spacing.lg }}>
            <Icon name="more-horizontal" size={22} color={colors.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          ListHeaderComponent={<Text style={styles.dayLabel}>Today</Text>}
          ListEmptyComponent={
            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xxl }]}>
              Say hi to your driver 👋
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.senderType === mySide;
            return (
              <View style={[styles.bubbleRow, mine ? styles.rowRight : styles.rowLeft]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={typography.body}>{item.text}</Text>
                </View>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
            );
          }}
        />

        <SafeAreaView edges={['bottom']}>
          <View style={styles.inputBar}>
            <View style={styles.inputDot} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type anything here.."
              placeholderTextColor={colors.textMuted}
              style={[typography.body, styles.input]}
              onSubmitEditing={send}
            />
            <Pressable onPress={send} hitSlop={8}>
              <Icon name="send" size={24} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.mic} hitSlop={8}>
              <Icon name="mic" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  headerSafe: { backgroundColor: colors.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  headerName: { ...typography.h3, color: colors.white },
  headerStatus: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  messages: { padding: spacing.lg, gap: spacing.lg },
  dayLabel: { ...typography.caption, textAlign: 'center', marginBottom: spacing.md },
  bubbleRow: { maxWidth: '80%', gap: 4 },
  rowLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  rowRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { borderRadius: radius.lg, padding: spacing.md },
  bubbleTheirs: { backgroundColor: colors.field, borderTopLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.primarySoft, borderTopRightRadius: 4 },
  time: { ...typography.caption, fontSize: 11 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  inputDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.textPrimary },
  input: { flex: 1, paddingVertical: spacing.sm },
  mic: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
