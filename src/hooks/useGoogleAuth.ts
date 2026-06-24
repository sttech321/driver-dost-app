import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { env, isGoogleConfigured, isFirebaseConfigured } from '@/config/env';
import { getFirebaseAuth } from '@/config/firebase';
import { authApi } from '@/api/auth.api';
import { AuthResult } from '@/api/types';

WebBrowser.maybeCompleteAuthSession();

/**
 * "Continue with Google" — runs the Google OAuth flow, converts the result to
 * a Firebase credential, then exchanges the Firebase ID token with our backend.
 * Returns { promptAsync, ready } so the button can stay disabled until config
 * is present.
 */
export function useGoogleAuth(onSuccess: (result: AuthResult) => void, onError: (msg: string) => void) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: env.google.webClientId || undefined,
    iosClientId: env.google.iosClientId || undefined,
    androidClientId: env.google.androidClientId || undefined,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (response?.type !== 'success') return;
    (async () => {
      try {
        setBusy(true);
        const idToken = response.params?.id_token;
        const auth = getFirebaseAuth();
        if (!idToken || !auth) throw new Error('Google sign-in is not fully configured');
        const credential = GoogleAuthProvider.credential(idToken);
        const cred = await signInWithCredential(auth, credential);
        const firebaseIdToken = await cred.user.getIdToken();
        const result = await authApi.firebase(firebaseIdToken);
        onSuccess(result);
      } catch (e: any) {
        onError(e?.message ?? 'Google sign-in failed');
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    ready: Boolean(request) && isGoogleConfigured() && isFirebaseConfigured(),
    busy,
    signInWithGoogle: () => promptAsync(),
  };
}
