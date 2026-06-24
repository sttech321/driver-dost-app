import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Icon, IconName, Button } from '@/components';
import { driverPortalApi } from '@/api/driverPortal.api';
import { Booking, BookingType } from '@/api/types';
import { formatSchedule } from '@/utils/formatSchedule';

const TYPE_META: Record<BookingType, { label: string; icon: IconName }> = {
  ONE_WAY: { label: 'One Way', icon: 'arrow-up' },
  HOURLY: { label: 'Hourly', icon: 'clock' },
  ROUND_TRIP: { label: 'Round Trip', icon: 'rotate-cw' },
  OUTSTATION: { label: 'Outstation', icon: 'mountain' },
};

export function DriverRequestsScreen() {
  const [requests, setRequests] = useState<Booking[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await driverPortalApi.requests());
    } catch {
      /* ignore */
    }
  }, []);

  // Poll for new ride requests.
  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  const accept = async (b: Booking) => {
    setAccepting(b.id);
    try {
      await driverPortalApi.accept(b.id);
      Alert.alert('Request accepted', 'Find it under “My Trips”.');
      load();
    } catch (e: any) {
      Alert.alert('Could not accept', e.message);
      load(); // refresh in case it was taken
    } finally {
      setAccepting(null);
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={typography.h2}>Ride Requests</Text>
        <Text style={typography.bodyMuted}>Live requests from nearby riders</Text>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => {
          const meta = TYPE_META[item.type];
          return (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.iconTile}>
                  <Icon name={meta.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.title}>{meta.label}</Text>
                  <Text style={typography.caption}>{item.user?.name || 'Rider'}</Text>
                </View>
                <Text style={typography.h3}>Rs {Number(item.amount).toFixed(0)}</Text>
              </View>

              <View style={styles.routeRow}>
                <Icon name="map-pin" size={16} color={colors.primary} />
                <Text style={typography.body} numberOfLines={1}>
                  {item.pickupAddress || item.pickupLabel || 'Pickup'}
                </Text>
              </View>
              {item.destinationAddress && (
                <View style={styles.routeRow}>
                  <Icon name="map-pin" size={16} color={colors.danger} />
                  <Text style={typography.body} numberOfLines={1}>
                    {item.destinationAddress}
                  </Text>
                </View>
              )}

              <View style={styles.metaRow}>
                {item.distanceKm != null && (
                  <Text style={typography.caption}>{item.distanceKm} km</Text>
                )}
                {item.hours != null && <Text style={typography.caption}>{item.hours} hrs</Text>}
              </View>

              {item.scheduledAt && (
                <View style={styles.scheduleBadge}>
                  <Icon name="calendar" size={14} color={colors.primary} />
                  <Text style={styles.scheduleText}>
                    Scheduled: {formatSchedule(new Date(item.scheduledAt))}
                  </Text>
                </View>
              )}

              <Button
                title="Accept Request"
                onPress={() => accept(item)}
                loading={accepting === item.id}
                style={{ height: 48 }}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell" size={40} color={colors.textMuted} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.md, textAlign: 'center' }]}>
              No ride requests right now.{'\n'}New requests appear here automatically.
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xs },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  scheduleText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
