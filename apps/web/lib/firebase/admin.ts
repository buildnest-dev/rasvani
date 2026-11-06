import 'server-only';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export type Role = 'admin' | 'baker' | 'customer';
export type Session = { uid: string; email: string; emailVerified: boolean; role: Role };

function adminApp(): App {
  if (getApps().length) return getApp();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set.');
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}
export const adminDb = () => getFirestore(adminApp());

const adminEmails = () => (process.env.ADMIN_EMAILS ?? '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);

/** Verifies the Firebase ID token and (re)computes the caller's role from server-side rules only. */
export async function verifySession(idToken: string): Promise<Session> {
  const decoded = await getAuth(adminApp()).verifyIdToken(idToken, true);
  const email = (decoded.email ?? '').toLowerCase();
  const emailVerified = decoded.email_verified === true;
  let role: Role = 'customer';
  let bakerName: string | null = null;
  if (emailVerified && email) {
    if (adminEmails().includes(email)) role = 'admin';
    else {
      const invite = await adminDb().collection('bakerInvites').doc(email).get();
      if (invite.exists && invite.data()?.active !== false) { role = 'baker'; bakerName = invite.data()?.name ?? null; }
    }
  }
  const ref = adminDb().collection('roles').doc(decoded.uid);
  const current = await ref.get();
  if (!current.exists || current.data()?.role !== role || current.data()?.email !== email) {
    await ref.set({ role, email, ...(bakerName ? { name: bakerName } : {}), updatedAt: new Date().toISOString() }, { merge: true });
  }
  return { uid: decoded.uid, email, emailVerified, role };
}

export async function requireRole(idToken: string, allowed: Role[]): Promise<Session> {
  const session = await verifySession(idToken);
  if (!allowed.includes(session.role)) throw new Error('Not permitted');
  return session;
}
