'use client';

import Image from 'next/image';
import { AuthPanel } from '@/components/auth-panel';
import { useAuth } from '@/components/auth-provider';
import { ProfileView } from '@/components/profile-view';

const perks = [
  ['Home-made, vegetarian', 'Foods from Bihar’s home bakers and local kitchens.'],
  ['Delivery or takeaway', 'Pay by cash on delivery or by UPI QR.'],
  ['Track every order', 'Rasvani confirms each order and any delivery charge.'],
];

export default function AccountPage() {
  const { user, loading, configured } = useAuth();

  if (configured && !loading && user) return <ProfileView />;

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
        : null}
    </div>
  </div></section>;
}
