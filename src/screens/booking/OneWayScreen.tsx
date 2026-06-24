import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, Icon, MapPlaceholder, PlaceAutocomplete, SchedulePicker, ScreenHeader } from '@/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '@/hooks/useLocation';
import { userApi } from '@/api/user.api';
import { bookingApi } from '@/api/booking.api';
import { Place, SavedPlace } from '@/api/types';
import { resolvePlace } from '@/utils/resolvePlace';
import { formatSchedule } from '@/utils/formatSchedule';

type Props = NativeStackScreenProps<AppStackParamList, 'OneWay'>;

export function OneWayScreen({ navigation }: Props) {
  const { coords, fetchCurrent } = useLocation();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupPlace, setPickupPlace] = useState<Place | null>(null);
  const [destPlace, setDestPlace] = useState<Place | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrent();
    userApi.listSavedPlaces().then(setSavedPlaces).catch(() => {});
  }, [fetchCurrent]);

  // Map markers + route reflect whatever is currently selected.
  const markers = useMemo(() => {
    const pts: { lat: number; lng: number; color?: string }[] = [];
    if (pickupPlace) pts.push({ lat: pickupPlace.lat, lng: pickupPlace.lng });
    else if (coords) pts.push({ lat: coords.lat, lng: coords.lng });
    if (destPlace) pts.push({ lat: destPlace.lat, lng: destPlace.lng, color: colors.danger });
    return pts;
  }, [pickupPlace, destPlace, coords]);

  const route = pickupPlace && destPlace
    ? [
        { lat: pickupPlace.lat, lng: pickupPlace.lng },
        { lat: destPlace.lat, lng: destPlace.lng },
      ]
    : undefined;

  const selectSaved = (sp: SavedPlace) => {
    setDestination(sp.label);
    if (sp.lat != null && sp.lng != null) {
      setDestPlace({ id: sp.id, label: sp.label, address: sp.addressLine, lat: sp.lat, lng: sp.lng });
    }
  };

  const findDriver = async () => {
    if (!pickup || !destination) {
      Alert.alert('Add locations', 'Please set your pickup and destination.');
      return;
    }
    setLoading(true);
    try {
      // Resolve coordinates for fields the user typed but didn't pick.
      const [pickResolved, destResolved] = await Promise.all([
        resolvePlace(pickup, pickupPlace, coords),
        resolvePlace(destination, destPlace, coords),
      ]);
      const pLat = pickResolved?.lat ?? coords?.lat;
      const pLng = pickResolved?.lng ?? coords?.lng;
      if (pLat == null || pLng == null) {
        Alert.alert('Set pickup', 'Pick your pickup from the suggestions or enable location access.');
        return;
      }
      if (!destResolved) {
        Alert.alert('Pick a destination', 'Please choose your destination from the suggestions or the map.');
        return;
      }
      const booking = await bookingApi.createOneWay({
        pickupLabel: pickResolved?.label ?? pickup,
        pickupAddress: pickResolved?.address || pickup,
        pickupLat: pLat,
        pickupLng: pLng,
        destinationLabel: destResolved.label,
        destinationAddress: destResolved.address || destination,
        destinationLat: destResolved.lat,
        destinationLng: destResolved.lng,
        scheduledAt: scheduledAt?.toISOString(),
      });
      navigation.navigate('DriverArriving', { bookingId: booking.id });
    } catch (e: any) {
      Alert.alert('Could not find a driver', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <MapPlaceholder
        style={styles.map}
        region={
          coords
            ? { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : undefined
        }
        markers={markers}
        route={route}
      />
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <ScreenHeader onBack={() => navigation.goBack()} title="One Way Screen" banner />
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <Pressable style={styles.pickNow} onPress={() => setShowSchedule(true)}>
          <Icon name="calendar" size={18} color={colors.primary} />
          <Text style={styles.pickNowText}>{formatSchedule(scheduledAt)}</Text>
          <Icon name="chevron-down" size={18} color={colors.primary} />
        </Pressable>

        <View style={styles.fields}>
          <PlaceAutocomplete
            placeholder="My location"
            value={pickup}
            onChangeText={setPickup}
            onSelectPlace={(p) => setPickupPlace(p)}
            onClearPlace={() => setPickupPlace(null)}
            biasCoords={coords}
            zIndex={3}
          />
          <PlaceAutocomplete
            placeholder="Destination"
            value={destination}
            onChangeText={setDestination}
            onSelectPlace={(p) => setDestPlace(p)}
            onClearPlace={() => setDestPlace(null)}
            biasCoords={coords}
            zIndex={2}
          />
        </View>

        <View style={styles.savedHeader}>
          <Text style={typography.h3}>Saved Places</Text>
          <Pressable style={styles.viewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <FlatList
          data={savedPlaces}
          keyExtractor={(p) => p.id}
          style={styles.savedList}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <Pressable style={styles.savedRow} onPress={() => selectSaved(item)}>
              <View style={styles.savedDot} />
              <View>
                <Text style={typography.title}>{item.label}</Text>
                <Text style={typography.caption}>{item.addressLine}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={[typography.caption, { paddingVertical: spacing.md }]}>
              No saved places yet. Add them from your Profile.
            </Text>
          }
        />

        <Button title="Find a Driver" onPress={findDriver} loading={loading} />
      </View>

      <SchedulePicker
        visible={showSchedule}
        value={scheduledAt}
        onClose={() => setShowSchedule(false)}
        onConfirm={(d) => {
          setScheduledAt(d);
          setShowSchedule(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  map: { height: '42%' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  grabber: { alignSelf: 'center', width: 56, height: 5, borderRadius: 3, backgroundColor: colors.divider },
  pickNow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.sm,
  },
  pickNowText: { ...typography.label },
  // Elevated so the autocomplete dropdowns overlay the content below.
  fields: { gap: spacing.md, zIndex: 10 },
  savedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 0 },
  savedList: { flex: 1, zIndex: 0 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { ...typography.label, color: colors.primary },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  savedDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#C9D2E0' },
});
