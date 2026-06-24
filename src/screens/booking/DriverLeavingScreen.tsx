import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Avatar, Button, Icon, MapPlaceholder, ScreenHeader } from '@/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingApi } from '@/api/booking.api';
import { Booking, PaymentMethod } from '@/api/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DriverLeaving'>;

const METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'CREDIT_CARD', label: 'Credit Card' },
  { key: 'UPI', label: 'UPI' },
  { key: 'CASH', label: 'Cash' },
  { key: 'WALLET', label: 'Wallet' },
];

export function DriverLeavingScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    bookingApi.get(bookingId).then(setBooking).catch((e) => Alert.alert('Error', e.message));
  }, [bookingId]);

  const pay = async () => {
    setPaying(true);
    try {
      await bookingApi.pay(bookingId, method);
      Alert.alert('Payment successful', 'Thanks for riding with Driver Dost!', [
        { text: 'Done', onPress: () => navigation.popToTop() },
      ]);
    } catch (e: any) {
      Alert.alert('Payment failed', e.message);
    } finally {
      setPaying(false);
    }
  };

  if (!booking) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const driver = booking.driver;

  return (
    <View style={styles.root}>
      <MapPlaceholder
        style={styles.map}
        markers={[{ lat: 30.705, lng: 76.69 }]}
        route={[
          { lat: 30.705, lng: 76.69 },
          { lat: 30.71, lng: 76.74 },
        ]}
      />
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Driver Leaving Screen" banner />
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <Text style={typography.h3}>Your Trip Details</Text>
        <View style={styles.tripCard}>
          <Avatar uri={driver?.photoUrl} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>{driver?.name ?? 'Driver'}</Text>
            <Text style={typography.caption}>{driver?.title ?? 'Master Driver'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={typography.caption}>Final cost</Text>
            <Text style={typography.h3}>Rs {Number(booking.amount).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={[typography.h3, { marginTop: spacing.sm }]}>Payment Methods</Text>
        <Text style={typography.caption}>Card Details</Text>
        <View style={styles.methods}>
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <Pressable key={m.key} style={styles.method} onPress={() => setMethod(m.key)}>
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <View style={styles.radioInner} />}
                </View>
                <Text style={typography.body}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button title="Pay Now" onPress={pay} loading={paying} />

        <Text style={[typography.h2, { marginTop: spacing.lg }]}>How Was Your Chauffeur?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Icon key={s} name="star" size={26} color={s <= 4 ? colors.star : colors.divider} />
          ))}
        </View>
        <Text style={[typography.bodyMuted, { marginBottom: spacing.xxl }]}>
          Share quick feedback so we can keep matching you with great drivers.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { height: '32%' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  grabber: { alignSelf: 'center', width: 56, height: 5, borderRadius: 3, backgroundColor: colors.divider },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginVertical: spacing.sm },
  method: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  stars: { flexDirection: 'row', gap: spacing.sm },
});
