import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface DateStripProps {
  /** index of the selected day within the generated range */
  selectedIndex: number;
  onSelect: (index: number, date: Date) => void;
  days?: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

// Horizontal day picker like "10 Mon … 16 Sun" in the designs.
export function DateStrip({ selectedIndex, onSelect, days = 7 }: DateStripProps) {
  const dates = useMemo(() => {
    const base = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [days]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {dates.map((d, i) => {
        const active = i === selectedIndex;
        return (
          <Pressable key={i} style={styles.day} onPress={() => onSelect(i, d)}>
            <Text style={[styles.num, active && styles.numActive]}>{d.getDate()}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {WEEKDAYS[d.getDay()]}
            </Text>
            {active && <View style={styles.dot} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.lg, paddingVertical: spacing.sm },
  day: { alignItems: 'center', minWidth: 40, gap: 2 },
  num: { ...typography.h3, color: colors.textMuted },
  numActive: { color: colors.textPrimary },
  label: { ...typography.caption, color: colors.textMuted },
  labelActive: { color: colors.textPrimary, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 2 },
  separator: { borderRadius: radius.sm },
});
