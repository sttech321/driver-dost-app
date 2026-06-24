import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Avatar, Icon, MapPlaceholder, ScreenHeader } from '@/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingApi } from '@/api/booking.api';
import { Booking } from '@/api/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DriverArriving'>;

export function DriverArrivingScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);

  // Poll until a driver accepts (bookings start unassigned / REQUESTED).
  useEffect(() => {
    let active = true;
    const fetchOnce = async () => {
      try {
        const b = await bookingApi.get(bookingId);
        if (active) setBooking(b);
      } catch {
        /* keep polling */
      }
    };
    fetchOnce();
    const t = setInterval(fetchOnce, 4000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [bookingId]);

  const driver = booking?.driver;
  const waiting = !driver;

  const callDriver = () => {
    if (driver?.phone) Linking.openURL(`tel:${driver.phone}`);
    else Alert.alert('Unavailable', 'Driver phone number is not available.');
  };

  const cancel = async () => {
    try {
      await bookingApi.cancel(bookingId);
      navigation.popToTop();
    } catch (e: any) {
      Alert.alert('Could not cancel', e.message);
    }
  };

  if (!booking) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapPlaceholder
        style={styles.map}
        markers={[
          { lat: 30.705, lng: 76.69 },
          { lat: 30.69, lng: 76.72 },
        ]}
        route={[
          { lat: 30.705, lng: 76.69 },
          { lat: 30.698, lng: 76.705 },
          { lat: 30.69, lng: 76.72 },
        ]}
      />
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Driver Arriving Screen" banner />
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <View style={styles.statusRow}>
          <Text style={typography.h3}>
            {waiting ? 'Looking for a driver…' : 'Your driver is coming..'}
          </Text>
          <View style={styles.eta}>
            {waiting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <View style={styles.etaDot} />
                <Text style={styles.etaText}>{booking.etaMinutes ?? 2} min</Text>
              </>
            )}
          </View>
        </View>

        {waiting && (
          <View style={styles.waitingCard}>
            <Text style={typography.bodyMuted}>
              We’ve sent your request to nearby drivers. This screen updates
              automatically when a driver accepts.
            </Text>
          </View>
        )}

        {driver && (
          <View style={styles.driverCard}>
            <Avatar uri={driver.photoUrl} />
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{driver.name}</Text>
              <Text style={typography.caption}>{driver.title}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={styles.ratingRow}>
                <Icon name="star" size={15} color={colors.star} />
                <Text style={styles.rating}>
                  {Number(driver.rating).toFixed(1)} ({driver.ratingCount})
                </Text>
              </View>
              <Text style={styles.code}>{driver.code}</Text>
            </View>
          </View>
        )}

        <View style={styles.metaRow}>
          <Text style={typography.title}>Distance</Text>
          <Text style={typography.title}>{booking.distanceKm ?? 0} Km</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={typography.title}>Total Payment</Text>
          <Text style={typography.title}>Rs {Number(booking.amount).toFixed(0)}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.cancelBtn} onPress={cancel}>
            <Text style={styles.cancelText}>Cancel {waiting ? 'Request' : 'Driver'}</Text>
          </Pressable>
          {!waiting && (
            <>
              <Pressable style={styles.iconBtn} onPress={callDriver}>
                <Icon name="phone" size={22} color={colors.white} />
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={() =>
                  navigation.navigate('Chat', { bookingId, peerName: driver?.name ?? 'Driver' })
                }
              >
                <Icon name="message-square" size={22} color={colors.white} />
              </Pressable>
            </>
          )}
        </View>

        {!waiting && (
          <Pressable style={styles.proceed} onPress={() => navigation.navigate('DriverLeaving', { bookingId })}>
            <Text style={styles.proceedText}>Trip completed? Proceed to payment →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { height: '52%' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  grabber: { alignSelf: 'center', width: 56, height: 5, borderRadius: 3, backgroundColor: colors.divider },
  waitingCard: { backgroundColor: colors.primarySofter, borderRadius: radius.lg, padding: spacing.lg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  etaDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.textMuted },
  etaText: { ...typography.body, color: colors.textSecondary },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...typography.label, color: colors.textPrimary },
  code: { ...typography.label, color: colors.textPrimary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cancelBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...typography.button, color: colors.primary },
  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceed: { alignItems: 'center', paddingVertical: spacing.sm },
  proceedText: { ...typography.caption, color: colors.primary },
});
