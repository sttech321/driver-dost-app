import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Avatar, Icon, Button, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/api/user.api';
import { SavedPlace } from '@/api/types';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');

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
    if (!label || !address) {
      Alert.alert('Add place', 'Enter a label and address.');
      return;
    }
    try {
      const place = await userApi.createSavedPlace({ label, addressLine: address });
      setPlaces((p) => [place, ...p]);
      setLabel('');
      setAddress('');
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
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
        <TextField icon="map-pin" placeholder="Address (e.g. Sector 174)" value={address} onChangeText={setAddress} />
        <Button title="Add Saved Place" variant="outline" leftIcon={<Icon name="plus" size={18} color={colors.primary} />} onPress={addPlace} />
      </View>

      <Button
        title="Sign Out"
        variant="ghost"
        leftIcon={<Icon name="log-out" size={20} color={colors.primary} />}
        onPress={signOut}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xxl }}
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
    gap: 2,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  placeDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#C9D2E0' },
  addBox: { gap: spacing.md, marginTop: spacing.lg },
});
