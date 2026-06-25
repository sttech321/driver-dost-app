import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { Icon } from './Icon';

interface StarRatingProps {
  value: number;
  /** If provided, stars are tappable to set the rating. */
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 28 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <Icon name="star" size={size} color={filled ? colors.star : colors.divider} />
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} style={styles.star}>
            {star}
          </Pressable>
        ) : (
          <View key={n} style={styles.star}>
            {star}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  star: { padding: 1 },
});
