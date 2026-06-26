import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, TabParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Avatar, Icon } from '@/components';
import { bookingApi } from '@/api/booking.api';
import { Booking } from '@/api/types';
import { useNotifications } from '@/context/NotificationContext';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Inbox'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function InboxScreen() {
  const navigation = useNavigation<Nav>();
  const { items } = useNotifications();
  const [chats, setChats] = useState<Booking[]>([]);

  // Unread chat-message count per booking → per-thread "new message" badge.
  const unreadByBooking = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of items) {
      if (n.type === 'CHAT_MESSAGE' && !n.isRead && n.data?.bookingId) {
        map[n.data.bookingId] = (map[n.data.bookingId] || 0) + 1;
      }
    }
    return map;
  }, [items]);

  const load = useCallback(async () => {
    try {
      const all = await bookingApi.list();
      // Conversations exist for bookings that have an assigned driver.
      setChats(all.filter((b) => b.driver));
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={typography.h2}>Inbox</Text>
        <Text style={typography.bodyMuted}>Chat with your drivers</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => {
          const unread = unreadByBooking[item.id] || 0;
          return (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('Chat', {
                  bookingId: item.id,
                  peerName: item.driver?.name ?? 'Driver',
                })
              }
            >
              <Avatar uri={item.driver?.photoUrl} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={typography.title}>{item.driver?.name}</Text>
                <Text
                  style={[typography.caption, unread > 0 && styles.newMsg]}
                  numberOfLines={1}
                >
                  {unread > 0 ? `${unread} new message${unread > 1 ? 's' : ''}` : `${item.driver?.title} · ${item.status}`}
                </Text>
              </View>
              <View style={styles.iconWrap}>
                <Icon name="message-square" size={20} color={unread > 0 ? colors.primary : colors.textMuted} />
                {unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="message-square" size={40} color={colors.textMuted} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
              No conversations yet.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: 2 },
  list: { padding: spacing.xl, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  sep: { height: 1, backgroundColor: colors.divider },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  newMsg: { color: colors.primary, fontWeight: '700' },
  iconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
});
