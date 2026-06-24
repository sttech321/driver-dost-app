import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/theme';

interface MapMarker {
  lat: number;
  lng: number;
  color?: string;
}

interface MapViewBoxProps {
  region?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  markers?: MapMarker[];
  route?: { lat: number; lng: number }[];
  style?: ViewStyle;
}

// Mohali / Sector 92 area shown in the designs.
const DEFAULT = { lat: 30.69, lng: 76.72 };

/**
 * Web fallback for MapPlaceholder. `react-native-maps` is native-only, so on
 * web we embed an interactive Google Map via an <iframe> (no API key needed).
 * Same props as the native component, so screens don't change.
 */
function buildSrc({ region, markers, route }: MapViewBoxProps): string {
  // A route (>= 2 points) → directions embed so the path is drawn.
  if (route && route.length >= 2) {
    const a = route[0];
    const b = route[route.length - 1];
    return `https://maps.google.com/maps?saddr=${a.lat},${a.lng}&daddr=${b.lat},${b.lng}&z=13&output=embed`;
  }
  const center =
    markers?.[0] ??
    (region ? { lat: region.latitude, lng: region.longitude } : DEFAULT);
  return `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=14&output=embed`;
}

export function MapPlaceholder(props: MapViewBoxProps) {
  return (
    <View style={[styles.container, props.style]}>
      <iframe
        title="map"
        src={buildSrc(props)}
        loading="lazy"
        style={{ border: '0', width: '100%', height: '100%', display: 'block' }}
        referrerPolicy="no-referrer-when-downgrade"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.field, overflow: 'hidden' },
});
