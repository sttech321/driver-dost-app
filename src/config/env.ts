import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, any>;

const API_PORT = 4000;

/**
 * Figure out the backend base URL automatically so the same build works on
 * web AND on a phone without hand-editing IPs:
 *  - Web: call the same host the page was served from (localhost OR a LAN IP).
 *  - Native (Expo Go): reuse the Metro dev-server's LAN IP (e.g. 192.168.1.35).
 * An explicit EXPO_PUBLIC_API_URL always wins if you need to override.
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:${API_PORT}/api`;
  }

  // Expo dev server host, e.g. "192.168.1.35:8081".
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}/api`;
  }

  return extra.apiUrl || `http://localhost:${API_PORT}/api`;
}

export const env = {
  apiUrl: resolveApiUrl(),

  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.firebase?.apiKey || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extra.firebase?.authDomain || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.firebase?.projectId || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.firebase?.appId || '',
  },

  google: {
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.googleAuth?.webClientId || '',
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleAuth?.iosClientId || '',
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.googleAuth?.androidClientId || '',
  },
};

export const isFirebaseConfigured = () => Boolean(env.firebase.apiKey && env.firebase.projectId);
export const isGoogleConfigured = () =>
  Boolean(env.google.webClientId || env.google.androidClientId || env.google.iosClientId);
