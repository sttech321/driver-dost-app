import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon } from './Icon';
import { Button } from './Button';
import { geocodeApi } from '@/api/geocode.api';
import { Place } from '@/api/types';
import { useLocation } from '@/hooks/useLocation';

interface MapPickerModalProps {
  visible: boolean;
  initialCoords?: { lat: number; lng: number };
  onClose: () => void;
  onPick: (place: Place) => void;
}

const DEFAULT = { lat: 30.69, lng: 76.72 }; // Mohali

// Load Leaflet from CDN once (no API key, interactive map for web picking).
let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => {
      // Reset the cache so a later open can retry instead of reusing a
      // permanently-rejected promise.
      leafletPromise = null;
      reject(new Error('Failed to load Leaflet'));
    };
    document.body.appendChild(script);
  });
  return leafletPromise;
}

export function MapPickerModal({ visible, initialCoords, onClose, onPick }: MapPickerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const center = useRef({ ...(initialCoords ?? DEFAULT) });
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reqId = useRef(0);
  const [picked, setPicked] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { fetchCurrent } = useLocation();

  const reverse = (lat: number, lng: number) => {
    if (debounce.current) clearTimeout(debounce.current);
    setLoading(true);
    debounce.current = setTimeout(async () => {
      const id = ++reqId.current; // guard against out-of-order responses
      try {
        const place = await geocodeApi.reverse(lat, lng);
        if (id === reqId.current) setPicked(place);
      } catch {
        if (id === reqId.current) setPicked(null);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 450);
  };

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    center.current = { ...(initialCoords ?? DEFAULT) };
    setPicked(null);
    setMapReady(false);
    setLoadError(false);

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current) return;
      // (Re)create the map fresh each open.
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      const map = L.map(containerRef.current, { zoomControl: true }).setView(
        [center.current.lat, center.current.lng],
        15
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      map.on('moveend', () => {
        const c = map.getCenter();
        center.current = { lat: c.lat, lng: c.lng };
        reverse(c.lat, c.lng);
      });
      mapRef.current = map;
      setMapReady(true);
      // Container is sized via flexbox after mount — recompute.
      setTimeout(() => map.invalidateSize(), 100);
      reverse(center.current.lat, center.current.lng);
    }).catch(() => {
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
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, retryKey, initialCoords?.lat, initialCoords?.lng]);

  const goToCurrent = async () => {
    const c = await fetchCurrent();
    if (c && mapRef.current) mapRef.current.setView([c.lat, c.lng], 15);
  };

  const confirm = () => {
    // Don't submit the default coords if the map never loaded.
    if (loadError || !mapReady) return;
    const { lat, lng } = center.current;
    const fallback = { id: `${lat},${lng}`, label: 'Selected location', address: '', lat, lng };
    onPick(loading ? fallback : picked ?? fallback);
  };

  // Re-runs the init effect (loadLeaflet was reset to null on error, so it retries the CDN).
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
          {/* Raw DOM node Leaflet mounts into (web build = react-dom). */}
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          {!loadError && (
            <View pointerEvents="none" style={styles.centerPin}>
              <Icon name="map-pin" size={40} color={colors.primary} />
            </View>
          )}
          {loadError && (
            <View style={styles.errorOverlay}>
              <Icon name="map-pin" size={36} color={colors.textMuted} />
              <Text style={[typography.title, { textAlign: 'center', marginTop: spacing.sm }]}>
                Map couldn’t load
              </Text>
              <Text style={[typography.caption, { textAlign: 'center', marginBottom: spacing.md }]}>
                Check your connection, then try again — or use your current location.
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
                    {picked?.label ?? 'Drag the map to your spot'}
                  </Text>
                  {!!picked?.address && (
                    <Text style={typography.caption} numberOfLines={2}>
                      {picked.address}
                    </Text>
                  )}
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
  },
  centerPin: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
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
