import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, Icon, Screen } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/hooks/useLocation';

type Props = NativeStackScreenProps<AppStackParamList, 'LocationPermission'>;

export function LocationPermissionScreen(_props: Props) {
  const { markLocationGranted } = useAuth();
  const { requestPermission } = useLocation();
  const [loading, setLoading] = useState(false);

  const onAgree = async () => {
    setLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        // Persist for this user → navigator auto-swaps to the app and we
        // never ask again on future logins.
        await markLocationGranted();
      } else {
        Alert.alert(
          'Permission needed',
          'Please allow location access to continue with easy booking.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.pin}>
          <Icon name="map-pin" size={40} color={colors.white} />
        </View>

        <View style={styles.card}>
          <Text style={[typography.h3, styles.cardText]}>
            We need the location permission to pin point your current location for easy booking.
          </Text>
        </View>
        <View style={styles.subCard}>
          <Text style={styles.subText}>You need to grant this permission to continue</Text>
        </View>

        <Button title="I Agree" onPress={onAgree} loading={loading} style={styles.btn} />
      </View>

      <View style={styles.footer}>
        <Text style={[typography.label, { color: colors.primary }]}>Trusted By</Text>
        <Text style={[typography.h3, { color: colors.textMuted }]}>350+ Car Owners</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  pin: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  cardText: { textAlign: 'center', fontWeight: '600' },
  subCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  subText: { ...typography.caption, color: colors.textSecondary },
  btn: { width: '100%', marginTop: spacing.xl },
  footer: { alignItems: 'center', paddingBottom: spacing.xl, gap: 4 },
});
