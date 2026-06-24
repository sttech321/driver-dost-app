import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { setAuthToken, getAuthToken } from '@/api/client';
import { authApi } from '@/api/auth.api';
import { userApi } from '@/api/user.api';
import { AuthResult, User } from '@/api/types';
import { connectSocket, disconnectSocket } from '@/realtime/socket';

const locGrantKey = (userId: string) => `dd_loc_granted_${userId}`;

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True once the user has granted location permission (gates the Dashboard). */
  locationGranted: boolean;
  /** False until we've checked the persisted/OS permission for the current user. */
  locationChecked: boolean;
  setLocationGranted: (v: boolean) => void;
  /** Grant + persist for this user, so we never ask again on later logins. */
  markLocationGranted: () => Promise<void>;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);

  // Restore session on launch.
  useEffect(() => {
    (async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          const me = await userApi.me();
          setUser(me);
        }
      } catch {
        await setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Resolve location-permission state per logged-in user: skip the permission
  // screen if they granted it before (persisted) or the OS already allows it.
  useEffect(() => {
    let active = true;
    if (!user) {
      setLocationGranted(false);
      setLocationChecked(false);
      return;
    }
    setLocationChecked(false);
    (async () => {
      let granted = false;
      try {
        const persisted = await AsyncStorage.getItem(locGrantKey(user.id));
        if (persisted === '1') {
          granted = true;
        } else {
          const perm = await Location.getForegroundPermissionsAsync();
          if (perm.granted) {
            granted = true;
            AsyncStorage.setItem(locGrantKey(user.id), '1').catch(() => {});
          }
        }
      } catch {
        /* fall back to asking */
      }
      if (active) {
        setLocationGranted(granted);
        setLocationChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Persist the grant so future logins skip the permission screen.
  const markLocationGranted = useCallback(async () => {
    setLocationGranted(true);
    if (user) await AsyncStorage.setItem(locGrantKey(user.id), '1').catch(() => {});
  }, [user]);

  // Keep one realtime socket alive while logged in.
  useEffect(() => {
    let active = true;
    if (user) {
      getAuthToken().then((token) => {
        if (active && token) connectSocket(token);
      });
    } else {
      disconnectSocket();
    }
    return () => {
      active = false;
    };
  }, [user]);

  const signIn = useCallback(async (result: AuthResult) => {
    await setAuthToken(result.token);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    await setAuthToken(null);
    setUser(null);
    setLocationGranted(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await userApi.me());
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      locationGranted,
      locationChecked,
      setLocationGranted,
      markLocationGranted,
      signIn,
      signOut,
      refreshUser,
    }),
    [user, loading, locationGranted, locationChecked, markLocationGranted, signIn, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { authApi };
