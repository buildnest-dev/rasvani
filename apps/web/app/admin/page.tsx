'use client';

import { AdminDashboard } from '@/components/admin-dashboard';
import { AuthPanel } from '@/components/auth-panel';
import { useAuth } from '@/components/auth-provider';

export default function AdminPage() {
  const { user, role, loading, configured, roleError, signOut } = useAuth();
  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · Admin</div><h1>Admin</h1><p className="section-intro">Connect customers with bakers and restaurants, handle delivery or pickup, payments, products and everything else.</p></div>
    {!configured ? <p className="status" role="status">Firebase is not configured yet.</p>
      : loading ? <p className="status" role="status">Checking your sign-in…</p>
      : !user ? <AuthPanel audience="admin" />
      : role !== 'admin' ? <div className="form-shell"><h2>Not an admin account</h2><p>{user.email} is not registered as an admin. Ask the Rasvani owner to add this email.</p>{!user.emailVerified && <p className="status" role="alert">This email is not verified yet. Sign in with Google, or verify the email first.</p>}{roleError && <p className="status" role="alert">Server check failed: {roleError}. The server settings (FIREBASE_SERVICE_ACCOUNT_JSON / ADMIN_EMAILS) need fixing.</p>}<button className="btn secondary" type="button" onClick={() => void signOut()}>Sign out</button></div>
      : <><p className="notice">Signed in as {user.email} · <button className="text-link" type="button" onClick={() => void signOut()}>Sign out</button></p><AdminDashboard /></>}
  </section>;
}
