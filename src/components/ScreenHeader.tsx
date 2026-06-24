import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon } from './Icon';

interface ScreenHeaderProps {
  /** Centered title banner like the design's "ONE WAY SCREEN" labels. */
  title?: string;
  onBack?: () => void;
  banner?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, banner, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Icon name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.backBtn} />
      )}

      {title ? (
        banner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{title}</Text>
          </View>
        ) : (
          <Text style={[typography.h3, styles.plainTitle]}>{title}</Text>
        )
      ) : (
        <View style={styles.flex} />
      )}

      <View style={styles.backBtn}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  flex: { flex: 1 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  bannerText: {
    ...typography.label,
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  plainTitle: { flex: 1, textAlign: 'center' },
});
