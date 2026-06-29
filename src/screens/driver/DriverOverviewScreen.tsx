import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverStackParamList, DriverTabParamList } from '@/navigation/types';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { Avatar, Icon } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { driverPortalApi } from '@/api/driverPortal.api';
import { Booking, Driver } from '@/api/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<DriverTabParamList, 'Overview'>,
  NativeStackNavigationProp<DriverStackParamList>
>;

// Driver's joined date → "1y 3m" tenure (exact calendar months).
function tenure(createdAt?: string): string {
  if (!createdAt) return '—';
  const start = new Date(createdAt);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y > 0 ? `${y}y ${m}m` : `${m}m`;
}

// Per-trip fare — matches the `Rs <int>` style used across the other driver screens.
const fare = (n: number) => `Rs ${Number(n || 0).toFixed(0)}`;
// Prominent total — rounded + thousands-grouped for readability.
const money = (n: number) => `Rs ${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export function DriverOverviewScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { unread } = useNotifications();
  const [profile, setProfile] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Booking[]>([]);

  const load = useCallback(async () => {
    try {
      const [me, bookings] = await Promise.all([
        driverPortalApi.me(),
        driverPortalApi.myBookings(),
      ]);
      setProfile(me);
      setTrips(bookings);
    } catch {
      /* surfaced as empty state */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const completed = trips.filter((b) => b.status === 'COMPLETED');
  const earnings = completed.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  // "Last Trips" = finished trips only (consistent with the earnings total).
  const recent = completed.slice(0, 5);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Text style={typography.h2}>Overview</Text>
          <Pressable style={styles.bell} onPress={() => navigation.navigate('Notifications')}>
            <Icon name="bell" size={22} color={colors.white} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Profile + Earnings | Stats + Ratings (side by side) */}
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.halfCard]}>
            <Avatar uri={profile?.photoUrl} size={56} />
            <Text style={[typography.title, { marginTop: spacing.sm }]} numberOfLines={1}>
              {profile?.name || user?.name || 'Driver'}
            </Text>
            <Text style={typography.caption}>Total earnings</Text>
            <Text style={styles.earnings} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {money(earnings)}
            </Text>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.ratingRow}>
              <Icon name="star" size={20} color={colors.star} />
              <Text style={typography.h2}>{profile ? Number(profile.rating).toFixed(1) : '—'}</Text>
            </View>
            <Text style={typography.caption}>{profile?.ratingCount ?? 0} reviews</Text>
            <View style={styles.tenureWrap}>
              <Text style={typography.caption}>With Driver Dost</Text>
              <Text style={typography.title}>{tenure(profile?.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Last Trips */}
        <Text style={[typography.h3, { marginTop: spacing.lg }]}>Last Trips</Text>
        <View style={[styles.card, { marginTop: spacing.sm, padding: 0 }]}>
          {recent.length === 0 ? (
            <Text style={[typography.caption, { padding: spacing.lg }]}>No trips yet.</Text>
          ) : (
            recent.map((b, i) => (
              <Pressable
                key={b.id}
                style={[styles.tripRow, i > 0 && styles.tripDivider]}
                onPress={() => navigation.navigate('DriverTripDetail', { bookingId: b.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={typography.title} numberOfLines={1}>
                    {b.destinationLabel || b.destinationAddress || b.pickupAddress || 'Trip'}
                  </Text>
                  <View style={styles.metaRow}>
                    {b.distanceKm != null && (
                      <Text style={typography.caption}>{Number(b.distanceKm).toFixed(1)} km</Text>
                    )}
                    {/* Passenger count: no per-booking field in the data model yet — shown as 1. */}
                    <View style={styles.paxRow}>
                      <Icon name="user" size={12} color={colors.textMuted} />
                      <Text style={typography.caption}>1</Text>
                    </View>
                  </View>
                </View>
                <Text style={[typography.title, { color: colors.primary }]}>{fare(Number(b.amount || 0))}</Text>
                <Icon name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  bell: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  // paddingBottom clears the 64px tab bar (+ home-indicator inset) so the last trip isn't hidden.
  body: { padding: spacing.xl, paddingTop: spacing.md, paddingBottom: 96, gap: spacing.sm },
  cardsRow: { flexDirection: 'row', gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  halfCard: { flex: 1, minHeight: 150 },
  // No fixed lineHeight: lets adjustsFontSizeToFit stay vertically centered when it shrinks.
  earnings: { fontSize: 22, fontWeight: '700', color: colors.primary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tenureWrap: { marginTop: spacing.md },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  tripDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2 },
  paxRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
