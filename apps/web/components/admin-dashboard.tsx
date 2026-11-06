'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { UpiQr } from '@/components/upi-qr';
import {
  deleteBakerProfileAction, inviteBakerAction, publishProductAction, removeBakerAction, saveBakerProfileAction,
  savePaymentSettingsAction, setOrderHandlingAction, setOrderStatusAction, setProductPriceAction, setProductVisibilityAction,
} from '@/app/actions/session';
import { biharDistricts } from '@/lib/bihar-districts';
import { firestore } from '@/lib/firebase/client';
import { formatPaise } from '@/lib/money';
import { FINAL_STATUSES, ORDER_STATUSES, payablePaise, statusLabel, upiLink, type BakerProfile, type OrderDoc, type PaymentSettings } from '@/lib/orders';

type ProductRow = { id: string; name: string; sku: string; makerName: string | null; makerDistrict?: string | null; pricePaise: number; visible: boolean };
type BakerLogin = { id: string; email: string; name?: string };
type Tab = 'orders' | 'products' | 'bakers' | 'payment';
type Filter = 'new' | 'progress' | 'done' | 'all';
const isFinal = (status: string) => (FINAL_STATUSES as readonly string[]).includes(status);

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; osc.frequency.value = 880; gain.gain.value = 0.15;
    osc.start(); osc.stop(ctx.currentTime + 0.25); setTimeout(() => void ctx.close(), 400);
  } catch { /* sound is optional */ }
}

