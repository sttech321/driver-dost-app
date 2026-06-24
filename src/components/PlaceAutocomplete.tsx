import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { Icon } from './Icon';
import { MapPickerModal } from './MapPickerModal';
import { geocodeApi } from '@/api/geocode.api';
import { Place } from '@/api/types';
import { useLocation } from '@/hooks/useLocation';

interface PlaceAutocompleteProps {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  /** Fires when a real place (with coordinates) is chosen. */
  onSelectPlace: (place: Place) => void;
  /** Fires when the text is edited away from the chosen place (coords now stale). */
  onClearPlace?: () => void;
  /** Bias search + map picker toward this point (e.g. current location). */
  biasCoords?: { lat: number; lng: number } | null;
  /** Stacking order so an open dropdown overlays fields below it. */
  zIndex?: number;
  enableCurrentLocation?: boolean;
}

export function PlaceAutocomplete({
  placeholder,
  value,
  onChangeText,
  onSelectPlace,
  onClearPlace,
  biasCoords,
  zIndex = 1,
  enableCurrentLocation = true,
}: PlaceAutocompleteProps) {
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const justSelected = useRef(false);
  const selectedLabel = useRef<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reqId = useRef(0);
  const { fetchCurrent } = useLocation();

  // Editing the text after a selection invalidates the stored Place's coords.
  const handleChange = (t: string) => {
    if (selectedLabel.current && t !== selectedLabel.current) {
      selectedLabel.current = null;
      onClearPlace?.();
    }
    onChangeText(t);
  };

  // Debounced search whenever the text changes (and wasn't just auto-filled).
  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      const id = ++reqId.current;
      try {
        const data = await geocodeApi.search(q, {
          lat: biasCoords?.lat,
          lng: biasCoords?.lng,
          limit: 6,
        });
        if (id === reqId.current) setResults(data);
      } catch {
        if (id === reqId.current) setResults([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 350);

    return () => debounce.current && clearTimeout(debounce.current);
  }, [value, biasCoords?.lat, biasCoords?.lng]);

  const choose = (place: Place) => {
    justSelected.current = true;
    selectedLabel.current = place.label;
    onChangeText(place.label);
    onSelectPlace(place);
    setResults([]);
    setFocused(false);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const c = await fetchCurrent();
      if (!c) return;
      const place = (await geocodeApi.reverse(c.lat, c.lng)) ?? {
        id: `${c.lat},${c.lng}`,
        label: 'My current location',
        address: '',
        lat: c.lat,
        lng: c.lng,
      };
      choose({ ...place, label: place.label || 'My current location' });
    } catch {
      /* ignore */
    } finally {
      setLocating(false);
    }
  };

  const open = focused && (loading || results.length > 0 || enableCurrentLocation);

  return (
    <View style={[styles.wrap, { zIndex: open ? zIndex + 100 : zIndex, elevation: open ? 12 : 0 }]}>
      <View style={styles.row}>
        <View style={styles.leadIcon}>
          <Icon name="crosshair" size={20} color={colors.primary} />
        </View>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          // Delay so a tap on a suggestion registers before blur closes the list.
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          style={[typography.body, styles.input]}
        />
        <Pressable onPress={() => setShowPicker(true)} hitSlop={8} style={styles.pinBtn}>
          <Icon name="map-pin" size={20} color={colors.white} />
        </Pressable>
      </View>

      {open && (
        <View style={styles.dropdown}>
          {enableCurrentLocation && (
            <Pressable style={styles.item} onPress={useCurrentLocation}>
              <Icon name="crosshair" size={18} color={colors.primary} />
              <Text style={[typography.label, { color: colors.primary }]}>
                {locating ? 'Getting your location…' : 'Use my current location'}
              </Text>
            </Pressable>
          )}
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
            {loading && results.length === 0 ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={typography.caption}>Searching…</Text>
              </View>
            ) : (
              results.map((p) => (
                <Pressable key={p.id} style={styles.item} onPress={() => choose(p)}>
                  <Icon name="map-pin" size={18} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={typography.title} numberOfLines={1}>
                      {p.label}
                    </Text>
                    {!!p.address && (
                      <Text style={typography.caption} numberOfLines={1}>
                        {p.address}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))
            )}
            {!loading && results.length === 0 && value.trim().length >= 2 && (
              <Text style={[typography.caption, styles.empty]}>No matches found.</Text>
            )}
          </ScrollView>
        </View>
      )}

      <MapPickerModal
        visible={showPicker}
        initialCoords={biasCoords ?? undefined}
        onClose={() => setShowPicker(false)}
        onPick={(place) => {
          setShowPicker(false);
          choose(place);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.field,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 58,
    gap: spacing.md,
  },
  leadIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 0 },
  pinBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 62,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing.xs,
    ...shadow.card,
    zIndex: 1000,
  },
  list: { maxHeight: 240 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  empty: { padding: spacing.lg },
});
