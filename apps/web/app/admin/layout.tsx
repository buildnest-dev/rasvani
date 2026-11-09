'use client';

import type { ReactNode } from 'react';
import { AdminDashboard } from '@/components/admin-dashboard';
import { AuthPanel } from '@/components/auth-panel';
import { useAuth } from '@/components/auth-provider';

/** One persistent dashboard for every admin page, so live data is loaded once and sections switch instantly. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, role, loading, configured, roleError, signOut } = useAuth();
  if (configured && !loading && user && role === 'admin') return <><AdminDashboard />{children}</>;
  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · Admin</div><h1>Admin</h1><p className="section-intro">Sign in with your admin account to manage orders, foods, bakers and payments.</p></div>
    {!configured ? <p className="status" role="status">Firebase is not configured yet.</p>
      : loading ? <p className="status" role="status">Checking your sign-in…</p>
      : !user ? <AuthPanel audience="admin" />
      : <div className="form-shell"><h2>Not an admin account</h2><p>{user.email} is not registered as an admin. Ask the Rasvani owner to add this email.</p>{!user.emailVerified && <p className="status" role="alert">This email is not verified yet. Sign in with Google, or verify the email first.</p>}{roleError && <p className="status" role="alert">Server check failed: {roleError}. The server settings (FIREBASE_SERVICE_ACCOUNT_JSON / ADMIN_EMAILS) need fixing.</p>}<button className="btn secondary" type="button" onClick={() => void signOut()}>Sign out</button></div>}
    {children}
  </section>;
}
