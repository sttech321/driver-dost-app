import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
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
  // The marker's EXACT position — this is what gets confirmed.
  const [marker, setMarker] = useState({ ...(initialCoords ?? DEFAULT) });
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

  useEffect(() => {
    if (!visible) return;
    const c = { ...(initialCoords ?? DEFAULT) };
    setMarker(c);
    setPicked(null);
    mapRef.current?.animateToRegion(
      { latitude: c.lat, longitude: c.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      0
    );
    reverse(c.lat, c.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialCoords?.lat, initialCoords?.lng]);

  // Reverse-geocode for the LABEL only — the coordinates always stay the pin's.
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

  const moveMarker = (lat: number, lng: number) => {
    setMarker({ lat, lng });
    reverse(lat, lng);
  };

  const goToCurrent = async () => {
    const c = await fetchCurrent();
    if (!c) return;
    moveMarker(c.lat, c.lng);
    mapRef.current?.animateToRegion(
      { latitude: c.lat, longitude: c.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500
    );
  };

  const confirm = () => {
    // Always return the EXACT marker coordinates; label/address is just context.
    onPick({
      id: `${marker.lat},${marker.lng}`,
      label: picked?.label || 'Selected location',
      address: picked?.address || '',
      lat: marker.lat,
      lng: marker.lng,
    });
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
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            onPress={(e) => moveMarker(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
          >
            <Marker
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              draggable
              onDragEnd={(e) =>
                moveMarker(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
              }
              pinColor={colors.primary}
            />
          </MapView>
          <View pointerEvents="none" style={styles.hint}>
            <Text style={styles.hintText}>Tap the map or drag the pin</Text>
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
