import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon, IconName, ScreenHeader } from '@/components';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { AppNotification, NotificationType } from '@/api/types';

// Shared between the rider (AppStack) and driver (DriverStack) navigators, so the
// navigation target is resolved per-role rather than against a single param list.
type Nav = NativeStackNavigationProp<any>;

const ICON: Record<NotificationType, IconName> = {
  BOOKING_ACCEPTED: 'check',
  DRIVER_ARRIVING: 'map-pin',
  RIDE_STARTED: 'arrow-right',
  RIDE_COMPLETED: 'check',
  RIDE_CANCELLED: 'alert-circle',
  PAYMENT_SUCCESS: 'check',
  WALLET_CREDITED: 'plus',
  CHAT_MESSAGE: 'message-square',
  NEW_REQUEST: 'bell',
  PROMO: 'bell',
  GENERAL: 'bell',
};

// Where tapping a notification routes — resolved per role so we only ever target
// a route that actually exists in the current navigator (null = just mark read).
function destination(n: AppNotification, isDriver: boolean): { screen: string; params: any } | null {
  const bookingId = n.data?.bookingId;
  if (!bookingId) return null;

  if (isDriver) {
    // Drivers only ever receive CHAT_MESSAGE → open the chat thread (driver side).
    if (n.type === 'CHAT_MESSAGE') {
      return { screen: 'Chat', params: { bookingId, peerName: 'Rider', asDriver: true } };
    }
    return null;
  }

  switch (n.type) {
    case 'BOOKING_ACCEPTED':
    case 'DRIVER_ARRIVING':
    case 'RIDE_STARTED':
    case 'CHAT_MESSAGE':
      return { screen: 'DriverArriving', params: { bookingId } };
    case 'RIDE_COMPLETED':
    case 'PAYMENT_SUCCESS':
      return { screen: 'DriverLeaving', params: { bookingId } };
    default:
      return null;
  }
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { items, loading, unread, refresh, markRead, markAllRead } = useNotifications();
  const isDriver = user?.role === 'DRIVER';

  const onPressItem = (n: AppNotification) => {
    if (!n.isRead) markRead(n.id);
    const dest = destination(n, isDriver);
    if (dest) navigation.navigate(dest.screen, dest.params);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Notifications" />
        {unread > 0 && (
          <Pressable style={styles.markAll} onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </SafeAreaView>

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => onPressItem(item)}
          >
            <View style={[styles.iconWrap, !item.isRead && styles.iconWrapUnread]}>
              <Icon name={ICON[item.type] ?? 'bell'} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={typography.caption} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Icon name="bell" size={40} color={colors.textMuted} />
              <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>No notifications yet.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.white },
  markAll: { alignSelf: 'flex-end', paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  markAllText: { ...typography.label, color: colors.primary },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardUnread: { backgroundColor: colors.primarySofter, borderColor: colors.primarySoft },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: colors.white },
  time: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
});
