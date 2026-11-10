import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

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

// Firestore (~245 KiB) lives in its own module (./firestore) on purpose: every page needs Auth, for the
// sign-in state in the header, but only the pages that actually read/write live data (cart, orders, admin,
// the catalogue) need Firestore. Keeping the two imports apart lets the bundler leave Firestore out of
// pages — like the homepage — that only need to know whether someone is signed in.
