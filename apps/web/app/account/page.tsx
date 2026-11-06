import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AuthForm } from './auth-form';
import { signOutAction } from './actions';
import { getCurrentUserRoles } from '@/lib/auth/authorization';
export const metadata: Metadata = { title: 'Account' };

export default async function AccountPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  let email: string | null = null;
  let roles: string[] = [];
  if (configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      email = data.user?.email ?? null;
      if (data.user) roles = await getCurrentUserRoles();
    } catch { /* Keep the page informative when environment setup is incomplete. */ }
  }

  return <section className="section"><div className="wrap">
    <div className="eyebrow">Customer account</div>
    <h1 style={{ font: '500 clamp(38px,5vw,56px)/1.1 var(--serif)' }}>Your Rasvani account.</h1>
    {!configured ? <div className="form-shell" style={{ marginTop: 24 }}><p>Secure account services are being prepared. Sign-in, saved orders and profile details will be available here when account services open.</p><div className="cta-row"><a className="btn" href="/for-producers">Producer partnerships</a><Link className="btn secondary" href="/explore-india">Explore India</Link></div></div>
      : email ? <div className="form-shell" style={{ marginTop: 24 }}><p>You are signed in as <strong>{email}</strong>.</p><p className="notice">Account profile and order features will be introduced in their approved phases.</p><p><a className="btn secondary" href="/account/orders">View your orders</a> <a className="btn secondary" href="/business-portal">Business buyer workspace</a></p>{roles.some((role) => ['warehouse_operator','quality_reviewer','admin','super_admin'].includes(role)) && <p><a className="btn secondary" href="/warehouse">Open warehouse workspace</a></p>}{roles.some((role) => ['content_editor','quality_reviewer','admin','super_admin'].includes(role)) && <p><a className="btn secondary" href="/editorial">Open editorial workspace</a></p>}{roles.some((role) => ['admin','super_admin'].includes(role)) && <p><a className="btn secondary" href="/admin">Open operations dashboard</a></p>}{roles.includes('producer') && <p><a className="btn secondary" href="/producer-portal">Open producer portal</a></p>}<form action={signOutAction}><button className="btn secondary" type="submit">Sign out</button></form></div>
      : <><p className="section-intro">Create an account or sign in. Email verification and password policies must also be configured in the connected Supabase project.</p><AuthForm /></>}
  </div></section>;
}
