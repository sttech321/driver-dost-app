import React, { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface HourRangeSliderProps {
  startHour: number; // 0-23
  endHour: number; // 0-23
  onChange: (startHour: number, endHour: number) => void;
  min?: number;
  max?: number;
}

const THUMB = 22;

function formatHour(h: number) {
  const period = h >= 12 ? 'Pm' : 'Am';
  const display = h % 12 === 0 ? 12 : h % 12;
  return { display: String(display), period };
}

// Two-thumb range slider (start hour / end hour) for the Hourly screen.
export function HourRangeSlider({ startHour, endHour, onChange, min = 0, max = 23 }: HourRangeSliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const ratio = (h: number) => (h - min) / (max - min);
  const hourFromX = (x: number) => {
    const r = Math.min(Math.max(0, x / Math.max(1, widthRef.current)), 1);
    return Math.round(min + r * (max - min));
  };

  const makeResponder = (which: 'start' | 'end') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        const h = hourFromX(x);
        if (which === 'start') onChange(Math.min(h, endHour - 1), endHour);
        else onChange(startHour, Math.max(h, startHour + 1));
      },
    });

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const start = formatHour(startHour);
  const end = formatHour(endHour);
  const hours = endHour - startHour;

  const leftX = ratio(startHour) * width;
  const rightX = ratio(endHour) * width;

  return (
    <View>
      <View style={styles.track} onLayout={onLayout}>
        <View style={styles.baseLine} />
        <View style={[styles.activeLine, { left: leftX, width: Math.max(0, rightX - leftX) }]} />
        <View
          style={[styles.thumb, { left: leftX - THUMB / 2 }]}
          {...makeResponder('start').panHandlers}
        />
        <View
          style={[styles.thumb, { left: rightX - THUMB / 2 }]}
          {...makeResponder('end').panHandlers}
        />
      </View>

      <View style={styles.labels}>
        <View style={styles.endLabel}>
          <Text style={styles.big}>{start.display}</Text>
          <Text style={styles.period}>{start.period}</Text>
        </View>
        <Text style={styles.middle}>{hours} Hours</Text>
        <View style={[styles.endLabel, { alignItems: 'flex-end' }]}>
          <Text style={styles.big}>{end.display}</Text>
          <Text style={styles.period}>{end.period}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 36, justifyContent: 'center', marginTop: spacing.xl },
  baseLine: { height: 3, borderRadius: 2, backgroundColor: colors.divider },
  activeLine: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: colors.primary },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  endLabel: { width: 60 },
  big: { ...typography.h2 },
  period: { ...typography.caption, color: colors.textSecondary },
  middle: { ...typography.bodyMuted },
});