export function AdminDashboard() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');
  const [filter, setFilter] = useState<Filter>('new');
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [profiles, setProfiles] = useState<BakerProfile[]>([]);
  const [logins, setLogins] = useState<BakerLogin[]>([]);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [alertsOn, setAlertsOn] = useState(false);
  const [editing, setEditing] = useState<BakerProfile | null>(null);
  const firstLoad = useRef(true);
  const baseTitle = useRef('');

  useEffect(() => { baseTitle.current = document.title; if ('Notification' in window) setAlertsOn(Notification.permission === 'granted'); }, []);

  useEffect(() => {
    const db = firestore();
    const stops = [
      onSnapshot(collection(db, 'orders'), (snap) => {
        const rows = snap.docs.map((d) => ({ ...(d.data() as Omit<OrderDoc, 'id'>), id: d.id }));
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(rows);
        if (firstLoad.current) { firstLoad.current = false; return; }
        const fresh = snap.docChanges().filter((change) => change.type === 'added');
        if (fresh.length) {
          const first = fresh[0].doc.data() as OrderDoc;
          setAlertText(`New order ${first.orderNumber} from ${first.address?.name ?? 'a customer'}`);
          beep();
          if ('Notification' in window && Notification.permission === 'granted') new Notification('New Rasvani order', { body: `${first.orderNumber} · ${first.address?.name ?? ''}` });
        }
      }, () => setMessage('Could not load orders. Check that Firestore rules are published and you are an admin.')),
      onSnapshot(collection(db, 'products'), (snap) => setProducts(snap.docs.map((d) => ({ ...(d.data() as Omit<ProductRow, 'id'>), id: d.id })).sort((a, b) => a.name.localeCompare(b.name))), () => undefined),
      onSnapshot(collection(db, 'bakerProfiles'), (snap) => setProfiles(snap.docs.map((d) => ({ ...(d.data() as Omit<BakerProfile, 'id'>), id: d.id })).sort((a, b) => a.name.localeCompare(b.name))), () => undefined),
      onSnapshot(query(collection(db, 'roles'), where('role', '==', 'baker')), (snap) => setLogins(snap.docs.map((d) => ({ ...(d.data() as Omit<BakerLogin, 'id'>), id: d.id }))), () => undefined),
      onSnapshot(doc(db, 'settings', 'payment'), (snap) => setPayment(snap.exists() ? (snap.data() as PaymentSettings) : null), () => undefined),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  const newCount = orders.filter((order) => order.status === 'placed').length;
  useEffect(() => { document.title = newCount ? `(${newCount} new) Rasvani admin` : baseTitle.current || 'Rasvani admin'; }, [newCount]);

  const act = useCallback(async (task: (token: string) => Promise<{ ok: boolean; error?: string }>, success = 'Saved.') => {
    setBusy(true); setMessage('');
    let ok = false;
    try { const result = await task(await getToken()); ok = result.ok; setMessage(result.ok ? success : result.error ?? 'Could not save.'); }
    catch { setMessage('Something went wrong. Please try again.'); }
    setBusy(false);
    return ok;
  }, [getToken]);

  async function enableAlerts() {
    if (!('Notification' in window)) { setMessage('This browser cannot show notifications. The sound and banner still work while this page is open.'); return; }
    const result = await Notification.requestPermission();
    setAlertsOn(result === 'granted'); beep();
  }

  const shown = orders.filter((order) => filter === 'all' ? true : filter === 'new' ? order.status === 'placed' : filter === 'done' ? isFinal(order.status) : !isFinal(order.status) && order.status !== 'placed');
  const count = (f: Filter) => orders.filter((order) => f === 'all' ? true : f === 'new' ? order.status === 'placed' : f === 'done' ? isFinal(order.status) : !isFinal(order.status) && order.status !== 'placed').length;
  const profileById = (id: string | null | undefined) => profiles.find((p) => p.id === id);
  const todayRevenue = orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + payablePaise(o), 0);

  return <div className="admin-dash">
    <div className="admin-stats">
      <div><span>New orders</span><strong>{newCount}</strong></div>
      <div><span>In progress</span><strong>{count('progress')}</strong></div>
      <div><span>Completed</span><strong>{orders.filter((o) => o.status === 'delivered').length}</strong></div>
      <div><span>Payment received</span><strong>{formatPaise(todayRevenue)}</strong></div>
    </div>
    <div className="admin-tabs" role="tablist">
      {([['orders', `Orders${newCount ? ` · ${newCount} new` : ''}`], ['products', 'Foods & prices'], ['bakers', 'Bakers & restaurants'], ['payment', 'Payment QR']] as [Tab, string][]).map(([item, label]) =>
        <button key={item} role="tab" aria-selected={tab === item} className={`btn ${tab === item ? '' : 'secondary'}`} onClick={() => setTab(item)}>{label}</button>)}
    </div>
    {alertText && <div className="admin-alert" role="alert"><strong>{alertText}</strong><button className="btn secondary" type="button" onClick={() => { setAlertText(''); setTab('orders'); setFilter('new'); }}>View</button></div>}
    {!alertsOn && tab === 'orders' && <p className="notice">Want a pop-up when an order arrives? <button type="button" className="text-link" onClick={() => void enableAlerts()}>Turn on order alerts</button> (sound plays while this page is open).</p>}
    {message && <p className="status" role="status">{message}</p>}

    {tab === 'orders' && <>
      <div className="admin-filters">{([['new', 'New'], ['progress', 'In progress'], ['done', 'Done'], ['all', 'All']] as [Filter, string][]).map(([f, label]) =>
        <button key={f} type="button" aria-pressed={filter === f} className={`chip ${filter === f ? 'is-on' : ''}`} onClick={() => setFilter(f)}>{label} <b>{count(f)}</b></button>)}</div>
      {shown.length === 0 ? <div className="form-shell"><h2>Nothing here</h2><p>New orders appear here the moment a customer places them.</p></div> : <div className="customer-order-list">
        {shown.map((order) => {
          const a = order.address; const final = isFinal(order.status);
          const place = [a.address, a.landmark, a.district, a.pincode].filter(Boolean).join(', ');
          const baker = profileById(order.bakerProfileId);
          const makers = Array.from(new Set(order.lines.map((l) => l.makerName).filter(Boolean)));
          return <article className={`customer-order-card admin-order ${order.status === 'placed' ? 'is-new' : ''}`} key={order.id}>
            <div className="customer-order-head"><div><span className="eyebrow">{order.orderNumber}</span><h2>{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</h2></div>
              <div className="customer-order-status"><span className={`pill st-${order.status}`}>{statusLabel(order.status)}</span><span className={`pill pay-${order.paymentStatus}`}>{order.paymentMethod === 'upi' ? 'UPI' : 'COD'} · {statusLabel(order.paymentStatus)}</span></div></div>
            <div className="admin-two">
              <div><h3>Customer</h3><p><strong>{a.name}</strong><br /><a className="text-link" href={`tel:${a.phone}`}>{a.phone}</a><br />{order.customerEmail}</p>
                <p className="notice"><strong>{a.fulfilment === 'pickup' ? 'TAKEAWAY (collect)' : 'HOME DELIVERY'}</strong><br />{place || 'No address given'}{a.location ? <><br /><a className="text-link" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${a.location.lat},${a.location.lng}`}>Open customer map location</a></> : null}</p>
                {order.notes && <p className="notice">Customer note: {order.notes}</p>}</div>
              <div><h3>Baker / restaurant</h3>{baker ? <p><strong>{baker.name}</strong> · {baker.district}<br /><a className="text-link" href={`tel:${baker.phone}`}>{baker.phone}</a><br />{baker.address}{baker.mapsLink ? <><br /><a className="text-link" target="_blank" rel="noopener noreferrer" href={baker.mapsLink}>Open baker location</a></> : null}</p>
                : <p className="notice">{makers.length ? `Foods by: ${makers.join(', ')}. ` : ''}Not connected yet. Choose below.</p>}</div>
            </div>
            <ul className="customer-order-lines">{order.lines.map((line) => <li key={line.productId}><span>{line.name} <small>· {line.qty} × {formatPaise(line.unitPaise)}{line.makerName ? ` · ${line.makerName}` : ''}</small></span><strong>{formatPaise(line.linePaise)}</strong></li>)}</ul>
            {order.deliveryFeePaise ? <div className="customer-order-total"><span>Delivery charge</span><strong>{formatPaise(order.deliveryFeePaise)}</strong></div> : null}
            <div className="customer-order-total"><span>To collect</span><strong>{formatPaise(payablePaise(order))}</strong></div>
            {order.paymentMethod === 'upi' && order.paymentStatus !== 'paid' && <p className="notice">{order.paymentRef ? <>Customer says paid. UPI transaction ID: <strong>{order.paymentRef}</strong>. Check your UPI app, then mark Received.</> : 'Waiting for the customer to pay by UPI.'}</p>}
            {!final && <>
              <form className="admin-order-form" key={`${order.id}-${order.bakerProfileId}-${order.deliveryFeePaise}`} onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => setOrderHandlingAction(token, order.id, { bakerProfileId: String(d.get('baker') ?? ''), deliveryFeeRupees: Number(d.get('fee') || 0), customerNote: String(d.get('note') ?? '') }), 'Order details saved.'); }}>
                <label>Connect baker<select name="baker" defaultValue={order.bakerProfileId ?? ''}><option value="">Not connected</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.district}</option>)}</select></label>
                <label>Delivery charge (₹)<input name="fee" type="number" min="0" max="5000" step="1" defaultValue={order.deliveryFeePaise ? order.deliveryFeePaise / 100 : ''} placeholder="0" /></label>
                <label className="grow">Message for customer<input name="note" maxLength={300} defaultValue={order.customerNote ?? ''} placeholder="e.g. Pickup from shop after 5 PM" /></label>
                <button className="btn secondary" type="submit" disabled={busy}>Save</button>
              </form>
              <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => setOrderStatusAction(token, order.id, String(d.get('status')), String(d.get('payment') ?? ''))); }}>
                <label>Status<select name="status" defaultValue={order.status}>{ORDER_STATUSES.map((v) => <option key={v} value={v}>{statusLabel(v)}</option>)}</select></label>
                <label>Payment<select name="payment" defaultValue=""><option value="">No change</option><option value="paid">Received</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
                <button className="btn" type="submit" disabled={busy}>Update</button>
              </form></>}
          </article>;
        })}
      </div>}
    </>}

    {tab === 'products' && <>
      <form className="form-shell checkout-form wide" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const d = new FormData(form); void act((token) => publishProductAction(token, {
        name: String(d.get('name')), sku: String(d.get('sku')), description: String(d.get('description')), makerName: '', makerId: String(d.get('makerId') ?? '') || undefined,
        priceRupees: Number(d.get('price')), storage: String(d.get('storage')), vegetarianEvidence: String(d.get('evidence')),
      }), 'Food added and visible in the shop.').then((ok) => { if (ok) form.reset(); }); }}>
        <h2>Add a food item</h2>
        {profiles.length === 0 && <p className="notice">Add the baker or restaurant first (Bakers tab), then pick it here.</p>}
        <label htmlFor="p-maker">Made by (baker / restaurant)</label><select id="p-maker" name="makerId" required defaultValue=""><option value="" disabled>Choose baker or restaurant</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.district}</option>)}</select>
        <label htmlFor="p-name">Food name</label><input id="p-name" name="name" required maxLength={180} />
        <label htmlFor="p-sku">Code (unique, e.g. RV-THEKUA-250)</label><input id="p-sku" name="sku" required maxLength={80} />
        <label htmlFor="p-price">Price in rupees</label><input id="p-price" name="price" type="number" step="0.01" min="1" max="100000" required />
        <label htmlFor="p-desc">Description (pack size / weight)</label><textarea id="p-desc" name="description" rows={3} maxLength={2000} />
        <label htmlFor="p-storage">Storage</label><select id="p-storage" name="storage" defaultValue="ambient"><option value="ambient">Room temperature</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="other">Other</option></select>
        <label htmlFor="p-ev">How you confirmed it is 100% vegetarian</label><input id="p-ev" name="evidence" required maxLength={300} />
        <button className="btn" type="submit" disabled={busy || profiles.length === 0}>Publish food</button>
      </form>
      <h2 className="admin-h2">All foods</h2>
      {products.length === 0 ? <p className="notice">No foods yet.</p> : <div className="customer-order-list">{products.map((product) => <article className="customer-order-card" key={product.id}>
        <div className="customer-order-head"><div><span className="eyebrow">{product.sku}{product.makerName ? ` · ${product.makerName}` : ''}{product.makerDistrict ? `, ${product.makerDistrict}` : ''}</span><h2>{product.name}</h2></div><div className="customer-order-status"><strong>{formatPaise(product.pricePaise)}</strong><span className={`pill ${product.visible ? 'st-delivered' : 'st-cancelled'}`}>{product.visible ? 'Visible in shop' : 'Hidden'}</span></div></div>
        <div className="admin-order-form">
          <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => setProductPriceAction(token, product.id, Number(d.get('price'))), 'Price changed.'); }}><label>New price (₹)<input name="price" type="number" step="0.01" min="1" max="100000" required /></label><button className="btn secondary" type="submit" disabled={busy}>Change price</button></form>
          <button className="btn secondary" type="button" disabled={busy} onClick={() => void act((token) => setProductVisibilityAction(token, product.id, !product.visible), 'Updated.')}>{product.visible ? 'Hide from shop' : 'Show in shop'}</button>
        </div>
      </article>)}</div>}
    </>}

    {tab === 'bakers' && <>
      <form className="form-shell checkout-form wide" key={editing?.id ?? 'new'} onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const d = new FormData(form); void act((token) => saveBakerProfileAction(token, {
        id: editing?.id, name: String(d.get('name')), phone: String(d.get('phone')), address: String(d.get('address')), district: String(d.get('district')), mapsLink: String(d.get('maps') ?? ''), notes: String(d.get('notes') ?? ''),
      }), editing ? 'Baker updated.' : 'Baker added.').then((ok) => { if (ok) { setEditing(null); form.reset(); } }); }}>
        <h2>{editing ? `Edit ${editing.name}` : 'Add a baker or restaurant'}</h2>
        <p className="notice">These details are private. Only you (admin) can see them. Customers see only the name and district on the food.</p>
        <label htmlFor="b-name">Name</label><input id="b-name" name="name" required maxLength={120} defaultValue={editing?.name} />
        <label htmlFor="b-phone">Mobile number</label><input id="b-phone" name="phone" required pattern="[6-9][0-9]{9}" maxLength={10} inputMode="numeric" defaultValue={editing?.phone} />
        <label htmlFor="b-district">District (Bihar)</label><select id="b-district" name="district" required defaultValue={editing?.district ?? ''}><option value="" disabled>Choose district</option>{biharDistricts.map((n) => <option key={n} value={n}>{n}</option>)}</select>
        <label htmlFor="b-address">Address / area</label><textarea id="b-address" name="address" rows={2} required maxLength={300} defaultValue={editing?.address} />
        <label htmlFor="b-maps">Google Maps link (optional)</label><input id="b-maps" name="maps" maxLength={500} placeholder="https://maps.app.goo.gl/..." defaultValue={editing?.mapsLink ?? ''} />
        <label htmlFor="b-notes">Private notes (optional)</label><textarea id="b-notes" name="notes" rows={2} maxLength={500} defaultValue={editing?.notes ?? ''} />
        <div className="admin-order-form"><button className="btn" type="submit" disabled={busy}>{editing ? 'Save changes' : 'Add baker'}</button>{editing && <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>}</div>
      </form>
      <h2 className="admin-h2">Bakers and restaurants</h2>
      {profiles.length === 0 ? <p className="notice">None added yet.</p> : <div className="customer-order-list">{profiles.map((p) => <article className="customer-order-card" key={p.id}>
        <div className="customer-order-head"><div><span className="eyebrow">{p.district}, Bihar</span><h2>{p.name}</h2></div><div className="admin-order-form"><button className="btn secondary" type="button" onClick={() => { setEditing(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button><button className="btn secondary" type="button" disabled={busy} onClick={() => { if (window.confirm(`Remove ${p.name}?`)) void act((token) => deleteBakerProfileAction(token, p.id), 'Removed.'); }}>Remove</button></div></div>
        <p><a className="text-link" href={`tel:${p.phone}`}>{p.phone}</a> · {p.address}{p.mapsLink ? <> · <a className="text-link" target="_blank" rel="noopener noreferrer" href={p.mapsLink}>Map</a></> : null}</p>
      </article>)}</div>}
      <details className="customer-order-card admin-later"><summary>Baker website sign-in (for later)</summary>
        <p className="notice">Only needed when bakers start using their own login. Not required for the current order flow.</p>
        <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const d = new FormData(form); void act((token) => inviteBakerAction(token, { email: String(d.get('email')), name: String(d.get('name')) }), 'Baker login added.').then((ok) => { if (ok) form.reset(); }); }}>
          <label>Name<input name="name" maxLength={120} /></label><label>Email<input name="email" type="email" required maxLength={254} /></label><button className="btn secondary" type="submit" disabled={busy}>Add login</button></form>
        {logins.map((b) => <p className="notice" key={b.id}>{b.name ?? b.email} · {b.email} <button className="text-link" type="button" onClick={() => void act((token) => removeBakerAction(token, b.email), 'Baker login removed.')}>Remove</button></p>)}
      </details>
    </>}

    {tab === 'payment' && <div className="admin-two">
      <form className="form-shell checkout-form" onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => savePaymentSettingsAction(token, { upiId: String(d.get('upi')), payeeName: String(d.get('payee')) }), 'Payment details saved. Customers will now see this QR.'); }}>
        <h2>UPI payment</h2>
        <p className="notice">Customers who choose &quot;Pay by UPI&quot; see a QR with the exact amount for their order. Money goes straight to this UPI ID. Cash on delivery always stays available.</p>
        <label htmlFor="u-id">Your UPI ID</label><input id="u-id" name="upi" required maxLength={100} placeholder="name@bank" defaultValue={payment?.upiId ?? ''} key={payment?.upiId ?? 'none'} />
        <label htmlFor="u-name">Name on the UPI account</label><input id="u-name" name="payee" required maxLength={60} defaultValue={payment?.payeeName ?? ''} key={payment?.payeeName ?? 'none-n'} />
        <button className="btn" type="submit" disabled={busy}>Save</button>
      </form>
      <div className="form-shell"><h2>Preview</h2>{payment ? <><UpiQr link={upiLink(payment, 10000, 'PREVIEW')} label="Sample UPI QR for 100 rupees" /><p className="notice">Sample QR for ₹100. Scan it with your UPI app to confirm it points to the right account.</p></> : <p className="notice">Save your UPI ID to see the QR.</p>}</div>
    </div>}
  </div>;
}
