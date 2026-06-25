import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Avatar, Button, Icon, MapPlaceholder, ScreenHeader, StarRating } from '@/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingApi } from '@/api/booking.api';
import { useRoute } from '@/hooks/useRoute';
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

  // Review state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    bookingApi.get(bookingId).then(setBooking).catch((e) => Alert.alert('Error', e.message));
  }, [bookingId]);

  const submitReview = async () => {
    if (rating < 1) {
      Alert.alert('Add a rating', 'Please tap the stars to rate your driver.');
      return;
    }
    setSubmittingReview(true);
    try {
      const { driver } = await bookingApi.review(bookingId, {
        rating,
        comment: comment.trim() || undefined,
      });
      // Reflect the driver's new aggregate rating immediately.
      setBooking((b) => (b ? { ...b, driver: b.driver ? { ...b.driver, ...driver } : driver } : b));
      setReviewDone(true);
    } catch (e: any) {
      Alert.alert('Could not submit review', e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

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

  const pickup =
    booking?.pickupLat != null && booking?.pickupLng != null
      ? { lat: booking.pickupLat, lng: booking.pickupLng }
      : null;
  const destination =
    booking?.destinationLat != null && booking?.destinationLng != null
      ? { lat: booking.destinationLat, lng: booking.destinationLng }
      : null;
  const mapRoute = useRoute(pickup, destination); // road-snapped

  if (!booking) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const driver = booking.driver;
  const mapMarkers = [
    ...(pickup ? [{ lat: pickup.lat, lng: pickup.lng, color: colors.primary }] : []),
    ...(destination ? [{ lat: destination.lat, lng: destination.lng, color: colors.danger }] : []),
  ];
  const mapRegion = pickup
    ? { latitude: pickup.lat, longitude: pickup.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : undefined;

  return (
    <View style={styles.root}>
      <MapPlaceholder style={styles.map} region={mapRegion} markers={mapMarkers} route={mapRoute} />
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Driver Leaving Screen" banner />
      </SafeAreaView>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grabber} />

        <Text style={typography.h3}>Your Trip Details</Text>
        <Pressable
          style={styles.tripCard}
          disabled={!driver}
          onPress={() => driver && navigation.navigate('DriverProfileView', { driverId: driver.id })}
        >
          <Avatar uri={driver?.photoUrl} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>{driver?.name ?? 'Driver'}</Text>
            <Text style={typography.caption}>{driver?.title ?? 'Master Driver'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={typography.caption}>Final cost</Text>
            <Text style={typography.h3}>Rs {Number(booking.amount).toFixed(2)}</Text>
          </View>
        </Pressable>

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

        {reviewDone ? (
          <View style={styles.reviewDone}>
            <Icon name="check" size={20} color={colors.success} />
            <Text style={[typography.body, { color: colors.success, flex: 1 }]}>
              Thanks for your feedback! {driver?.name}’s rating is now{' '}
              {driver ? Number(driver.rating).toFixed(1) : ''} ({driver?.ratingCount}).
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.stars}>
              <StarRating value={rating} onChange={setRating} size={30} />
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment (optional)…"
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.commentBox}
            />
            <Button
              title="Submit Review"
              variant="outline"
              loading={submittingReview}
              onPress={submitReview}
              style={{ marginBottom: spacing.xxl }}
            />
          </>
        )}
      </ScrollView>
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
  },
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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
  stars: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  commentBox: {
    ...typography.body,
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radius.lg,
    backgroundColor: colors.field,
    padding: spacing.md,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  reviewDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
    marginBottom: spacing.xxl,
  },
});
