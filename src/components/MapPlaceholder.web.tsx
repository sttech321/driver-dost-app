import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/theme';
import { loadLeaflet } from './leaflet';

interface MapMarker {
  lat: number;
  lng: number;
  color?: string;
}

interface MapViewBoxProps {
  region?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  markers?: MapMarker[];
  route?: { lat: number; lng: number }[];
  /** Live driver position — updates the moving marker as it changes. */
  driverLocation?: { lat: number; lng: number } | null;
  style?: ViewStyle;
}

const DEFAULT = { lat: 30.69, lng: 76.72 }; // Mohali

// Web map via Leaflet (OpenStreetMap) so we can move the driver marker live.
export function MapPlaceholder({ region, markers = [], route, driverLocation, style }: MapViewBoxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const Lref = useRef<any>(null);
  const staticLayer = useRef<any>(null);
  const driverMarker = useRef<any>(null);

  // Init the map once.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        Lref.current = L;
        const c =
          driverLocation ?? markers[0] ?? (region ? { lat: region.latitude, lng: region.longitude } : DEFAULT);
        const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView(
          [c.lat, c.lng],
          13
        );
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        staticLayer.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 100);
        redraw();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        driverMarker.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers/route/driver whenever inputs change.
  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers), JSON.stringify(route), driverLocation?.lat, driverLocation?.lng]);

  function redraw() {
    const L = Lref.current;
    const map = mapRef.current;
    if (!L || !map || !staticLayer.current) return;

    staticLayer.current.clearLayers();
    const pts: [number, number][] = [];

    markers.forEach((m) => {
      L.circleMarker([m.lat, m.lng], {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: m.color || colors.primary,
        fillOpacity: 1,
      }).addTo(staticLayer.current);
      pts.push([m.lat, m.lng]);
    });

    if (route && route.length > 1) {
      L.polyline(
        route.map((p) => [p.lat, p.lng]),
        { color: colors.mapRoute, weight: 4 }
      ).addTo(staticLayer.current);
      route.forEach((p) => pts.push([p.lat, p.lng]));
    }

    // Moving driver marker (kept on the map, just repositioned).
    if (driverLocation) {
      const pos: [number, number] = [driverLocation.lat, driverLocation.lng];
      if (!driverMarker.current) {
        driverMarker.current = L.circleMarker(pos, {
          radius: 10,
          color: '#fff',
          weight: 3,
          fillColor: colors.primary,
          fillOpacity: 1,
        }).addTo(map);
      } else {
        driverMarker.current.setLatLng(pos);
      }
      pts.push(pos);
      map.panTo(pos, { animate: true });
    }

    if (pts.length > 1) {
      try {
        map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
      } catch {
        /* ignore */
      }
    } else if (pts.length === 1) {
      map.setView(pts[0], 14);
    }
  }

  return (
    <View style={[styles.container, style]}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.field, overflow: 'hidden' },
});
