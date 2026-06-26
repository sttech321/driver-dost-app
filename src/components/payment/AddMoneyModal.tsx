import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { userApi, WalletOptions } from '@/api/user.api';
import { useAuth } from '@/context/AuthContext';
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment';
import { RazorpayResult } from '@/components/razorpayTypes';

interface Props {
  visible: boolean;
  /** Pre-fills a suggested custom amount (e.g. the wallet shortfall, rounded up). */
  suggested?: number;
  onClose: () => void;
  /** Called after a successful top-up so the parent can refresh the balance. */
  onToppedUp: () => Promise<void> | void;
}

/** Bottom-sheet to add money to the wallet via Razorpay — packages or a custom amount. */
export function AddMoneyModal({ visible, suggested, onClose, onToppedUp }: Props) {
  const { user } = useAuth();
  const rzp = useRazorpayPayment();
  const [options, setOptions] = useState<WalletOptions | null>(null);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Holds a successful Razorpay result whose server verification hasn't completed
  // yet — lets us retry verification of the SAME order instead of charging again.
  const [pendingResult, setPendingResult] = useState<RazorpayResult | null>(null);

  // Keep the latest suggested value without re-firing the open effect on parent re-renders.
  const suggestedRef = useRef(suggested);
  suggestedRef.current = suggested;

  // Reset + load packages each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setError(null);
    setBusy(false);
    setPendingResult(null);
    setSelectedPkg(null);
    const s = suggestedRef.current;
    setCustomAmount(s && s > 0 ? String(Math.ceil(s)) : '');
    setLoadingOpts(true);
    userApi
      .walletPackages()
      .then(setOptions)
      .catch(() => setError('Could not load packages. Enter a custom amount.'))
      .finally(() => setLoadingOpts(false));
  }, [visible]);

  const min = options?.manual.min ?? 10;
  const max = options?.manual.max ?? 100000;
  const pkg = options?.packages.find((p) => p.id === selectedPkg) ?? null;
  const customNum = Math.round(Number(customAmount));
  const customValid = customAmount !== '' && Number.isFinite(customNum) && customNum >= min && customNum <= max;
  const payRupees = pkg ? pkg.pay : customValid ? customNum : 0;
  const creditRupees = pkg ? pkg.credit : customValid ? customNum : 0;
  const valid = !!pkg || customValid;

  const pickPackage = (id: string) => {
    setSelectedPkg(id);
    setCustomAmount('');
    setError(null);
  };
  const onCustomChange = (t: string) => {
    setCustomAmount(t.replace(/[^0-9]/g, ''));
    setSelectedPkg(null);
    setError(null);
  };

  // Retry only the verification of an already-paid order (idempotent server-side).
  const retryVerify = async (result: RazorpayResult) => {
    setBusy(true);
    setError(null);
    try {
      await userApi.walletTopUpVerify(result);
      setPendingResult(null);
      await onToppedUp();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not confirm payment. Tap “Retry verification”.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    // A payment already succeeded but verification failed → retry the SAME order.
    if (pendingResult) return retryVerify(pendingResult);

    if (!valid) {
      setError(`Pick a package or enter Rs ${min}–${max}.`);
      return;
    }
    const body = pkg ? { packageId: pkg.id } : { amount: payRupees };
    setBusy(true);
    setError(null);
    let paidResult: RazorpayResult | null = null;
    try {
      const res = await userApi.walletTopUpOrder(body);

      // Gateway configured → pay via Razorpay, then verify + credit server-side.
      if (res.needsCheckout && res.order) {
        const outcome = await rzp.open({
          keyId: res.order.keyId,
          orderId: res.order.id,
          amount: res.order.amount,
          currency: res.order.currency,
          name: 'Driver Dost Wallet',
          description: `Add Rs ${payRupees} to wallet`,
          prefill: { name: user?.name || undefined, contact: user?.phone || undefined },
        });
        if (outcome.status === 'cancelled') {
          setError('Payment cancelled — no money was added.');
          return;
        }
        if (outcome.status === 'failed') {
          setError(outcome.message);
          return;
        }
        // Payment captured — stash it so a verify failure can retry the SAME order
        // (no second charge) instead of starting a fresh top-up.
        paidResult = outcome.result;
        setPendingResult(outcome.result);
        await userApi.walletTopUpVerify(outcome.result);
        setPendingResult(null);
      }
      // Else: dev-mock — the server already credited the wallet.

      await onToppedUp();
      onClose();
    } catch (e: any) {
      setError(
        paidResult
          ? 'Payment received, but confirming it failed. Tap “Retry verification”.'
          : e?.message || 'Top-up failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={typography.h3}>Add Money to Wallet</Text>
                <Pressable onPress={onClose} hitSlop={8} disabled={busy}>
                  <Icon name="chevron-down" size={24} color={colors.textMuted} />
                </Pressable>
              </View>

              {loadingOpts ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <ScrollView
                  style={styles.body}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {options?.packages?.length ? (
                    <>
                      <Text style={typography.label}>Choose a package</Text>
                      <View style={styles.pkgGrid}>
                        {options.packages.map((p) => {
                          const active = selectedPkg === p.id;
                          return (
                            <Pressable
                              key={p.id}
                              style={[styles.pkgCard, active && styles.pkgCardActive]}
                              onPress={() => pickPackage(p.id)}
                            >
                              <Text style={styles.pkgPay}>₹{p.pay}</Text>
                              {p.bonus > 0 ? (
                                <Text style={styles.pkgBonus}>+₹{p.bonus} bonus</Text>
                              ) : (
                                <Text style={styles.pkgPlain}>No bonus</Text>
                              )}
                              <Text style={styles.pkgGet}>Get ₹{p.credit}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  ) : null}

                  <Text style={[typography.label, { marginTop: spacing.md }]}>Or enter an amount</Text>
                  <TextInput
                    value={customAmount}
                    onChangeText={onCustomChange}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    placeholder={`Custom amount (₹${min}–₹${max})`}
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, customAmount !== '' && !customValid && styles.inputError]}
                  />

                  {pkg && pkg.bonus > 0 ? (
                    <Text style={styles.creditHint}>
                      You’ll get ₹{creditRupees} in your wallet (incl. ₹{pkg.bonus} bonus).
                    </Text>
                  ) : null}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </ScrollView>
              )}

              <Button
                title={pendingResult ? 'Retry verification' : valid ? `Add Rs ${payRupees}` : 'Add Money'}
                onPress={submit}
                loading={busy}
                disabled={(pendingResult ? false : !valid) || loadingOpts}
                style={{ marginTop: spacing.md }}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheetWrap: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheet: { padding: spacing.xl, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loadingRow: { paddingVertical: spacing.xxl, alignItems: 'center' },
  body: { maxHeight: 360 },
  pkgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  pkgCard: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    borderRadius: radius.lg,
    backgroundColor: colors.field,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  pkgCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySofter },
  pkgPay: { ...typography.h3 },
  pkgBonus: { ...typography.caption, color: colors.success, fontWeight: '700' },
  pkgPlain: { ...typography.caption, color: colors.textMuted },
  pkgGet: { ...typography.caption, color: colors.textSecondary },
  input: {
    ...typography.body,
    height: 52,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radius.lg,
    backgroundColor: colors.field,
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    marginTop: spacing.sm,
  },
  inputError: { borderColor: colors.danger },
  creditHint: { ...typography.caption, color: colors.success, marginTop: spacing.sm },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
