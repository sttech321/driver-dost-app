import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon } from './Icon';
import { Driver } from '@/api/types';

interface DriverCardProps {
  driver: Driver;
  onPress?: () => void;
  compact?: boolean;
}

export function DriverCard({ driver, onPress, compact }: DriverCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, compact && styles.compact]}
    >
      <Avatar uri={driver.photoUrl} />
      <View style={styles.info}>
        <Text style={typography.title} numberOfLines={1}>
          {driver.name}
        </Text>
        <View style={styles.ratingRow}>
          <Icon name="star" size={15} color={colors.star} />
          <Text style={styles.rating}>
            {Number(driver.rating).toFixed(1)} ({formatCount(driver.ratingCount)})
          </Text>
        </View>
      </View>
      {!compact && <Icon name="chevron-right" size={22} color={colors.primary} />}
    </Pressable>
  );
}

export function Avatar({ uri, size = 56 }: { uri?: string | null; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
}

function formatCount(n: number) {
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n);
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    gap: spacing.md,
  },
  compact: { width: 220 },
  avatar: { backgroundColor: '#D7DDE6' },
  info: { flex: 1, gap: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...typography.caption, color: colors.textSecondary },
});
