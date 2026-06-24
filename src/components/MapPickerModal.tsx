import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
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

export function MapPickerModal({ visible, initialCoords, onClose, onPick }: MapPickerModalProps) {
  const mapRef = useRef<MapView>(null);
  const center = useRef({ ...(initialCoords ?? DEFAULT) });
  const [picked, setPicked] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reqId = useRef(0);
  const { fetchCurrent } = useLocation();

  const region: Region = {
    latitude: (initialCoords ?? DEFAULT).lat,
    longitude: (initialCoords ?? DEFAULT).lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // A RN Modal hides but does NOT unmount its children, so re-sync everything
  // each time it opens: reset the center to the latest bias, recenter the map,
  // clear the previous pick, and reverse-geocode the fresh center.
  useEffect(() => {
    if (!visible) return;
    center.current = { ...(initialCoords ?? DEFAULT) };
    setPicked(null);
    mapRef.current?.animateToRegion(
      { latitude: center.current.lat, longitude: center.current.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      0
    );
    reverse(center.current.lat, center.current.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialCoords?.lat, initialCoords?.lng]);

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

  const onRegionChangeComplete = (r: Region) => {
    center.current = { lat: r.latitude, lng: r.longitude };
    reverse(r.latitude, r.longitude);
  };

  const goToCurrent = async () => {
    const c = await fetchCurrent();
    if (!c) return;
    mapRef.current?.animateToRegion(
      { latitude: c.lat, longitude: c.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500
    );
  };

  const confirm = () => {
    const { lat, lng } = center.current;
    const fallback = { id: `${lat},${lng}`, label: 'Selected location', address: '', lat, lng };
    // While a reverse-geocode is in flight, `picked` is stale — trust the center.
    onPick(loading ? fallback : picked ?? fallback);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={region}
            onRegionChangeComplete={onRegionChangeComplete}
          />
          {/* Fixed center pin — the map moves underneath it. */}
          <View pointerEvents="none" style={styles.centerPin}>
            <Icon name="map-pin" size={40} color={colors.primary} />
          </View>
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
                    {picked?.label ?? 'Drop the pin on your spot'}
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

          <Button title="Confirm location" onPress={confirm} />
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
  mapWrap: { flex: 1 },
  centerPin: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    // Lift the pin tip to the exact center.
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
