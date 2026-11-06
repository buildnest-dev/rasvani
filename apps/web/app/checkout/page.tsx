'use client';

import { sendEmailVerification } from 'firebase/auth';
import { useState } from 'react';
import { AuthPanel } from '@/components/auth-panel';
import { useAuth } from '@/components/auth-provider';
import { firebaseAuth } from '@/lib/firebase/client';
import { CheckoutForm } from './checkout-form';

export default function CheckoutPage() {
  const { user, loading, configured } = useAuth();
  const [note, setNote] = useState('');
  async function resend() {
    try { if (user) { await sendEmailVerification(user); setNote('Verification link sent. Check your inbox.'); } } catch { setNote('Please wait a minute and try again.'); }
  }
  async function refresh() {
    try { await firebaseAuth().currentUser?.reload(); await firebaseAuth().currentUser?.getIdToken(true); window.location.reload(); } catch { setNote('Please sign in again.'); }
  }
  return <section className="wrap cart-page">
    <div className="page-hero"><div className="eyebrow">Checkout</div><h1>Place your order</h1><p className="section-intro">Home delivery in selected areas of Bihar, or order online and collect from a Rasvani partner shop.</p></div>
    {!configured ? <p className="status" role="status">Ordering is being set up. Please check back shortly.</p>
      : loading ? <p className="status" role="status">Checking your sign-in…</p>
      : !user ? <><p className="status" role="status">Please sign in or create an account first, so you can track your order under My orders.</p><AuthPanel audience="customer" /></>
      : !user.emailVerified ? <div className="status" role="status"><p>Please verify your email to place an order. We sent a link to {user.email}.</p><p><button className="btn secondary" type="button" onClick={refresh}>I have verified</button> <button className="text-link" type="button" onClick={resend}>Send the link again</button></p>{note && <p className="notice">{note}</p>}</div>
      : <CheckoutForm />}
  </section>;
}
