'use client';

import { AuthPanel } from '@/components/auth-panel';
import { useAuth } from '@/components/auth-provider';
import { BakerDashboard } from '@/components/baker-dashboard';

export default function BakerPage() {
  const { user, role, loading, configured, signOut } = useAuth();
  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · For bakers and restaurants</div><h1>Your Rasvani orders</h1><p className="section-intro">Orders that Rasvani connects to you appear here. Accept, prepare and mark them ready.</p></div>
    {!configured ? <p className="status" role="status">Firebase is not configured yet.</p>
      : loading ? <p className="status" role="status">Checking your sign-in…</p>
      : !user ? <AuthPanel audience="baker" />
      : role !== 'baker' ? <div className="form-shell"><h2>Not a registered baker</h2><p>{user.email} has not been registered as a baker or restaurant. Please contact Rasvani at rasvanifoods@gmail.com to get registered.</p><button className="btn secondary" type="button" onClick={() => void signOut()}>Sign out</button></div>
      : <><p className="notice">Signed in as {user.email} · <button className="text-link" type="button" onClick={() => void signOut()}>Sign out</button></p><BakerDashboard /></>}
  </section>;
}
