import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, DateStrip, Icon, PlaceAutocomplete, Screen, ScreenHeader } from '@/components';
import { useLocation } from '@/hooks/useLocation';
import { bookingApi } from '@/api/booking.api';
import { OutstationTripType, Place } from '@/api/types';
import { resolvePlace } from '@/utils/resolvePlace';

type Props = NativeStackScreenProps<AppStackParamList, 'Outstation'>;

const PRICES: Record<OutstationTripType, number> = { ROUND_TRIP: 1200, ONE_WAY: 1700 };

export function OutstationScreen({ navigation }: Props) {
  const { coords, fetchCurrent } = useLocation();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupPlace, setPickupPlace] = useState<Place | null>(null);
  const [destPlace, setDestPlace] = useState<Place | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [date, setDate] = useState<Date>(new Date());
  const [tripType, setTripType] = useState<OutstationTripType>('ROUND_TRIP');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  const schedule = async () => {
    if (!pickup || !destination) {
      Alert.alert('Add locations', 'Please set pickup and destination.');
      return;
    }
    setLoading(true);
    try {
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
      const scheduledAt = new Date(date);
      const booking = await bookingApi.createOutstation({
        pickupLabel: pickResolved?.label ?? pickup,
        pickupAddress: pickResolved?.address || pickup,
        pickupLat: pLat,
        pickupLng: pLng,
        destinationLabel: destResolved.label,
        destinationAddress: destResolved.address || destination,
        destinationLat: destResolved.lat,
        destinationLng: destResolved.lng,
        scheduledAt: scheduledAt.toISOString(),
        outstationType: tripType,
      });
      navigation.navigate('DriverArriving', { bookingId: booking.id });
    } catch (e: any) {
      Alert.alert('Could not schedule', e.message);
    } finally {
      setLoading(false);
    }
  };

  const TripOption = ({
    type,
    title,
    subtitle,
  }: {
    type: OutstationTripType;
    title: string;
    subtitle: string;
  }) => {
    const active = tripType === type;
    return (
      <Pressable style={[styles.option, active && styles.optionActive]} onPress={() => setTripType(type)}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>{title}</Text>
          <Text style={typography.caption}>{subtitle}</Text>
        </View>
        <Text style={styles.price}>Rs {PRICES[type]}</Text>
        <View style={[styles.checkbox, active && styles.checkboxOn]}>
          {active && <Icon name="check" size={16} color={colors.white} />}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scroll>
      <ScreenHeader onBack={() => navigation.goBack()} title="Outstation Screen" banner />

      <View style={styles.body}>
        <Pressable style={styles.pickNow}>
          <Icon name="calendar" size={18} color={colors.textPrimary} />
          <Text style={typography.label}>Pick Now</Text>
          <Icon name="chevron-down" size={18} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.fields}>
          <PlaceAutocomplete
            placeholder="My location"
            value={pickup}
            onChangeText={setPickup}
            onSelectPlace={setPickupPlace}
            onClearPlace={() => setPickupPlace(null)}
            biasCoords={coords}
            zIndex={3}
          />
          <PlaceAutocomplete
            placeholder="Destination"
            value={destination}
            onChangeText={setDestination}
            onSelectPlace={setDestPlace}
            onClearPlace={() => setDestPlace(null)}
            biasCoords={coords}
            zIndex={2}
          />
        </View>

        <Text style={[typography.title, { marginTop: spacing.md }]}>When do you need driver?</Text>
        <DateStrip selectedIndex={dayIndex} onSelect={(i, d) => { setDayIndex(i); setDate(d); }} />

        <Text style={[typography.title, { marginTop: spacing.md }]}>Trip Type</Text>
        <TripOption type="ROUND_TRIP" title="Round Trip" subtitle="Same Pickup and drop locations" />
        <TripOption type="ONE_WAY" title="One Way Trip" subtitle="Different Pickup and drop locations" />

        <View style={styles.tagline}>
          <Text style={styles.taglineText}>
            Experienced Drivers,{'\n'}Specialized for{'\n'}
            <Text style={styles.taglineBold}>Mountain Roads.</Text>
          </Text>
        </View>
      </View>

      <Button title="Schedule Driver" onPress={schedule} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingTop: spacing.sm },
  fields: { gap: spacing.md, zIndex: 10 },
  pickNow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySofter },
  price: { ...typography.title },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagline: { paddingVertical: spacing.xl },
  taglineText: { fontSize: 26, fontWeight: '400', color: '#C9D2E0', lineHeight: 34 },
  taglineBold: { fontWeight: '800' },
});
