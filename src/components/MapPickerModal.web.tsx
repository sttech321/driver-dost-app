import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon } from './Icon';
import { Button } from './Button';
import { geocodeApi } from '@/api/geocode.api';
import { Place } from '@/api/types';
import { useLocation } from '@/hooks/useLocation';
import { loadLeaflet } from './leaflet';

interface MapPickerModalProps {
  visible: boolean;
  initialCoords?: { lat: number; lng: number };
  onClose: () => void;
  onPick: (place: Place) => void;
}

const DEFAULT = { lat: 30.69, lng: 76.72 }; // Mohali

export function MapPickerModal({ visible, initialCoords, onClose, onPick }: MapPickerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const markerCoord = useRef({ ...(initialCoords ?? DEFAULT) }); // EXACT pin coords
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reqId = useRef(0);
  const [marker, setMarker] = useState({ ...(initialCoords ?? DEFAULT) });
  const [picked, setPicked] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { fetchCurrent } = useLocation();

  // Reverse-geocode for the LABEL only; coordinates always stay the pin's.
  const reverse = (lat: number, lng: number) => {
    if (debounce.current) clearTimeout(debounce.current);
    setLoading(true);
    debounce.current = setTimeout(async () => {
      const id = ++reqId.current;
      try {
        const place = await geocodeApi.reverse(lat, lng);
        if (id === reqId.current) setPicked(place);
      } catch {
        if (id === reqId.current) setPicked(null);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 400);
  };

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    markerCoord.current = { ...(initialCoords ?? DEFAULT) };
    setMarker(markerCoord.current);
    setPicked(null);
    setMapReady(false);
    setLoadError(false);

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        const start = markerCoord.current;
        const map = L.map(containerRef.current, { zoomControl: true }).setView([start.lat, start.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        // Draggable pin (divIcon avoids Leaflet's missing-image issue).
        const icon = L.divIcon({
          className: 'dd-pin',
          html: `<div style="width:18px;height:18px;border-radius:50%;background:${colors.primary};border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.25)"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const m = L.marker([start.lat, start.lng], { draggable: true, icon }).addTo(map);

        const apply = (lat: number, lng: number) => {
          markerCoord.current = { lat, lng };
          setMarker({ lat, lng });
          m.setLatLng([lat, lng]);
          reverse(lat, lng);
        };
        map.on('click', (e: any) => apply(e.latlng.lat, e.latlng.lng));
        m.on('dragend', () => {
          const p = m.getLatLng();
          apply(p.lat, p.lng);
        });

        mapRef.current = map;
        markerRef.current = m;
        setMapReady(true);
        setTimeout(() => map.invalidateSize(), 100);
        reverse(start.lat, start.lng);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, retryKey, initialCoords?.lat, initialCoords?.lng]);

  const goToCurrent = async () => {
    const c = await fetchCurrent();
    if (!c || !mapRef.current) return;
    markerCoord.current = c;
    setMarker(c);
    markerRef.current?.setLatLng([c.lat, c.lng]);
    mapRef.current.setView([c.lat, c.lng], 15);
    reverse(c.lat, c.lng);
  };

  const confirm = () => {
    if (loadError || !mapReady) return;
    const { lat, lng } = markerCoord.current; // EXACT pin coords
    onPick({
      id: `${lat},${lng}`,
      label: picked?.label || 'Selected location',
      address: picked?.address || '',
      lat,
      lng,
    });
  };

  const retry = () => setRetryKey((k) => k + 1);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8} style={styles.backBtn}>
              <Icon name="chevron-left" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={typography.h3}>Pick location</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>

        <View style={styles.mapWrap}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          {!loadError && mapReady && (
            <View pointerEvents="none" style={styles.hint}>
              <Text style={styles.hintText}>Tap the map or drag the pin</Text>
            </View>
          )}
          {loadError && (
            <View style={styles.errorOverlay}>
              <Icon name="map-pin" size={36} color={colors.textMuted} />
              <Text style={[typography.title, { textAlign: 'center', marginTop: spacing.sm }]}>
                Map couldn’t load
              </Text>
              <Pressable style={styles.retryBtn} onPress={retry}>
                <Text style={[typography.label, { color: colors.white }]}>Retry</Text>
              </Pressable>
            </View>
          )}
        </View>

        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.addressRow}>
            <Icon name="map-pin" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={typography.caption}>Finding address…</Text>
                </View>
              ) : (
                <>
                  <Text style={typography.title} numberOfLines={1}>
                    {picked?.label ?? 'Selected location'}
                  </Text>
                  <Text style={typography.caption} numberOfLines={1}>
                    {picked?.address || `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`}
                  </Text>
                </>
              )}
            </View>
          </View>

          <Pressable style={styles.currentBtn} onPress={goToCurrent}>
            <Icon name="crosshair" size={18} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>Use my current location</Text>
          </Pressable>

          <Button title="Confirm location" onPress={confirm} disabled={loadError || !mapReady} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  headerSafe: { backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  mapWrap: { flex: 1, position: 'relative' },
  hint: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  hintText: { ...typography.caption, color: colors.white },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.field,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  sheet: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
