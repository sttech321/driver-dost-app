import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, TabParamList } from '@/navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { Screen, Icon, IconName, DriverCard, Avatar, LocationPickerModal } from '@/components';
import { driverApi } from '@/api/driver.api';
import { Driver } from '@/api/types';
import { useAppLocation } from '@/context/LocationContext';
import { useNotifications } from '@/context/NotificationContext';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

const QUICK_ACTIONS: { key: string; label: string; icon: IconName; route: keyof AppStackParamList; params?: any }[] = [
  { key: 'one-way', label: 'One Way', icon: 'arrow-up', route: 'OneWay' },
  { key: 'hourly', label: 'Hourly', icon: 'clock', route: 'Hourly' },
  { key: 'round', label: 'Round Trip', icon: 'rotate-cw', route: 'Outstation' },
  { key: 'outstation', label: 'Outstation', icon: 'mountain', route: 'Outstation' },
];

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { location } = useAppLocation();
  const { unread } = useNotifications();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Recommended drivers near the user's chosen location.
  const loadDrivers = useCallback(async () => {
    try {
      const data = await driverApi.recommended({
        lat: location.lat,
        lng: location.lng,
        limit: 10,
      });
      setDrivers(data);
    } catch {
      /* surfaced as empty list */
    }
  }, [location.lat, location.lng]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  return (
    <Screen scroll padded={false}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>DASHBOARD</Text>
      </View>

      <View style={styles.padded}>
        {/* Location + notifications */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>Your Location</Text>
            <Pressable style={styles.locationRow} onPress={() => setShowLocationPicker(true)}>
              <Icon name="map-pin" size={18} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {location.label}
              </Text>
              <Icon name="chevron-down" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <Pressable style={styles.bell} onPress={() => navigation.navigate('Notifications')}>
            <Icon name="bell" size={22} color={colors.white} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={typography.title}>Quick Actions</Text>
          <Icon name="more-horizontal" size={22} color={colors.textMuted} />
        </View>
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.key}
              style={styles.action}
              onPress={() => navigation.navigate(a.route as any, a.params)}
            >
              <View style={styles.actionTile}>
                <Icon name={a.icon} size={26} color={colors.textPrimary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Hire banner */}
        <View style={styles.hireBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hireSub}>Hire a Verified Driver</Text>
            <Text style={styles.hireTitle}>For Your Own Car</Text>
          </View>
          <Text style={styles.hireEmoji}>🧑‍✈️</Text>
        </View>

        {/* Recommended Drivers — fading carousel */}
        <View style={styles.sectionHeader}>
          <Text style={typography.h3}>Recommended Drivers</Text>
          <Pressable style={styles.viewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        </View>
        <FlatList
          horizontal
          data={drivers}
          keyExtractor={(d) => d.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.xl }}
          ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
          renderItem={({ item, index }) => (
            <View style={{ opacity: 1 - Math.min(index * 0.12, 0.5) }}>
              <DriverCard
                driver={item}
                compact
                onPress={() => navigation.navigate('DriverProfileView', { driverId: item.id })}
              />
            </View>
          )}
          ListEmptyComponent={<Text style={typography.caption}>No drivers nearby right now.</Text>}
        />

        {/* Promotions */}
        <View style={styles.promo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Stay updated on promotions and discounts!</Text>
            <Pressable style={styles.viewAll}>
              <Text style={styles.viewAllText}>Discover More</Text>
              <Icon name="chevron-right" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.hireEmoji}>🚙</Text>
        </View>
      </View>

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.primarySoft, paddingVertical: spacing.md, alignItems: 'center' },
  bannerTitle: { ...typography.label, color: colors.primary, letterSpacing: 1 },
  padded: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  locationText: { ...typography.h3, flexShrink: 1 },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { alignItems: 'center', gap: spacing.sm, width: '23%' },
  actionTile: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  hireBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  hireSub: { ...typography.h3, color: colors.textSecondary, fontWeight: '600' },
  hireTitle: { ...typography.h2, color: colors.primary },
  hireEmoji: { fontSize: 48 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { ...typography.label, color: colors.primary },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    ...shadow.soft,
  },
  promoTitle: { ...typography.h3, color: colors.textSecondary, marginBottom: spacing.sm },
});
