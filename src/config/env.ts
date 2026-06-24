import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, any>;

// EXPO_PUBLIC_* env vars take precedence over app.json -> extra defaults.
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || 'http://localhost:4000/api',

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
