import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Icon, IconName } from '@/components';
import { bookingApi } from '@/api/booking.api';
import { Booking, BookingType } from '@/api/types';

const TYPE_META: Record<BookingType, { label: string; icon: IconName }> = {
  ONE_WAY: { label: 'One Way', icon: 'arrow-up' },
  HOURLY: { label: 'Hourly', icon: 'clock' },
  ROUND_TRIP: { label: 'Round Trip', icon: 'rotate-cw' },
  OUTSTATION: { label: 'Outstation', icon: 'mountain' },
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: colors.success,
  CANCELLED: colors.danger,
};

export function ActivityScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setBookings(await bookingApi.list());
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
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
        <Text style={typography.h2}>Activity</Text>
        <Text style={typography.bodyMuted}>Your bookings and trips</Text>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => {
          const meta = TYPE_META[item.type];
          return (
            <View style={styles.card}>
              <View style={styles.iconTile}>
                <Icon name={meta.icon} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.title}>{meta.label}</Text>
                <Text style={typography.caption} numberOfLines={1}>
                  {item.pickupAddress || 'Pickup'} → {item.destinationAddress || (item.type === 'HOURLY' ? `${item.hours ?? ''} hrs` : 'Destination')}
                </Text>
                {item.driver && <Text style={typography.caption}>Driver: {item.driver.name}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={typography.title}>Rs {Number(item.amount).toFixed(0)}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? colors.primary }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="file-text" size={40} color={colors.textMuted} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
              No trips yet. Book a driver to get started.
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { ...typography.caption, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
