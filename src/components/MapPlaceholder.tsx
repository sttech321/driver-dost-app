import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Region } from 'react-native-maps';
import { colors } from '@/theme';

interface MapMarker {
  lat: number;
  lng: number;
  color?: string;
}

interface MapViewBoxProps {
  region?: Region;
  markers?: MapMarker[];
  route?: { lat: number; lng: number }[];
  style?: ViewStyle;
}

const DEFAULT_REGION: Region = {
  // Mohali / Sector 91-92 area from the designs.
  latitude: 30.69,
  longitude: 76.72,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * Map view used across booking screens. Falls back to Apple Maps on iOS and
 * Google Maps on Android (requires the Android Maps API key in app.json).
 */
export function MapPlaceholder({ region, markers = [], route, style }: MapViewBoxProps) {
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region ?? DEFAULT_REGION}
        region={region}
      >
        {markers.map((m, i) => (
          <Marker
            key={`${m.lat}-${m.lng}-${i}`}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            pinColor={m.color ?? colors.primary}
          />
        ))}
        {route && route.length > 1 && (
          <Polyline
            coordinates={route.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={colors.mapRoute}
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.field,
    overflow: 'hidden',
  },
});
