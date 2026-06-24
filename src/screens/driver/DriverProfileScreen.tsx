import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Avatar, Icon, Button } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { driverPortalApi } from '@/api/driverPortal.api';
import { Driver } from '@/api/types';

export function DriverProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Driver | null>(null);

  useEffect(() => {
    driverPortalApi.me().then(setProfile).catch(() => {});
  }, []);

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Avatar uri={profile?.photoUrl} size={72} />
        <Text style={[typography.h2, { marginTop: spacing.md }]}>
          {profile?.name || user?.name || 'Driver'}
        </Text>
        <View style={styles.badge}>
          <Icon name="check" size={14} color={colors.white} />
          <Text style={styles.badgeText}>{profile?.title || 'Verified Driver'}</Text>
        </View>
        <Text style={typography.bodyMuted}>{user?.phone}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={typography.h3}>{profile?.code ?? '—'}</Text>
          <Text style={typography.caption}>Driver ID</Text>
        </View>
        <View style={styles.stat}>
          <View style={styles.ratingRow}>
            <Icon name="star" size={16} color={colors.star} />
            <Text style={typography.h3}>{profile ? Number(profile.rating).toFixed(1) : '—'}</Text>
          </View>
          <Text style={typography.caption}>{profile?.ratingCount ?? 0} ratings</Text>
        </View>
        <View style={styles.stat}>
          <Text style={typography.h3}>{profile?.isAvailable ? 'Online' : 'Off'}</Text>
          <Text style={typography.caption}>Status</Text>
        </View>
      </View>

      <Button
        title="Sign Out"
        variant="ghost"
        leftIcon={<Icon name="log-out" size={20} color={colors.primary} />}
        onPress={signOut}
        style={{ marginTop: spacing.xxl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', paddingTop: spacing.xl, gap: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginVertical: spacing.xs,
  },
  badgeText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  stat: { alignItems: 'center', gap: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
