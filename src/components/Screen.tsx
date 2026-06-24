import React from 'react';
import { StyleSheet, View, ViewStyle, ScrollView } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  edges?: Edge[];
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark';
}

export function Screen({
  children,
  scroll,
  padded = true,
  style,
  edges = ['top', 'bottom'],
  backgroundColor = colors.background,
  statusBarStyle = 'dark',
}: ScreenProps) {
  const inner = (
    <View style={[padded && styles.padded, !scroll && styles.flex, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }]} edges={edges}>
      <StatusBar style={statusBarStyle} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.grow}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  padded: { paddingHorizontal: spacing.xl },
});
