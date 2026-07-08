import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Button } from '../Button';
import { Icon } from '../Icon';

interface Props {
  balance: number;
  amount: number;
  onAddMoney: () => void;
}

/**
 * Wallet summary. Shows a deduction confirmation when the balance covers the
 * trip, or a shortfall breakdown + "Add Money" button when it doesn't.
 */
export function WalletPanel({ balance, amount, onAddMoney }: Props) {
  const sufficient = balance >= amount;
  const shortfall = Math.max(0, amount - balance);

  return (
    <View style={[styles.box, sufficient ? styles.ok : styles.warn]}>
      <Row label="Wallet Balance" value={balance} />
      <Row label="Trip Amount" value={amount} />

      {sufficient ? (
        <View style={styles.msgRow}>
          <Icon name="check" size={18} color={colors.success} />
          <Text style={[typography.caption, { color: colors.success, flex: 1 }]}>
            Rs {amount.toFixed(2)} will be deducted from your wallet.
          </Text>
        </View>
      ) : (
        <>
          <Row label="Required Additional Amount" value={shortfall} highlight />
          <Button
            title="Add Money"
            variant="outline"
            leftIcon={<Icon name="plus" size={18} color={colors.primary} />}
            onPress={onAddMoney}
            style={{ marginTop: spacing.sm }}
          />
        </>
      )}
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={typography.bodyMuted}>{label}</Text>
      <Text style={[typography.title, highlight && { color: colors.danger }]}>
        Rs {value.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1 },
  ok: { backgroundColor: colors.primarySofter, borderColor: colors.primarySoft },
  warn: { backgroundColor: colors.warningSoft, borderColor: colors.warningSoftBorder },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
