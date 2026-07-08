import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { DriverStackParamList, DriverTabParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Icon, Button } from '@/components';
import { driverPortalApi } from '@/api/driverPortal.api';
import { Booking, BookingStatus } from '@/api/types';
import { getSocket } from '@/realtime/socket';

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

// Rides for which the rider should see the driver's live location.
const TRACKABLE: BookingStatus[] = ['ACCEPTED', 'ARRIVING', 'ONGOING'];

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: colors.success,
  CANCELLED: colors.danger,
};

export function DriverTripsScreen() {
  const navigation = useNavigation<Nav>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  // Latest set of active booking ids — read inside the GPS watcher.
  const activeIds = useRef<string[]>([]);
  useEffect(() => {
    activeIds.current = bookings.filter((b) => TRACKABLE.includes(b.status)).map((b) => b.id);
  }, [bookings]);

  const load = useCallback(async () => {
    try {
      setBookings(await driverPortalApi.myBookings());
    } catch {
      /* ignore */
    }
  }, []);

  // Stream the driver's GPS to the rider while on the Trips tab (active rides).
  // Web uses the browser geolocation API directly (expo-location's watch
  // subscription cleanup is broken on web); native uses expo-location.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      let cleanup = () => {};

      const emit = (lat: number, lng: number) => {
        const socket = getSocket();
        if (!socket) return;
        activeIds.current.forEach((bookingId) =>
          socket.emit('driver:location', { bookingId, lat, lng })
        );
      };

      (async () => {
        if (Platform.OS === 'web') {
          const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
          if (!geo) return;
          const id = geo.watchPosition(
            (pos) => emit(pos.coords.latitude, pos.coords.longitude),
            () => {},
            { enableHighAccuracy: false, maximumAge: 4000, timeout: 15000 }
          );
          if (cancelled) geo.clearWatch(id);
          else cleanup = () => geo.clearWatch(id);
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted' || cancelled) return;
          const sub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 10 },
            (pos) => emit(pos.coords.latitude, pos.coords.longitude)
          );
          if (cancelled) sub.remove();
          else cleanup = () => sub.remove();
        }
      })();

      return () => {
        cancelled = true;
        try {
          cleanup();
        } catch {
          /* ignore */
        }
      };
    }, [])
  );

  // Realtime: refresh when a ride's status changes (e.g. rider cancels).
  // Stays mounted-scoped (cheap, push-only) — no background polling.
  useEffect(() => {
    const socket = getSocket();
    const onChange = () => load();
    socket?.on('booking:status', onChange);
    socket?.on('booking:accepted', onChange);
    return () => {
      socket?.off('booking:status', onChange);
      socket?.off('booking:accepted', onChange);
    };
  }, [load]);

  // Poll only while this tab is focused (fallback if socket drops).
  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 15000);
      return () => clearInterval(t);
    }, [load])
  );

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
              <Pressable
                style={styles.cardHead}
                onPress={() => navigation.navigate('DriverTripDetail', { bookingId: item.id })}
              >
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
                <Icon name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

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
