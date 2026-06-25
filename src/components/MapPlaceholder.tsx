import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
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
  /** Live driver position — the map animates to follow it as it changes. */
  driverLocation?: { lat: number; lng: number } | null;
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
export function MapPlaceholder({ region, markers = [], route, driverLocation, style }: MapViewBoxProps) {
  const mapRef = useRef<MapView>(null);

  // Follow the driver smoothly as their location updates.
  useEffect(() => {
    if (driverLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: driverLocation.lat,
          longitude: driverLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800
      );
    }
  }, [driverLocation?.lat, driverLocation?.lng]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={region ?? DEFAULT_REGION}
        region={driverLocation ? undefined : region}
      >
        {markers.map((m, i) => (
          <Marker
            key={`${m.lat}-${m.lng}-${i}`}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            pinColor={m.color ?? colors.primary}
          />
        ))}
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Driver"
            pinColor={colors.primary}
          />
        )}
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
