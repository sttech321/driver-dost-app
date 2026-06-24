import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, GoogleSignInButton, Icon, Logo, Screen, TextField } from '@/components';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/context/AuthContext';
import { isGoogleConfigured } from '@/config/env';

type Props = NativeStackScreenProps<AuthStackParamList, 'Auth'>;
type Mode = 'login' | 'register';

export function AuthScreen({ navigation, route }: Props) {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'USER' | 'DRIVER'>('USER');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone || !password) {
      Alert.alert('Missing details', 'Please enter your phone number and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await authApi.login({ phone, password });
        await signIn(result);
      } else {
        // Register the account, then verify the phone via OTP (Screen 3).
        await authApi.register({
          phone,
          password,
          name: name || undefined,
          email: email || undefined,
          role,
        });
        await authApi.sendOtp(phone);
        navigation.navigate('PhoneVerification', { phone, mode: 'register' });
      }
    } catch (e: any) {
      Alert.alert(mode === 'login' ? 'Login failed' : 'Registration failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Blue header with logo */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8}>
          <Icon name="chevron-left" size={26} color={colors.white} />
        </Pressable>
        <Logo size={26} />
      </View>

      <Screen scroll style={styles.body}>
        {/* Tab toggle */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Login</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
              Register
            </Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          {mode === 'register' && (
            <>
              <Text style={styles.roleLabel}>I want to sign up as</Text>
              <View style={styles.roleRow}>
                {(['USER', 'DRIVER'] as const).map((r) => {
                  const active = role === r;
                  return (
                    <Pressable
                      key={r}
                      style={[styles.roleOption, active && styles.roleOptionActive]}
                      onPress={() => setRole(r)}
                    >
                      <View style={[styles.radio, active && styles.radioOn]}>
                        {active && <View style={styles.radioInner} />}
                      </View>
                      <Icon
                        name={r === 'USER' ? 'user' : 'smartphone'}
                        size={18}
                        color={active ? colors.primary : colors.textSecondary}
                      />
                      <Text style={[styles.roleText, active && styles.roleTextActive]}>
                        {r === 'USER' ? 'Rider' : 'Driver'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextField
                icon="user"
                placeholder="Your Name"
                value={name}
                onChangeText={setName}
              />
              <TextField
                icon="message-square"
                placeholder="Email (optional)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          )}

          <TextField
            icon="smartphone"
            placeholder="Enter your Phone No."
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextField
            icon="lock"
            placeholder="Enter your Password"
            value={password}
            onChangeText={setPassword}
            secure
          />

          {mode === 'login' && (
            <View style={styles.optionsRow}>
              <Pressable style={styles.checkboxRow} onPress={() => setStayLoggedIn((s) => !s)}>
                <View style={[styles.checkbox, stayLoggedIn && styles.checkboxOn]}>
                  {stayLoggedIn && <Icon name="check" size={14} color={colors.white} />}
                </View>
                <Text style={styles.optionText}>Stay Logged In</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>
            </View>
          )}

          <Button
            title={mode === 'login' ? 'Log In' : 'Register'}
            onPress={submit}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.divider} />
          </View>

          {isGoogleConfigured() ? (
            <GoogleSignInButton
              onSuccess={(result) => signIn(result)}
              onError={(msg) => Alert.alert('Google sign-in', msg)}
            />
          ) : (
            <>
              <Button
                title="Google"
                variant="outline"
                disabled
                leftIcon={<Icon name="google" size={20} color={colors.primary} />}
              />
              <Text style={styles.hint}>
                Add Firebase & Google client IDs to enable Google sign-in.
              </Text>
            </>
          )}

          <Text style={styles.terms}>
            By continuing to use the app, you agree to accept our:{'\n'}
            <Text style={styles.link}>Terms and Conditions</Text>
            {'\n'}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  header: {
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { position: 'absolute', left: spacing.xl, top: spacing.xxxl + spacing.lg },
  body: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    paddingTop: spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.title, color: colors.textPrimary },
  tabTextActive: { color: colors.white },
  form: { gap: spacing.md, paddingBottom: spacing.xxxl },
  roleLabel: { ...typography.label, color: colors.textSecondary },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  roleOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySofter },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  roleText: { ...typography.label, color: colors.textSecondary },
  roleTextActive: { color: colors.primary },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { ...typography.body, color: colors.textSecondary },
  forgot: { ...typography.label, color: colors.danger },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  divider: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { ...typography.label, color: colors.textPrimary },
  hint: { ...typography.caption, textAlign: 'center' },
  terms: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg, lineHeight: 22 },
  link: { color: colors.primary, fontWeight: '600' },
});
