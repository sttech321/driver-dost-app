import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Avatar, Icon, Button, TextField, PlaceAutocomplete, AddMoneyModal } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useAppLocation } from '@/context/LocationContext';
import { userApi } from '@/api/user.api';
import { Place, SavedPlace } from '@/api/types';
import { resolvePlace } from '@/utils/resolvePlace';

export function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { location } = useAppLocation();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [addressPlace, setAddressPlace] = useState<Place | null>(null);
  const [saving, setSaving] = useState(false);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlaces(await userApi.listSavedPlaces());
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const addPlace = async () => {
    if (!label.trim()) {
      Alert.alert('Add place', 'Please enter a label (e.g. Home).');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Add place', 'Search and pick an address (or drop a pin on the map).');
      return;
    }
    setSaving(true);
    try {
      // Resolve real coordinates: use the picked place, else geocode the text.
      const resolved = await resolvePlace(address, addressPlace, {
        lat: location.lat,
        lng: location.lng,
      });
      if (!resolved) {
        Alert.alert('Pick a location', 'Choose the address from the suggestions or the map.');
        return;
      }
      const place = await userApi.createSavedPlace({
        label: label.trim(),
        addressLine: resolved.address || resolved.label,
        lat: resolved.lat,
        lng: resolved.lng,
      });
      setPlaces((p) => [place, ...p]);
      setLabel('');
      setAddress('');
      setAddressPlace(null);
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const removePlace = async (id: string) => {
    try {
      await userApi.deleteSavedPlace(id);
      setPlaces((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      Alert.alert('Could not delete', e.message);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Avatar uri={user?.photoUrl} size={72} />
        <Text style={[typography.h2, { marginTop: spacing.md }]}>{user?.name || 'Driver Dost User'}</Text>
        <Text style={typography.bodyMuted}>{user?.phone || user?.email}</Text>
        <View style={styles.wallet}>
          <Text style={typography.caption}>Wallet Balance</Text>
          <Text style={typography.h3}>Rs {Number(user?.walletBalance ?? 0).toFixed(2)}</Text>
          <Pressable style={styles.addMoneyBtn} onPress={() => setAddMoneyOpen(true)}>
            <Icon name="plus" size={16} color={colors.white} />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[typography.h3, { marginTop: spacing.xl }]}>Saved Places</Text>
      <FlatList
        data={places}
        scrollEnabled={false}
        keyExtractor={(p) => p.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        style={{ marginTop: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.placeRow}>
            <View style={styles.placeDot} />
            <View style={{ flex: 1 }}>
              <Text style={typography.title}>{item.label}</Text>
              <Text style={typography.caption}>{item.addressLine}</Text>
            </View>
            <Pressable onPress={() => removePlace(item.id)} hitSlop={8}>
              <Icon name="trash" size={20} color={colors.danger} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={typography.caption}>No saved places yet.</Text>}
      />

      <View style={styles.addBox}>
        <TextField icon="map-pin" placeholder="Label (e.g. Home)" value={label} onChangeText={setLabel} />
        <PlaceAutocomplete
          placeholder="Search address or pick on map"
          value={address}
          onChangeText={setAddress}
          onSelectPlace={setAddressPlace}
          onClearPlace={() => setAddressPlace(null)}
          biasCoords={{ lat: location.lat, lng: location.lng }}
          zIndex={5}
        />
        <Button
          title="Add Saved Place"
          variant="outline"
          loading={saving}
          leftIcon={<Icon name="plus" size={18} color={colors.primary} />}
          onPress={addPlace}
        />
      </View>

      <Button
        title="Sign Out"
        variant="ghost"
        leftIcon={<Icon name="log-out" size={20} color={colors.primary} />}
        onPress={signOut}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xxl }}
      />

      <AddMoneyModal
        visible={addMoneyOpen}
        onClose={() => setAddMoneyOpen(false)}
        onToppedUp={refreshUser}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', paddingTop: spacing.lg },
  wallet: {
    marginTop: spacing.lg,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  addMoneyText: { ...typography.label, color: colors.white },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  placeDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#C9D2E0' },
  // Elevated so the address autocomplete dropdown overlays content below it.
  addBox: { gap: spacing.md, marginTop: spacing.lg, zIndex: 10 },
});
