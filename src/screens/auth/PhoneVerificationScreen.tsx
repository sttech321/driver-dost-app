import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, Icon, Screen, ScreenHeader } from '@/components';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneVerification'>;
const OTP_LENGTH = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PhoneVerificationScreen({ navigation, route }: Props) {
  const { phone, mode, newPassword } = route.params;
  const { signIn } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const onKey = (key: string) => {
    if (key === 'del') return setCode((c) => c.slice(0, -1));
    if (key === '' || code.length >= OTP_LENGTH) return;
    setCode((c) => (c + key).slice(0, OTP_LENGTH));
  };

  const verify = async () => {
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete OTP', `Please enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'forgot') {
        if (!newPassword) throw new Error('Missing new password');
        const result = await authApi.forgotPassword({ phone, code, newPassword });
        await signIn(result);
      } else {
        const result = await authApi.verifyOtp(phone, code);
        await signIn(result);
      }
    } catch (e: any) {
      Alert.alert('Verification failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const res = await authApi.sendOtp(phone);
      Alert.alert('OTP sent', res.devCode ? `Dev code: ${res.devCode}` : 'Check your messages.');
    } catch (e: any) {
      Alert.alert('Could not resend', e.message);
    }
  };

  return (
    <Screen>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <View style={styles.head}>
        <Text style={typography.h1}>Phone Verification</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.sm }]}>
          Enter your OTP code here
        </Text>
      </View>

      <View style={styles.otpRow}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const char = code[i];
          return (
            <View key={i} style={styles.otpCell}>
              <Text style={styles.otpDigit}>{char ?? ''}</Text>
              <View style={styles.otpUnderline} />
            </View>
          );
        })}
      </View>

      <Button title="Verify Now" onPress={verify} loading={loading} style={styles.verifyBtn} />

      <Pressable onPress={resend} style={styles.resend}>
        <Text style={styles.resendText}>Didn’t receive the code? Resend</Text>
      </Pressable>

      {/* Custom numeric keypad, matching the design */}
      <View style={styles.keypad}>
        {KEYS.map((key, idx) => (
          <Pressable
            key={idx}
            style={[styles.key, key === '' && styles.keyDisabled]}
            onPress={() => onKey(key)}
            disabled={key === ''}
          >
            {key === 'del' ? (
              <Icon name="chevron-left" size={24} color={colors.textPrimary} />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', marginTop: spacing.xxl },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xxxl,
  },
  otpCell: { alignItems: 'center', width: 42 },
  otpDigit: { fontSize: 30, fontWeight: '700', color: colors.textPrimary, height: 42 },
  otpUnderline: { width: 30, height: 2, backgroundColor: colors.fieldBorder },
  verifyBtn: { marginTop: spacing.xxxl },
  resend: { alignItems: 'center', marginTop: spacing.lg },
  resendText: { ...typography.label, color: colors.primary },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  key: {
    width: '33.33%',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: { opacity: 0 },
  keyText: { fontSize: 26, fontWeight: '500', color: colors.textPrimary },
});
