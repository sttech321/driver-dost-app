import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { spacing, typography } from '@/theme';
import { Button, DateStrip, HourRangeSlider, PlaceAutocomplete, Screen, ScreenHeader } from '@/components';
import { useLocation } from '@/hooks/useLocation';
import { bookingApi } from '@/api/booking.api';
import { Place } from '@/api/types';
import { resolvePlace } from '@/utils/resolvePlace';

type Props = NativeStackScreenProps<AppStackParamList, 'Hourly'>;

export function HourlyScreen({ navigation }: Props) {
  const { coords, fetchCurrent } = useLocation();
  const [pickup, setPickup] = useState('');
  const [pickupPlace, setPickupPlace] = useState<Place | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [date, setDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(14);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  const schedule = async () => {
    if (!pickup) {
      Alert.alert('Pick-up needed', 'Please set your pick-up location.');
      return;
    }
    setLoading(true);
    try {
      const pickResolved = await resolvePlace(pickup, pickupPlace, coords);
      const pLat = pickResolved?.lat ?? coords?.lat;
      const pLng = pickResolved?.lng ?? coords?.lng;
      if (pLat == null || pLng == null) {
        Alert.alert('Set pick-up', 'Pick your location from the suggestions or enable location access.');
        return;
      }
      const scheduledAt = new Date(date);
      scheduledAt.setHours(startHour, 0, 0, 0);
      const booking = await bookingApi.createHourly({
        pickupLabel: pickResolved?.label ?? pickup,
        pickupAddress: pickResolved?.address || pickup,
        pickupLat: pLat,
        pickupLng: pLng,
        scheduledAt: scheduledAt.toISOString(),
        startHour,
        endHour,
      });
      navigation.navigate('DriverArriving', { bookingId: booking.id });
    } catch (e: any) {
      Alert.alert('Could not schedule', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader onBack={() => navigation.goBack()} title="Hourly Basis Screen" banner />

      <View style={styles.body}>
        <Text style={typography.title}>Your Pick-Up Location</Text>
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
        </View>

        <Text style={[typography.title, { marginTop: spacing.md }]}>When do you need driver?</Text>
        <DateStrip
          selectedIndex={dayIndex}
          onSelect={(i, d) => {
            setDayIndex(i);
            setDate(d);
          }}
        />

        <Text style={[typography.title, { marginTop: spacing.md }]}>Amount of Hours</Text>
        <HourRangeSlider
          startHour={startHour}
          endHour={endHour}
          onChange={(s, e) => {
            setStartHour(s);
            setEndHour(e);
          }}
        />

        <View style={styles.tagline}>
          <Text style={styles.taglineText}>
            Your Car,{'\n'}Driven by <Text style={styles.taglineBold}>Professionals.</Text>
          </Text>
        </View>
      </View>

      <Button title="Schedule Driver" onPress={schedule} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: spacing.md, paddingTop: spacing.lg },
  fields: { zIndex: 10 },
  tagline: { marginTop: 'auto', paddingVertical: spacing.xl },
  taglineText: { fontSize: 30, fontWeight: '400', color: '#C9D2E0', lineHeight: 38 },
  taglineBold: { fontWeight: '800' },
});
