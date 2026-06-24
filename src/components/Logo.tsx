import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import { Icon } from './Icon';

interface LogoProps {
  color?: string;
  size?: number;
}

// "Driver Dost" wordmark with the magnifier-D motif from the designs.
export function Logo({ color = colors.white, size = 22 }: LogoProps) {
  return (
    <View style={styles.row}>
      <Icon name="search" size={size + 6} color={color} />
      <Text style={[styles.text, { color, fontSize: size }]}>
        Driver <Text style={styles.bold}>Dost</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontWeight: '500' },
  bold: { fontWeight: '800' },
});
