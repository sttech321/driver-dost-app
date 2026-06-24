import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { env, isFirebaseConfigured } from './env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Lazily initialise Firebase only when configured, so the app runs fine in
// dev without Firebase keys (phone OTP then uses the backend fallback flow).
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (auth) return auth;

  app = getApps().length ? getApp() : initializeApp(env.firebase);
  auth = getAuth(app);
  return auth;
}
