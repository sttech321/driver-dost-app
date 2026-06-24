import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';
import { defaultScheduleStart } from '@/utils/formatSchedule';

interface SchedulePickerProps {
  visible: boolean;
  value: Date | null;
  minimumDate?: Date;
  onClose: () => void;
  onConfirm: (date: Date | null) => void;
}

// Date -> "YYYY-MM-DDTHH:mm" in local time, for <input type="datetime-local">.
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function SchedulePicker({ visible, value, minimumDate, onClose, onConfirm }: SchedulePickerProps) {
  const min = minimumDate ?? new Date();
  const [text, setText] = useState<string>(toLocalInput(value ?? defaultScheduleStart()));

  useEffect(() => {
    if (visible) setText(toLocalInput(value ?? defaultScheduleStart()));
  }, [visible, value]);

  const confirm = () => {
    const picked = new Date(text);
    if (isNaN(picked.getTime())) return onConfirm(null);
    onConfirm(picked < min ? min : picked);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={[typography.h3, styles.title]}>Schedule pickup</Text>

        {/* Raw DOM input (web build = react-dom). Browser provides the calendar. */}
        <input
          type="datetime-local"
          value={text}
          min={toLocalInput(min)}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px 16px',
            fontSize: 16,
            borderRadius: 12,
            border: `1px solid ${colors.fieldBorder}`,
            backgroundColor: colors.field,
            color: colors.textPrimary,
          }}
        />

        <Button title="Confirm time" onPress={confirm} />
        <Pressable style={styles.nowBtn} onPress={() => onConfirm(null)}>
          <Text style={styles.nowText}>Or ride now (Pick Now)</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.35)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: 56, height: 5, borderRadius: 3, backgroundColor: colors.divider },
  title: { textAlign: 'center', marginTop: spacing.sm },
  nowBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  nowText: { ...typography.label, color: colors.primary },
});
