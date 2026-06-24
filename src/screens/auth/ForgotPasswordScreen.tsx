import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { spacing, typography } from '@/theme';
import { Button, Screen, ScreenHeader, TextField } from '@/components';
import { authApi } from '@/api/auth.api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone || newPassword.length < 6) {
      Alert.alert('Check details', 'Enter your phone and a new password (min 6 chars).');
      return;
    }
    setLoading(true);
    try {
      // Send an OTP to verify ownership, then collect it on the OTP screen.
      await authApi.sendOtp(phone);
      navigation.navigate('PhoneVerification', { phone, mode: 'forgot', newPassword });
    } catch (e: any) {
      Alert.alert('Could not start reset', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader onBack={() => navigation.goBack()} title="Forgot Password" />
      <View style={styles.body}>
        <Text style={typography.bodyMuted}>
          Recover your password using your phone number. We’ll send you a one-time code to verify.
        </Text>
        <TextField
          icon="smartphone"
          placeholder="Enter your Phone No."
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextField
          icon="lock"
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secure
        />
        <Button title="Send Code" onPress={submit} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, marginTop: spacing.xl },
});
