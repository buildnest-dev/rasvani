'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { firebaseAuth, firebaseConfigured } from '@/lib/firebase/client';
import { syncRoleAction } from '@/app/actions/session';

export type AppRole = 'admin' | 'baker' | 'customer';
type AuthValue = {
  user: User | null; role: AppRole | null; loading: boolean; configured: boolean;
  signOut: () => Promise<void>; getToken: () => Promise<string>;
};
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), async (next) => {
      setUser(next);
      if (!next) { setRole(null); setLoading(false); return; }
      try {
        const token = await next.getIdToken();
        setRole(await syncRoleAction(token));
      } catch { setRole('customer'); }
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user, role, loading, configured: firebaseConfigured,
    signOut: async () => { await fbSignOut(firebaseAuth()); },
    getToken: async () => {
      const current = firebaseAuth().currentUser;
      if (!current) throw new Error('Please sign in.');
      return current.getIdToken(true);
    },
  }), [user, role, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
