import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { Icon } from './Icon';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { useAppLocation } from '@/context/LocationContext';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

// Lets the user change their current location via search / GPS / map pick.
// All three are provided by PlaceAutocomplete itself.
export function LocationPickerModal({ visible, onClose }: LocationPickerModalProps) {
  const { location, setLocation } = useAppLocation();
  const [query, setQuery] = useState('');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.back}>
            <Icon name="chevron-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={typography.h3}>Set your location</Text>
          <View style={styles.back} />
        </View>

        <View style={styles.body}>
          <PlaceAutocomplete
            placeholder="Search area, sector, city…"
            value={query}
            onChangeText={setQuery}
            onSelectPlace={(p) => {
              setLocation({ label: p.label, address: p.address, lat: p.lat, lng: p.lng });
              setQuery('');
              onClose();
            }}
            biasCoords={{ lat: location.lat, lng: location.lng }}
            zIndex={5}
          />

          <View style={styles.currentBox}>
            <Icon name="map-pin" size={16} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={typography.caption}>Current</Text>
              <Text style={typography.title} numberOfLines={1}>
                {location.label}
              </Text>
            </View>
          </View>

          <Text style={styles.hint}>
            Search above, or tap the map pin to drop a location, or use “my current location”.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.xl, gap: spacing.lg },
  currentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySofter,
    borderRadius: 12,
    padding: spacing.md,
  },
  hint: { ...typography.caption, color: colors.textMuted },
});
