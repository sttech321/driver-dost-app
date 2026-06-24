import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { colors, spacing, typography, radius } from '@/theme';
import { Logo, SlideButton } from '@/components';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Illustration card */}
        <View style={styles.illustrationCard}>
          <Text style={styles.illustrationEmoji}>🚗👨‍👩‍👧‍👦</Text>
        </View>

        {/* Carousel dots */}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.content}>
          <Logo size={20} />
          <Text style={styles.heading}>
            Your Car,{'\n'}Your Schedule,{'\n'}
            <Text style={styles.headingBold}>Our Trusted Drivers</Text>
          </Text>
          <Text style={styles.subtitle}>
            Simplify your journey with the ease of a tap — unlocking the doors to
            seamless and efficient driver booking.
          </Text>
        </View>

        <View style={styles.footer}>
          <SlideButton label="Get Started" onComplete={() => navigation.navigate('Auth')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.welcomeBottom },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  illustrationCard: {
    backgroundColor: '#EEF2F7',
    borderRadius: radius.lg,
    height: 220,
    marginTop: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: { fontSize: 44 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
  },
  dot: { width: 24, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: colors.white, width: 30 },
  content: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  heading: { ...typography.display, color: colors.white, fontWeight: '400' },
  headingBold: { fontWeight: '800', color: colors.white },
  subtitle: { ...typography.body, color: 'rgba(255,255,255,0.85)', lineHeight: 24 },
  footer: { paddingBottom: spacing.lg },
});
