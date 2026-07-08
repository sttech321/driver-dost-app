import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ViewStyle } from 'react-native';

/**
 * Fades + slides its children in on mount. Render it with `key={method}` so it
 * remounts (and re-animates) each time the selected payment method changes,
 * giving a smooth transition between the method-specific forms.
 */
export function AnimatedReveal({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const native = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: native }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: native }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
