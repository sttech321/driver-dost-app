import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { geocodeApi } from '@/api/geocode.api';

export interface CurrentLocation {
  label: string;
  address?: string;
  lat: number;
  lng: number;
}

const STORAGE_KEY = 'dd_current_location';
// Matches the area shown in the designs; used until the user sets their own.
const DEFAULT_LOCATION: CurrentLocation = {
  label: 'Mohali, Punjab',
  address: 'Punjab, India',
  lat: 30.69,
  lng: 76.72,
};

interface LocationContextValue {
  location: CurrentLocation;
  loading: boolean;
  setLocation: (loc: CurrentLocation) => void;
  /** Use device GPS → reverse-geocode → set as current location. */
  useCurrentGps: () => Promise<CurrentLocation | null>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<CurrentLocation>(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);

  // Restore the last-chosen location on launch.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setLocationState(JSON.parse(saved));
      } catch {
        /* keep default */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setLocation = useCallback((loc: CurrentLocation) => {
    setLocationState(loc);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc)).catch(() => {});
  }, []);

  const useCurrentGps = useCallback(async (): Promise<CurrentLocation | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      let place = null;
      try {
        place = await geocodeApi.reverse(lat, lng);
      } catch {
        /* reverse optional */
      }
      const loc: CurrentLocation = {
        label: place?.label || 'My current location',
        address: place?.address,
        lat,
        lng,
      };
      setLocation(loc);
      return loc;
    } catch {
      return null;
    }
  }, [setLocation]);

  const value = useMemo(
    () => ({ location, loading, setLocation, useCurrentGps }),
    [location, loading, setLocation, useCurrentGps]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useAppLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useAppLocation must be used within LocationProvider');
  return ctx;
}
