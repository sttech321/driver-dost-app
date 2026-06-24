import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DriverStackParamList, DriverTabParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Icon, Button } from '@/components';
import { driverPortalApi } from '@/api/driverPortal.api';
import { Booking, BookingStatus } from '@/api/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<DriverTabParamList, 'Trips'>,
  NativeStackNavigationProp<DriverStackParamList>
>;

// What a driver does next, given the current status.
const NEXT: Partial<Record<BookingStatus, { status: BookingStatus; label: string }>> = {
  ACCEPTED: { status: 'ARRIVING', label: 'I’m on the way' },
  ARRIVING: { status: 'ONGOING', label: 'Start trip' },
  ONGOING: { status: 'COMPLETED', label: 'Complete trip' },
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: colors.success,
  CANCELLED: colors.danger,
};

export function DriverTripsScreen() {
  const navigation = useNavigation<Nav>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBookings(await driverPortalApi.myBookings());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const advance = async (b: Booking) => {
    const next = NEXT[b.status];
    if (!next) return;
    setBusy(b.id);
    try {
      await driverPortalApi.updateStatus(b.id, next.status as any);
      load();
    } catch (e: any) {
      Alert.alert('Could not update', e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={typography.h2}>My Trips</Text>
        <Text style={typography.bodyMuted}>Rides you’ve accepted</Text>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => {
          const next = NEXT[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.title}>{item.user?.name || 'Rider'}</Text>
                  <Text style={typography.caption} numberOfLines={1}>
                    {item.pickupAddress || 'Pickup'}
                    {item.destinationAddress ? ` → ${item.destinationAddress}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={typography.title}>Rs {Number(item.amount).toFixed(0)}</Text>
                  <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? colors.primary }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                {next && (
                  <Button
                    title={next.label}
                    onPress={() => advance(item)}
                    loading={busy === item.id}
                    style={{ flex: 1, height: 48 }}
                  />
                )}
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => item.user?.phone && Linking.openURL(`tel:${item.user.phone}`)}
                >
                  <Icon name="phone" size={20} color={colors.white} />
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() =>
                    navigation.navigate('Chat', {
                      bookingId: item.id,
                      peerName: item.user?.name || 'Rider',
                      asDriver: true,
                    })
                  }
                >
                  <Icon name="message-square" size={20} color={colors.white} />
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="file-text" size={40} color={colors.textMuted} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.md, textAlign: 'center' }]}>
              No accepted trips yet.{'\n'}Accept a request to see it here.
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
    gap: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  status: { ...typography.caption, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
