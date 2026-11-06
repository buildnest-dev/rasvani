import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Public web configuration (safe to expose; access is controlled by Firestore rules and Auth).
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'rasvani2026.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'rasvani2026',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'rasvani2026.firebasestorage.app',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.appId);

export function firebaseApp(): FirebaseApp {
  if (!firebaseConfigured) throw new Error('Firebase is not configured.');
  return getApps().length ? getApp() : initializeApp(config);
}
export const firebaseAuth = (): Auth => getAuth(firebaseApp());
export const firestore = (): Firestore => getFirestore(firebaseApp());
