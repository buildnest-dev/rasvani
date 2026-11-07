'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { AuthPanel } from '@/components/auth-panel';
import { useAuth } from '@/components/auth-provider';
import { firebaseAuth } from '@/lib/firebase/client';

const perks = [
  ['Home-made, vegetarian', 'Foods from Bihar’s home bakers and local kitchens.'],
  ['Delivery or takeaway', 'Pay by cash on delivery or by UPI QR.'],
  ['Track every order', 'Rasvani confirms each order and any delivery charge.'],
];

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

  return <section className="au-page"><div className="wrap au-shell">
    <aside className="au-side" aria-label="Why sign in">
      <Image src="/images/rasvani-feast-hero.webp" alt="" fill sizes="(max-width: 900px) 100vw, 45vw" className="au-side-img" priority />
      <div className="au-side-shade" aria-hidden="true" />
      <div className="au-side-copy">
        <span className="au-pill">Live in Bihar</span>
        <h1>Ghar ka swad,<br />ek sign-in door.</h1>
        <ul>{perks.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}</ul>
      </div>
    </aside>
    <div className="au-main">
      {!configured ? <div className="au-card"><div className="au-head"><h2>Sign-in is being set up</h2><p>Please check back shortly.</p></div></div>
        : loading ? <div className="au-card" role="status"><div className="au-skel" /><div className="au-skel s2" /><div className="au-skel s3" /></div>
        : !user ? <AuthPanel audience="customer" />
        : <div className="au-card">
          <div className="au-head"><h2>You are signed in</h2><p>{user.email}</p></div>
          {!user.emailVerified && <div className="au-msg au-warn" role="status"><p>Verify your email to place orders. Open the link we sent you.</p><p><button className="au-submit au-small" type="button" onClick={refresh}>I have verified</button> <button className="au-link" type="button" onClick={resend}>Send the link again</button></p></div>}
          {note && <p className="au-msg au-ok" role="status">{note}</p>}
          <div className="au-actions"><Link className="au-submit" href="/shop">Shop foods</Link><Link className="au-ghost" href="/account/orders">My orders</Link><Link className="au-ghost" href="/cart">Cart</Link></div>
          {role === 'admin' && <p className="au-note">You are an admin. Use the admin site to manage orders.</p>}
          {role === 'baker' && <p className="au-note">You are a registered baker. Use the baker site for your orders.</p>}
          <p className="au-foot"><button className="au-link" type="button" onClick={() => void signOut()}>Sign out</button></p>
        </div>}
    </div>
  </div></section>;
}
