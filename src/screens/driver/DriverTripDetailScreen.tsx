import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DriverStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { MapPlaceholder, ScreenHeader, Avatar, Icon, Button, IconName } from '@/components';
import { driverPortalApi } from '@/api/driverPortal.api';
import { getSocket } from '@/realtime/socket';
import { useRoute } from '@/hooks/useRoute';
import { Booking, BookingStatus, BookingType } from '@/api/types';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverTripDetail'>;

const NEXT: Partial<Record<BookingStatus, { status: BookingStatus; label: string }>> = {
  ACCEPTED: { status: 'ARRIVING', label: 'I’m on the way' },
  ARRIVING: { status: 'ONGOING', label: 'Start trip' },
  ONGOING: { status: 'COMPLETED', label: 'Complete trip' },
};

const TYPE_LABEL: Record<BookingType, string> = {
  ONE_WAY: 'One Way',
  HOURLY: 'Hourly',
  ROUND_TRIP: 'Round Trip',
  OUTSTATION: 'Outstation',
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: colors.success,
  CANCELLED: colors.danger,
};

export function DriverTripDetailScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setBooking(await driverPortalApi.getBooking(bookingId));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const onChange = (b: Booking) => b?.id === bookingId && setBooking(b);
    socket?.on('booking:status', onChange);
    return () => {
      socket?.off('booking:status', onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const advance = async () => {
    if (!booking) return;
    const next = NEXT[booking.status];
    if (!next) return;
    setBusy(true);
    try {
      setBooking(await driverPortalApi.updateStatus(booking.id, next.status as any));
    } catch (e: any) {
      Alert.alert('Could not update', e.message);
    } finally {
      setBusy(false);
    }
  };

  const pickup =
    booking?.pickupLat != null && booking?.pickupLng != null
      ? { lat: booking.pickupLat, lng: booking.pickupLng }
      : null;
  const destination =
    booking?.destinationLat != null && booking?.destinationLng != null
      ? { lat: booking.destinationLat, lng: booking.destinationLng }
      : null;
  const mapRoute = useRoute(pickup, destination); // road-snapped, falls back to straight

  if (!booking) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const markers = [
    ...(pickup ? [{ lat: pickup.lat, lng: pickup.lng, color: colors.primary }] : []),
    ...(destination ? [{ lat: destination.lat, lng: destination.lng, color: colors.danger }] : []),
  ];
  const region = pickup
    ? { latitude: pickup.lat, longitude: pickup.lng, latitudeDelta: 0.12, longitudeDelta: 0.12 }
    : undefined;

  const next = NEXT[booking.status];

  return (
    <View style={styles.root}>
      <MapPlaceholder style={styles.map} region={region} markers={markers} route={mapRoute} />
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Trip Details" banner />
      </SafeAreaView>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grabber} />

        {/* Rider */}
        <View style={styles.riderRow}>
          <Avatar uri={booking.user?.photoUrl} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>{booking.user?.name || 'Rider'}</Text>
            <Text style={typography.caption}>{TYPE_LABEL[booking.type]} trip</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={typography.h3}>Rs {Number(booking.amount).toFixed(0)}</Text>
            <Text style={[styles.status, { color: STATUS_COLOR[booking.status] ?? colors.primary }]}>
              {booking.status}
            </Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeCard}>
          <Row icon="crosshair" label="Pickup" value={booking.pickupAddress || booking.pickupLabel || '—'} color={colors.primary} />
          <View style={styles.routeLine} />
          <Row
            icon="map-pin"
            label="Destination"
            value={
              booking.destinationAddress ||
              booking.destinationLabel ||
              (booking.type === 'HOURLY' ? `${booking.hours ?? ''} hours` : '—')
            }
            color={colors.danger}
          />
        </View>

        {/* Meta */}
        <View style={styles.metaGrid}>
          {booking.distanceKm != null && <Meta label="Distance" value={`${booking.distanceKm} km`} />}
          <Meta label="Fare" value={`Rs ${Number(booking.amount).toFixed(0)}`} />
          {booking.scheduledAt && (
            <Meta label="Scheduled" value={new Date(booking.scheduledAt).toLocaleString()} />
          )}
          <Meta label="Payment" value={booking.paymentStatus} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {next && (
            <Button title={next.label} onPress={advance} loading={busy} style={{ flex: 1, height: 52 }} />
          )}
          <Pressable
            style={styles.iconBtn}
            onPress={() => booking.user?.phone && Linking.openURL(`tel:${booking.user.phone}`)}
          >
            <Icon name="phone" size={22} color={colors.white} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              navigation.navigate('Chat', {
                bookingId: booking.id,
                peerName: booking.user?.name || 'Rider',
                asDriver: true,
              })
            }
          >
            <Icon name="message-square" size={22} color={colors.white} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={typography.caption}>{label}</Text>
        <Text style={typography.body}>{value}</Text>
      </View>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={typography.title}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { height: '42%' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  grabber: { alignSelf: 'center', width: 56, height: 5, borderRadius: 3, backgroundColor: colors.divider },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  status: { ...typography.caption, fontWeight: '700' },
  routeCard: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  routeLine: { width: 1, height: 16, backgroundColor: colors.divider, marginLeft: 8 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  meta: {
    minWidth: '44%',
    flexGrow: 1,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
