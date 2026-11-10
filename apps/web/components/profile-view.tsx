'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getProfileAction, saveProfileAction, type CustomerProfile } from '@/app/actions/session';
import { useAuth } from '@/components/auth-provider';
import { biharDistricts } from '@/lib/bihar-districts';
import { firebaseAuth } from '@/lib/firebase/client';
import { firestore } from '@/lib/firebase/firestore';
import { formatPaise } from '@/lib/money';
import { FINAL_STATUSES, payablePaise, statusLabel, type OrderDoc } from '@/lib/orders';

const empty: CustomerProfile = { name: '', phone: '', district: '', pincode: '', address: '', landmark: '' };

/** Customer-only profile page: who you are, your saved delivery details, and a quick view of your orders. */
export function ProfileView() {
  const { user, role, signOut, getToken } = useAuth();
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [saved, setSaved] = useState<CustomerProfile | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [tone, setTone] = useState<'ok' | 'error'>('ok');
  const [mailNote, setMailNote] = useState('');

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(firestore(), 'orders'), where('userId', '==', user.uid)), (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ ...(d.data() as Omit<OrderDoc, 'id'>), id: d.id }));
      rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      setOrders(rows);
    }, () => setOrders([]));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void getToken().then((token) => getProfileAction(token)).then((result) => { if (alive) setSaved(result.ok ? result.profile : null); }).catch(() => { if (alive) setSaved(null); });
    return () => { alive = false; };
  }, [user, getToken]);

  const stats = useMemo(() => {
    const list = orders ?? [];
    const delivered = list.filter((o) => o.status === 'delivered');
    return {
      total: list.length,
      open: list.filter((o) => !(FINAL_STATUSES as readonly string[]).includes(o.status)).length,
      delivered: delivered.length,
      spent: delivered.reduce((sum, o) => sum + payablePaise(o), 0),
    };
  }, [orders]);

  const save = useCallback(async (form: HTMLFormElement) => {
    const d = new FormData(form);
    const input = Object.fromEntries(['name', 'phone', 'district', 'pincode', 'address', 'landmark'].map((k) => [k, String(d.get(k) ?? '').trim()]));
    setBusy(true); setNote('');
    try {
      const result = await saveProfileAction(await getToken(), input);
      if (result.ok) { setSaved(input as CustomerProfile); setTone('ok'); setNote('Saved. Checkout will now be pre-filled with these details.'); }
      else { setTone('error'); setNote(result.error); }
    } catch { setTone('error'); setNote('Could not save right now. Please try again.'); }
    finally { setBusy(false); }
  }, [getToken]);

  async function resend() {
    try { if (user) { await sendEmailVerification(user); setMailNote('Verification link sent. Please check your inbox (and spam).'); } }
    catch { setMailNote('Please wait a minute before asking for another email.'); }
  }
  async function refresh() {
    try { await firebaseAuth().currentUser?.reload(); await firebaseAuth().currentUser?.getIdToken(true); window.location.reload(); }
    catch { setMailNote('Could not refresh. Please sign in again.'); }
  }

  if (!user) return null;
  const values = saved ?? empty;
  const displayName = (values.name || user.displayName || user.email?.split('@')[0] || 'Rasvani friend').trim();
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'R';
  const since = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';
  const latest = orders?.[0];

  return <section className="pf-page"><div className="wrap pf-shell">
    <header className="pf-hero">
      <div className="pf-avatar" aria-hidden="true">{initials}</div>
      <div className="pf-id">
        <h1>{displayName}</h1>
        <p className="pf-mail">{user.email} {user.emailVerified ? <span className="pf-tag ok">✓ Verified</span> : <span className="pf-tag warn">Not verified</span>}</p>
        {since && <p className="pf-since">Rasvani family since {since}</p>}
      </div>
      <div className="pf-hero-actions"><Link className="btn" href="/shop">Shop foods</Link><button className="pf-out" type="button" onClick={() => void signOut()}>Sign out</button></div>
    </header>

    {!user.emailVerified && <div className="pf-banner" role="status"><div><b>Verify your email to place orders.</b> Open the link we sent you.</div>
      <div><button className="btn" type="button" onClick={refresh}>I have verified</button> <button className="text-link" type="button" onClick={resend}>Send the link again</button></div>
      {mailNote && <p>{mailNote}</p>}</div>}

    <div className="pf-stats" aria-label="Your orders at a glance">
      <div><b>{orders === null ? '—' : stats.total}</b><span>Orders placed</span></div>
      <div><b>{orders === null ? '—' : stats.open}</b><span>On the way</span></div>
      <div><b>{orders === null ? '—' : stats.delivered}</b><span>Delivered</span></div>
      <div><b>{orders === null ? '—' : formatPaise(stats.spent)}</b><span>Enjoyed so far</span></div>
    </div>

    <div className="pf-grid">
      <form className="pf-card" onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget); }} aria-labelledby="pf-form-title">
        <h2 id="pf-form-title">Your details &amp; delivery address</h2>
        <p className="pf-help">Saved once, filled in for you at checkout. Delivery is available only in Bihar.</p>
        {saved === undefined ? <p className="notice" role="status">Loading your details…</p> : <div className="pf-fields" key={JSON.stringify(values)}>
          <label>Full name<input name="name" defaultValue={values.name || user.displayName || ''} required minLength={2} maxLength={80} autoComplete="name" /></label>
          <label>Mobile number<input name="phone" defaultValue={values.phone} inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national" placeholder="10-digit number" /></label>
          <label>District<select name="district" defaultValue={values.district}><option value="">Choose district</option>{biharDistricts.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
          <label>Pincode<input name="pincode" defaultValue={values.pincode} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" /></label>
          <label className="wide">Address<textarea name="address" defaultValue={values.address} rows={3} maxLength={300} autoComplete="street-address" /></label>
          <label className="wide">Landmark (optional)<input name="landmark" defaultValue={values.landmark} maxLength={120} /></label>
        </div>}
        <div className="pf-save"><button className="btn" type="submit" disabled={busy || saved === undefined}>{busy ? 'Saving…' : 'Save details'}</button>
          {note && <span className={`pf-note ${tone}`} role="status">{note}</span>}</div>
      </form>

      <aside className="pf-side">
        <div className="pf-card">
          <h2>Latest order</h2>
          {orders === null ? <p className="notice" role="status">Loading…</p> : !latest ? <><p className="notice">You have not placed an order yet.</p><Link className="btn" href="/shop">Browse the shop</Link></>
            : <><p className="pf-order"><b>{latest.orderNumber}</b><span className={`pf-tag ${latest.status === 'cancelled' ? 'warn' : 'ok'}`}>{statusLabel(latest.status)}</span></p>
              <p className="pf-help">{latest.lines?.map((l) => `${l.name}${l.sizeLabel ? ` (${l.sizeLabel})` : ''} × ${l.qty}`).join(', ')}</p>
              <p className="pf-total">{formatPaise(payablePaise(latest))}</p>
              <Link className="text-link" href="/account/orders">Track or review →</Link></>}
        </div>
        <div className="pf-card">
          <h2>Quick links</h2>
          <ul className="pf-links"><li><Link href="/account/orders">📦 My orders</Link></li><li><Link href="/cart">🛒 My cart</Link></li><li><Link href="/shop">🍯 Shop all foods</Link></li><li><Link href="/bihar">🗺️ Explore Bihar districts</Link></li></ul>
          {role === 'admin' && <p className="pf-help">You are an admin. Use the admin site to manage orders.</p>}
          {role === 'baker' && <p className="pf-help">You are a registered baker. Use the baker site for your orders.</p>}
        </div>
      </aside>
    </div>
  </div></section>;
}
