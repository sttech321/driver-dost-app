import React, { useRef } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, typography } from '@/theme';
import { Icon } from './Icon';

interface SlideButtonProps {
  label: string;
  onComplete: () => void;
}

const KNOB = 56;
const PADDING = 6;

// "Get Started" slide-to-confirm control on the Welcome screen.
export function SlideButton({ label, onComplete }: SlideButtonProps) {
  const trackWidth = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const fired = useRef(false);

  const maxSlide = () => Math.max(0, trackWidth.current - KNOB - PADDING * 2);

  const reset = () =>
    Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        const x = Math.min(Math.max(0, g.dx), maxSlide());
        translateX.setValue(x);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dx >= maxSlide() * 0.85 && !fired.current) {
          fired.current = true;
          Animated.timing(translateX, {
            toValue: maxSlide(),
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            onComplete();
            fired.current = false;
            translateX.setValue(0);
          });
        } else {
          reset();
        }
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.track} onLayout={onLayout}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[styles.knob, { transform: [{ translateX }] }]}
        {...responder.panHandlers}
      >
        <Icon name="arrow-right" size={24} color={colors.white} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: KNOB + PADDING * 2,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    justifyContent: 'center',
    paddingHorizontal: PADDING,
  },
  label: { ...typography.button, color: colors.textPrimary, textAlign: 'center' },
  knob: {
    position: 'absolute',
    left: PADDING,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
