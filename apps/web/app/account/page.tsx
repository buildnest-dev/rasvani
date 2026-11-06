'use client';

import Link from 'next/link';
import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { AuthPanel } from '@/components/auth-panel';
import { useAuth } from '@/components/auth-provider';
import { firebaseAuth } from '@/lib/firebase/client';

export default function AccountPage() {
  const { user, role, loading, configured, signOut } = useAuth();
  const [note, setNote] = useState('');

  async function resend() {
    try { if (user) { await sendEmailVerification(user); setNote('Verification link sent. Please check your inbox (and spam).'); } }
    catch { setNote('Please wait a minute before asking for another email.'); }
  }
  async function refresh() {
    try { await firebaseAuth().currentUser?.reload(); await firebaseAuth().currentUser?.getIdToken(true); window.location.reload(); }
    catch { setNote('Could not refresh. Please sign in again.'); }
  }

  return <section className="section"><div className="wrap">
    <div className="eyebrow">Customer account</div>
    <h1 style={{ font: '500 clamp(38px,5vw,56px)/1.1 var(--serif)' }}>Your Rasvani account.</h1>
    {!configured ? <div className="form-shell" style={{ marginTop: 24 }}><p>Sign-in is being set up. Please check back shortly.</p></div>
      : loading ? <p className="status" role="status">Checking your sign-in…</p>
      : !user ? <><p className="section-intro">Sign in with Google, Apple or your email to order food in Bihar and track your orders.</p><AuthPanel audience="customer" /></>
      : <div className="form-shell" style={{ marginTop: 24 }}>
        <p>You are signed in as <strong>{user.email}</strong>.</p>
        {!user.emailVerified && <div className="status" role="status"><p>Your email is not verified yet. Please open the link we sent you. You need a verified email to place an order.</p><p><button className="btn secondary" type="button" onClick={refresh}>I have verified</button> <button className="text-link" type="button" onClick={resend}>Send the link again</button></p></div>}
        {note && <p className="notice" role="status">{note}</p>}
        <p><Link className="btn secondary" href="/account/orders">My orders</Link> <Link className="btn secondary" href="/shop">Shop</Link> <Link className="btn secondary" href="/cart">Cart</Link></p>
        {role === 'admin' && <p className="notice">You are an admin. Use the admin site (admin.rasvani.com) to manage orders.</p>}
        {role === 'baker' && <p className="notice">You are a registered baker. Use the baker site (baker.rasvani.com) for your orders.</p>}
        <p><button className="btn secondary" type="button" onClick={() => void signOut()}>Sign out</button></p>
      </div>}
  </div></section>;
}
