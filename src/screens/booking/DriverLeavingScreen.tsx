import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Avatar, Button, Icon, MapPlaceholder, ScreenHeader, StarRating } from '@/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingApi } from '@/api/booking.api';
import { useRoute } from '@/hooks/useRoute';
import { useAuth } from '@/context/AuthContext';
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment';
import { AddMoneyModal, AnimatedReveal, CashNotice, WalletPanel } from '@/components/payment';
import { Booking, PaymentMethod } from '@/api/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DriverLeaving'>;

const METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'CREDIT_CARD', label: 'Credit Card' },
  { key: 'UPI', label: 'UPI' },
  { key: 'CASH', label: 'Cash' },
  { key: 'WALLET', label: 'Wallet' },
];

const methodLabel = (m: PaymentMethod): string => METHODS.find((x) => x.key === m)?.label ?? m;

// Enable smooth height transitions for the method-specific forms on Android.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function DriverLeavingScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const { user, refreshUser } = useAuth();
  const rzp = useRazorpayPayment();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payNote, setPayNote] = useState<string | null>(null);

  // Wallet "Add Money" sheet visibility (Card/UPI details are collected by Razorpay).
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);

  // Review state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    bookingApi
      .get(bookingId)
      .then(setBooking)
      .catch((e) => setLoadError(e?.message || 'Could not load this trip.'));
  }, [bookingId]);

  const submitReview = async () => {
    setReviewError(null);
    if (rating < 1) {
      setReviewError('Please tap the stars to rate your driver.');
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
      setReviewError(e?.message || 'Could not submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Switch method with a smooth transition (height on native, fade via key on web).
  const selectMethod = (m: PaymentMethod) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setMethod(m);
    setPayError(null);
  };

  const pay = async () => {
    setPaying(true);
    setPayError(null);
    setPayNote(null);
    try {
      // Card/UPI details are validated client-side and entered into the gateway's
      // own secure checkout (Razorpay) — we never POST raw card data to our API.
      const res = await bookingApi.pay(bookingId, method);

      // Online (Card/UPI) with a real gateway → open Razorpay checkout, verify.
      // Web uses checkout.js; native (iOS/Android) uses the react-native-razorpay
      // SDK — Metro resolves the right razorpay module per platform.
      if (res.needsCheckout && res.order) {
        const outcome = await rzp.open({
          keyId: res.order.keyId,
          orderId: res.order.id,
          amount: res.order.amount,
          currency: res.order.currency,
          prefill: { name: user?.name || undefined, contact: user?.phone || undefined },
        });
        if (outcome.status === 'cancelled') {
          setPayError('Payment cancelled. You can try again.');
          return;
        }
        if (outcome.status === 'failed') {
          setPayError(outcome.message);
          return;
        }
        const verified = await bookingApi.verifyPayment(bookingId, outcome.result);
        setBooking(verified.booking);
      } else {
        // Cash / Wallet / dev-mock — payment is already recorded server-side.
        setBooking(res.booking);
        if (res.mock) {
          setPayNote('Demo mode: no payment gateway configured, so this was marked paid without a real charge.');
        }
      }

      setPaid(true);
      // Wallet balance may have changed (deduction) — refresh the cached user.
      refreshUser();
    } catch (e: any) {
      setPayError(e?.message || 'Payment failed. Please try again.');
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
        {loadError ? (
          <>
            <Icon name="alert-circle" size={28} color={colors.danger} />
            <Text style={[typography.body, { color: colors.danger, textAlign: 'center', marginTop: spacing.sm }]}>
              {loadError}
            </Text>
            <Button title="Go Back" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }} />
          </>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    );
  }

  const driver = booking.driver;
  const isPaid = paid || booking.paymentStatus === 'PAID';

  // Payment gating: only Wallet needs a balance check. Cash proceeds directly;
  // Card/UPI are validated inside the Razorpay portal, so Pay is always enabled.
  const amount = Number(booking.amount);
  const walletBalance = Number(user?.walletBalance ?? 0);
  const walletShortfall = Math.max(0, amount - walletBalance);
  const canPay = method === 'WALLET' ? walletBalance >= amount : true;

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
        keyboardShouldPersistTaps="handled"
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

        {isPaid ? (
          <View style={styles.paidBox}>
            <View style={styles.paidRow}>
              <Icon name="check" size={22} color={colors.success} />
              <Text style={[typography.title, { color: colors.success, flex: 1 }]}>
                Payment successful
              </Text>
            </View>
            <Text style={typography.caption}>
              Rs {Number(booking.amount).toFixed(2)} paid
              {booking.paymentMethod ? ` via ${methodLabel(booking.paymentMethod)}` : ''}.
            </Text>
            {payNote ? <Text style={[typography.caption, { color: colors.warning }]}>{payNote}</Text> : null}
            <Button title="Done" onPress={() => navigation.popToTop()} style={{ marginTop: spacing.sm }} />
          </View>
        ) : (
          <>
            <Text style={typography.caption}>Choose how you’d like to pay</Text>
            <View style={styles.methods}>
              {METHODS.map((m) => {
                const active = method === m.key;
                return (
                  <Pressable
                    key={m.key}
                    style={({ pressed }) => [styles.method, pressed && { opacity: 0.6 }]}
                    hitSlop={8}
                    onPress={() => selectMethod(m.key)}
                  >
                    <View style={[styles.radio, active && styles.radioOn]}>
                      {active && <View style={styles.radioInner} />}
                    </View>
                    <Text style={typography.body}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Only the selected method's section is shown; remounts on switch to animate.
                Card/UPI details are collected securely by the Razorpay portal. */}
            <AnimatedReveal key={method} style={styles.methodPanel}>
              {(method === 'CREDIT_CARD' || method === 'UPI') && (
                <View style={styles.gatewayNote}>
                  <Icon name="lock" size={18} color={colors.primary} />
                  <Text style={[typography.caption, { flex: 1 }]}>
                    You’ll complete your {methodLabel(method)} payment securely via Razorpay.
                  </Text>
                </View>
              )}
              {method === 'CASH' && <CashNotice />}
              {method === 'WALLET' && (
                <WalletPanel
                  balance={walletBalance}
                  amount={amount}
                  onAddMoney={() => setAddMoneyOpen(true)}
                />
              )}
            </AnimatedReveal>
          </>
        )}

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
            {reviewError ? (
              <View style={styles.errorRow}>
                <Icon name="alert-circle" size={16} color={colors.danger} />
                <Text style={[typography.caption, { color: colors.danger, flex: 1 }]}>{reviewError}</Text>
              </View>
            ) : null}
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

      {/* Pay Now stays pinned + clearly visible while the trip is unpaid. */}
      {!isPaid && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {payError ? (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={16} color={colors.danger} />
              <Text style={[typography.caption, { color: colors.danger, flex: 1 }]}>{payError}</Text>
            </View>
          ) : method === 'WALLET' && !canPay ? (
            <Text style={[typography.caption, { color: colors.warning }]}>
              Add money to enable wallet payment.
            </Text>
          ) : null}
          <Button
            title={`Pay Rs ${amount.toFixed(2)}`}
            onPress={pay}
            loading={paying}
            disabled={!canPay}
          />
        </SafeAreaView>
      )}

      <AddMoneyModal
        visible={addMoneyOpen}
        suggested={walletShortfall}
        onClose={() => setAddMoneyOpen(false)}
        onToppedUp={refreshUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
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
  method: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  methodPanel: { marginBottom: spacing.sm },
  gatewayNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
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
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  paidBox: {
    gap: spacing.xs,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
