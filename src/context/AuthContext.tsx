import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { setAuthToken, getAuthToken } from '@/api/client';
import { authApi } from '@/api/auth.api';
import { userApi } from '@/api/user.api';
import { AuthResult, User } from '@/api/types';
import { connectSocket, disconnectSocket } from '@/realtime/socket';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True once we've granted location permission (gates the Dashboard). */
  locationGranted: boolean;
  setLocationGranted: (v: boolean) => void;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationGranted, setLocationGranted] = useState(false);

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
    () => ({ user, loading, locationGranted, setLocationGranted, signIn, signOut, refreshUser }),
    [user, loading, locationGranted, signIn, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { authApi };
