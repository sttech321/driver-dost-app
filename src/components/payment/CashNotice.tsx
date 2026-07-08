import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon } from '../Icon';

/** Shown when Cash is selected — no inputs, the user just proceeds. */
export function CashNotice() {
  return (
    <View style={styles.box}>
      <Icon name="check" size={20} color={colors.success} />
      <Text style={[typography.body, { flex: 1 }]}>
        You will pay the driver in cash after the ride.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
