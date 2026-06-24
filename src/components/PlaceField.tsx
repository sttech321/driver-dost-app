import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon } from './Icon';

interface PlaceFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  onUseCurrent?: () => void;
}

// Pickup / Destination input rows used on One Way & Outstation screens.
export function PlaceField({ placeholder, value, onChangeText, onUseCurrent }: PlaceFieldProps) {
  return (
    <View style={styles.row}>
      <View style={styles.leadIcon}>
        <Icon name="crosshair" size={20} color={colors.primary} />
      </View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        style={[typography.body, styles.input]}
      />
      {onUseCurrent && (
        <Pressable onPress={onUseCurrent} hitSlop={8} style={styles.targetBtn}>
          <View style={styles.dot} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.field,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 58,
    gap: spacing.md,
  },
  leadIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 0 },
  targetBtn: { padding: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.textPrimary },
});
