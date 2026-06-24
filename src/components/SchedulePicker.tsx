import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';
import { defaultScheduleStart } from '@/utils/formatSchedule';

interface SchedulePickerProps {
  visible: boolean;
  value: Date | null;
  minimumDate?: Date;
  onClose: () => void;
  onConfirm: (date: Date | null) => void; // null => "Pick Now" (immediate)
}

export function SchedulePicker({ visible, value, minimumDate, onClose, onConfirm }: SchedulePickerProps) {
  const min = minimumDate ?? new Date();
  const [temp, setTemp] = useState<Date>(value ?? defaultScheduleStart());

  // Keep temp in sync when (re)opening.
  useEffect(() => {
    if (visible) setTemp(value ?? defaultScheduleStart());
  }, [visible, value]);

  // Android has no combined date+time picker — chain date → time imperatively.
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: value ?? defaultScheduleStart(),
      mode: 'date',
      minimumDate: min,
      onChange: (e, picked) => {
        if (e.type !== 'set' || !picked) {
          onClose();
          return;
        }
        DateTimePickerAndroid.open({
          value: picked,
          mode: 'time',
          is24Hour: false,
          onChange: (e2, t) => {
            if (e2.type !== 'set' || !t) {
              onClose();
              return;
            }
            const combined = new Date(picked);
            combined.setHours(t.getHours(), t.getMinutes(), 0, 0);
            onConfirm(combined < min ? min : combined);
          },
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Android renders nothing itself (uses native dialogs above).
  if (Platform.OS === 'android') return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={[typography.h3, styles.title]}>Schedule pickup</Text>

        <DateTimePicker
          value={temp}
          mode="datetime"
          display="spinner"
          minimumDate={min}
          onChange={(_e, d) => d && setTemp(d)}
          style={styles.picker}
        />

        <Button title="Confirm time" onPress={() => onConfirm(temp < min ? min : temp)} />
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
  picker: { alignSelf: 'stretch' },
  nowBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  nowText: { ...typography.label, color: colors.primary },
});
