'use client';

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { UpiQr } from '@/components/upi-qr';
import {
  deleteBakerProfileAction, inviteBakerAction, deleteProductAction, publishProductAction, removeBakerAction, saveBakerProfileAction,
  savePaymentSettingsAction, resolveOrderTicketAction, setOrderHandlingAction, setOrderStatusAction, setProductImageAction, setProductPricingAction, setProductVisibilityAction, updateProductDetailsAction,
  uploadFoodImageAction, loadReviews, deleteReviewAction, type PublicReview,
} from '@/app/actions/session';
import { shrinkImage } from '@/lib/resize-image';
import { foodImages, productImage } from '@/lib/food-images';
import { biharDistricts } from '@/lib/bihar-districts';
import { firestore } from '@/lib/firebase/client';
import { formatPaise } from '@/lib/money';
import { PackSizeFields, readSizes } from '@/components/pack-size-fields';
import { Stars } from '@/components/stars';
import type { PackSize } from '@/lib/pack-sizes';
import { FINAL_STATUSES, ORDER_STATUSES, payablePaise, statusLabel, upiLink, type BakerProfile, type OrderDoc, type PaymentSettings } from '@/lib/orders';

type ProductRow = { description?: string | null; storage?: string; sizes?: PackSize[] | null; ratingCount?: number; ratingSum?: number; id: string; name: string; sku: string; makerName: string | null; makerDistrict?: string | null; image?: string | null; pricePaise: number; mrpPaise?: number | null; visible: boolean };
type BakerLogin = { id: string; email: string; name?: string };
type Tab = 'orders' | 'products' | 'bakers' | 'payment';
type Filter = 'new' | 'requests' | 'progress' | 'done' | 'all';
/** A request that still needs the admin. A cancel request on an order that already left (dispatched/delivered/cancelled) is stale, so it is not listed. */
const needsAdmin = (order: OrderDoc) => order.ticket?.status === 'open'
  && !(order.ticket.type === 'cancel' && ['dispatched', 'delivered', 'cancelled'].includes(order.status))
  && !(order.ticket.type === 'refund' && order.ticket.reason === 'Order not received' && order.status === 'delivered');
const isFinal = (status: string) => (FINAL_STATUSES as readonly string[]).includes(status);

/** One broken order must never hide the others: shows its basics instead of crashing the whole list. */
class OrderBoundary extends Component<{ order: OrderDoc; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    const o = this.props.order;
    return <article className="customer-order-card admin-order is-new"><div className="customer-order-head"><div><span className="eyebrow">{String(o.orderNumber ?? o.id)}</span><h2>{String(o.address?.name ?? 'Customer')}</h2></div></div>
      <p className="notice">This order has unusual data and could not be shown fully. Customer: {String(o.address?.name ?? '')} · {String(o.address?.phone ?? '')} · {String(o.customerEmail ?? '')}. Total {formatPaise(Number(o.totalPaise) || 0)}. Please contact the customer directly.</p></article>;
  }
}
const safeDate = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }); };

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; osc.frequency.value = 880; gain.gain.value = 0.15;
    osc.start(); osc.stop(ctx.currentTime + 0.25); setTimeout(() => void ctx.close(), 400);
  } catch { /* sound is optional */ }
}

/** Lets the admin read the reviews of one food and remove an inappropriate one. */
function AdminReviews({ productId, getToken }: { productId: string; getToken: () => Promise<string> }) {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [note, setNote] = useState('');
  const load = useCallback(() => { void loadReviews(productId).then(setReviews); }, [productId]);
  return <details className="admin-later" onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open && reviews === null) load(); }}>
    <summary>Customer reviews</summary>
    {reviews === null ? <p className="notice">Loading…</p> : reviews.length === 0 ? <p className="notice">No reviews yet.</p> : reviews.map((review) => <p className="notice" key={review.id}><strong>{review.name}</strong> <Stars sum={review.rating} count={1} showCount={false} /> {review.comment}{' '}
      <button className="text-link" type="button" onClick={() => { if (!window.confirm('Remove this review?')) return; void getToken().then((token) => deleteReviewAction(token, review.id)).then((result) => { setNote(result.ok ? 'Review removed.' : result.error); load(); }); }}>Remove</button></p>)}
    {note && <p className="status" role="status">{note}</p>}
  </details>;
}

export function AdminDashboard() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');
  const [filter, setFilter] = useState<Filter>('new');
  useEffect(() => { const on = (e: Event) => { const t = (e as CustomEvent).detail; if (t === 'orders' || t === 'products' || t === 'bakers' || t === 'payment') setTab(t); }; window.addEventListener('staff:tab', on); return () => window.removeEventListener('staff:tab', on); }, []);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [profiles, setProfiles] = useState<BakerProfile[]>([]);
  const [logins, setLogins] = useState<BakerLogin[]>([]);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [newPic, setNewPic] = useState('');
  const [picBusy, setPicBusy] = useState(false);

  /** Shrinks the chosen photo in the browser, then the server checks and stores it. Returns the picture path. */
  const uploadPicture = useCallback(async (file: File | undefined): Promise<string | null> => {
    if (!file) return null;
    setPicBusy(true); setMessage('');
    try {
      const dataUrl = await shrinkImage(file);
      const result = await uploadFoodImageAction(await getToken(), dataUrl);
      if (!result.ok) { setMessage(result.error); return null; }
      return result.path;
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'Could not upload the picture.'); return null; }
    finally { setPicBusy(false); }
  }, [getToken]);
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
        // Tolerate hand-made or older documents with missing fields so one bad order never hides the rest.
        const rows = snap.docs.map((d) => {
          const raw = d.data() as Partial<OrderDoc>;
          return {
            ...raw, id: d.id, orderNumber: raw.orderNumber ?? d.id.slice(0, 8).toUpperCase(), customerEmail: raw.customerEmail ?? '',
            status: raw.status ?? 'placed', paymentStatus: raw.paymentStatus ?? 'pending', lines: (Array.isArray(raw.lines) ? raw.lines : []).filter((l) => l && typeof l === 'object').map((l, i) => ({ ...l, productId: String(l.productId ?? i), name: String(l.name ?? 'Item'), qty: Number(l.qty) || 1, unitPaise: Number(l.unitPaise) || 0, linePaise: Number(l.linePaise) || 0 })),
            totalPaise: Number(raw.totalPaise ?? 0), createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
            bakerId: raw.bakerId ?? null, bakerName: raw.bakerName ?? null, notes: raw.notes ?? null,
            address: { fulfilment: 'delivery', name: 'Customer', phone: '', district: '', pincode: null, address: null, landmark: null, location: null, paymentPreference: '', ...(raw.address ?? {}) },
          } as OrderDoc;
        });
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

  const shown = orders.filter((order) => filter === 'all' ? true : filter === 'requests' ? needsAdmin(order) : filter === 'new' ? order.status === 'placed' : filter === 'done' ? isFinal(order.status) : !isFinal(order.status) && order.status !== 'placed');
  const count = (f: Filter) => orders.filter((order) => f === 'all' ? true : f === 'requests' ? needsAdmin(order) : f === 'new' ? order.status === 'placed' : f === 'done' ? isFinal(order.status) : !isFinal(order.status) && order.status !== 'placed').length;
  const requestCount = orders.filter(needsAdmin).length;
  useEffect(() => { window.dispatchEvent(new CustomEvent('staff:state', { detail: { tab, newCount, requests: requestCount } })); }, [tab, newCount, requestCount]);
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
      {([['orders', `Orders${newCount ? ` · ${newCount} new` : ''}${count('requests') ? ` · ${count('requests')} requests` : ''}`], ['products', 'Foods & prices'], ['bakers', 'Bakers & restaurants'], ['payment', 'Payment QR']] as [Tab, string][]).map(([item, label]) =>
        <button key={item} role="tab" aria-selected={tab === item} className={`btn ${tab === item ? '' : 'secondary'}`} onClick={() => setTab(item)}>{label}</button>)}
    </div>
    {alertText && <div className="admin-alert" role="alert"><strong>{alertText}</strong><button className="btn secondary" type="button" onClick={() => { setAlertText(''); setTab('orders'); setFilter('new'); }}>View</button></div>}
    {!alertsOn && tab === 'orders' && <p className="notice">Want a pop-up when an order arrives? <button type="button" className="text-link" onClick={() => void enableAlerts()}>Turn on order alerts</button> (sound plays while this page is open).</p>}
    {message && <p className="status" role="status">{message}</p>}

    {tab === 'orders' && <>
      <div className="admin-filters">{([['new', 'New'], ['requests', 'Requests'], ['progress', 'In progress'], ['done', 'Done'], ['all', 'All']] as [Filter, string][]).map(([f, label]) =>
        <button key={f} type="button" aria-pressed={filter === f} className={`chip ${filter === f ? 'is-on' : ''}`} onClick={() => setFilter(f)}>{label} <b>{count(f)}</b></button>)}</div>
      {shown.length === 0 ? <div className="form-shell"><h2>Nothing here</h2><p>New orders appear here the moment a customer places them.</p></div> : <div className="customer-order-list">
        {shown.map((order) => {
          const a = order.address; const final = isFinal(order.status);
          const place = [a.address, a.landmark, a.district, a.pincode].filter(Boolean).join(', ');
          const baker = profileById(order.bakerProfileId);
          const makers = Array.from(new Set(order.lines.map((l) => l.makerName).filter(Boolean)));
          return <OrderBoundary key={order.id} order={order}><article className={`customer-order-card admin-order ${order.status === 'placed' ? 'is-new' : ''}`}>
            <div className="customer-order-head"><div><span className="eyebrow">{order.orderNumber}</span><h2>{safeDate(order.createdAt)}</h2></div>
              <div className="customer-order-status"><span className={`pill st-${order.status}`}>{statusLabel(order.status)}</span><span className={`pill pay-${order.paymentStatus}`}>{order.paymentMethod === 'upi' ? 'UPI' : 'COD'} · {statusLabel(order.paymentStatus)}</span></div></div>
            <div className="admin-two">
              <div><h3>Customer</h3><p><strong>{a.name}</strong><br /><a className="text-link" href={`tel:${a.phone}`}>{a.phone}</a><br />{order.customerEmail}</p>
                <p className="notice"><strong>{a.fulfilment === 'pickup' ? 'TAKEAWAY (collect)' : 'HOME DELIVERY'}</strong><br />{place || 'No address given'}{a.location ? <><br /><a className="text-link" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${a.location.lat},${a.location.lng}`}>Open customer map location</a></> : null}</p>
                {order.notes && <p className="notice">Customer note: {order.notes}</p>}</div>
              <div><h3>Baker / restaurant</h3>{baker ? <p><strong>{baker.name}</strong> · {baker.district}<br /><a className="text-link" href={`tel:${baker.phone}`}>{baker.phone}</a><br />{baker.address}{baker.mapsLink ? <><br /><a className="text-link" target="_blank" rel="noopener noreferrer" href={baker.mapsLink}>Open baker location</a></> : null}</p>
                : <p className="notice">{makers.length ? `Foods by: ${makers.join(', ')}. ` : ''}Not connected yet. Choose below.</p>}</div>
            </div>
            <ul className="customer-order-lines">{order.lines.map((line) => <li key={line.productId}><span>{line.name} <small>· {line.qty} × {formatPaise(line.unitPaise)}{line.makerName ? ` · ${line.makerName}` : ''}</small></span><strong>{formatPaise(line.linePaise)}</strong></li>)}</ul>
            {order.deliveryTime ? <div className="customer-order-total"><span>Delivery time</span><strong>{order.deliveryTime}</strong></div> : null}
            {order.deliveryFeePaise ? <div className="customer-order-total"><span>Delivery charge</span><strong>{formatPaise(order.deliveryFeePaise)}</strong></div> : null}
            <div className="customer-order-total"><span>To collect</span><strong>{formatPaise(payablePaise(order))}</strong></div>
            {order.paymentMethod === 'upi' && order.paymentStatus !== 'paid' && <p className="notice">{order.paymentRef ? <>Customer says paid. UPI transaction ID: <strong>{order.paymentRef}</strong>. Check your UPI app, then mark Received.</> : 'Waiting for the customer to pay by UPI.'}</p>}
            {order.ticket && <div className={`notice ticket-box ticket-${order.ticket.status}`}>
              <strong>{order.ticket.type === 'cancel' ? 'CANCELLATION REQUEST' : 'REFUND REQUEST'} · {order.ticket.status === 'open' ? 'OPEN' : order.ticket.status === 'approved' ? 'Approved' : 'Rejected'}</strong>
              <br />Reason: {order.ticket.reason}{order.ticket.details ? ` — ${order.ticket.details}` : ''}
              {order.ticket.adminNote && <><br />Your reply: {order.ticket.adminNote}</>}
              {order.ticket.status === 'open' && <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); const decision = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'approve' ? 'approve' : 'reject'; if (!window.confirm(decision === 'approve' ? (order.ticket?.type === 'cancel' ? 'Approve and CANCEL this order?' : 'Approve this refund request?') : 'Reject this request?')) return; void act((token) => resolveOrderTicketAction(token, order.id, decision, String(d.get('note') ?? '')), decision === 'approve' ? 'Request approved.' : 'Request rejected.'); }}>
                <label className="grow">Reply to customer (required if you reject)<input name="note" maxLength={300} placeholder="e.g. Order already left the kitchen" /></label>
                <button className="btn" type="submit" name="decision" value="approve" disabled={busy}>Approve &amp; resolve</button>
                <button className="btn secondary" type="submit" name="decision" value="reject" disabled={busy}>Reject</button>
              </form>}</div>}
            {!final && <>
              <form className="admin-order-form" key={`${order.id}-${order.bakerProfileId}-${order.deliveryFeePaise}-${order.deliveryTime ?? ''}`} onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => setOrderHandlingAction(token, order.id, { bakerProfileId: String(d.get('baker') ?? ''), deliveryFeeRupees: Number(d.get('fee') || 0), customerNote: String(d.get('note') ?? ''), deliveryTime: String(d.get('time') ?? '') }), 'Order details saved.'); }}>
                <label>Connect baker<select name="baker" defaultValue={order.bakerProfileId ?? ''}><option value="">Not connected</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.district}</option>)}</select></label>
                <label>Delivery charge (₹)<input name="fee" type="number" min="0" max="5000" step="1" defaultValue={order.deliveryFeePaise ? order.deliveryFeePaise / 100 : ''} placeholder="0" /></label>
                <label className="grow">Delivery time<input name="time" maxLength={80} defaultValue={order.deliveryTime ?? ''} placeholder="e.g. Today 6–8 PM  /  2–3 days" /></label>
                <label className="grow">Message for customer<input name="note" maxLength={300} defaultValue={order.customerNote ?? ''} placeholder="e.g. Pickup from shop after 5 PM" /></label>
                <button className="btn secondary" type="submit" disabled={busy}>Save</button>
              </form>
              <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => setOrderStatusAction(token, order.id, String(d.get('status')), String(d.get('payment') ?? ''))); }}>
                <label>Status<select name="status" defaultValue={order.status}>{ORDER_STATUSES.map((v) => <option key={v} value={v}>{statusLabel(v)}</option>)}</select></label>
                <label>Payment<select name="payment" defaultValue=""><option value="">No change</option><option value="paid">Received</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
                <button className="btn" type="submit" disabled={busy}>Update</button>
              </form></>}
          </article></OrderBoundary>;
        })}
      </div>}
    </>}

    {tab === 'products' && <>
      <form className="form-shell checkout-form wide" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const d = new FormData(form); void act((token) => publishProductAction(token, {
        name: String(d.get('name')), sku: String(d.get('sku')), description: String(d.get('description')), makerName: '', makerId: String(d.get('makerId') ?? '') || undefined,
        priceRupees: Number(d.get('price') || 0) || undefined, mrpRupees: Number(d.get('mrp') || 0) || undefined, sizes: readSizes(d), storage: String(d.get('storage')), vegetarianEvidence: String(d.get('evidence')),
        image: newPic || String(d.get('image') ?? '') || undefined,
      }), 'Food added and visible in the shop.').then((ok) => { if (ok) { form.reset(); setNewPic(''); } }); }}>
        <h2>Add a food item</h2>
        {profiles.length === 0 && <p className="notice">Baker is optional. To link one, add it in the Bakers tab first.</p>}
        <label htmlFor="p-maker">Made by (baker / restaurant) — optional</label><select id="p-maker" name="makerId" defaultValue=""><option value="">No baker (optional)</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.district}</option>)}</select>
        <label htmlFor="p-name">Food name</label><input id="p-name" name="name" required maxLength={180} />
        <label htmlFor="p-upload">Upload your own food photo (JPG, PNG or WebP)</label>
        <input id="p-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={picBusy || busy} onChange={(event) => { const input = event.currentTarget; void uploadPicture(input.files?.[0]).then((path) => { if (path) setNewPic(path); else input.value = ''; }); }} />
        {picBusy && <p className="notice" role="status">Uploading picture…</p>}
        {newPic && <p className="admin-upload-preview">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={newPic} alt="Uploaded food" width={96} height={96} /><button type="button" className="text-link" onClick={() => setNewPic('')}>Remove uploaded photo</button></p>}
        <label htmlFor="p-image">Or choose a picture from the library (if the name matches a Bihar food, its picture is used automatically)</label>
        <select id="p-image" name="image" defaultValue=""><option value="">Automatic</option>{foodImages.map((img) => <option key={img.path} value={img.path}>{img.label}</option>)}</select>
        <label htmlFor="p-sku">Code (unique, e.g. RV-THEKUA-250)</label><input id="p-sku" name="sku" required maxLength={80} />
        <label htmlFor="p-price">Price in rupees (leave empty if you fill pack sizes below)</label><input id="p-price" name="price" type="number" step="0.01" min="1" max="100000" />
        <label htmlFor="p-mrp">MRP in rupees (optional, shown crossed out with % off)</label><input id="p-mrp" name="mrp" type="number" step="0.01" min="0" max="100000" />
        <PackSizeFields />
        <label htmlFor="p-desc">Description (pack size / weight)</label><textarea id="p-desc" name="description" rows={3} maxLength={2000} />
        <label htmlFor="p-storage">Storage</label><select id="p-storage" name="storage" defaultValue="ambient"><option value="ambient">Room temperature</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="other">Other</option></select>
        <label htmlFor="p-ev">How you confirmed it is 100% vegetarian</label><input id="p-ev" name="evidence" required maxLength={300} />
        <button className="btn" type="submit" disabled={busy || picBusy}>Publish food</button>
      </form>
      <h2 className="admin-h2">All foods</h2>
      {products.length === 0 ? <p className="notice">No foods yet.</p> : <div className="customer-order-list">{products.map((product) => <article className="customer-order-card" key={product.id}>
        <div className="customer-order-head">{productImage(product) && <span className="admin-thumb">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={productImage(product) ?? ''} alt="" width={72} height={72} /></span>}<div><span className="eyebrow">{product.sku}{product.makerName ? ` · ${product.makerName}` : ''}{product.makerDistrict ? `, ${product.makerDistrict}` : ''}</span><h2>{product.name}</h2></div><div className="customer-order-status"><strong>{formatPaise(product.pricePaise)}</strong><span className={`pill ${product.visible ? 'st-delivered' : 'st-cancelled'}`}>{product.visible ? 'Visible in shop' : 'Hidden'}</span></div></div>
        <div className="admin-order-form">
          <details className="admin-later admin-edit-prices"><summary>✎ Edit name, description &amp; storage</summary><form className="admin-order-form" key={`d-${product.id}-${product.name}-${product.storage}-${product.description}`} onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => updateProductDetailsAction(token, product.id, { name: String(d.get('name') ?? ''), description: String(d.get('description') ?? ''), storage: String(d.get('storage') ?? 'ambient'), makerName: String(d.get('makerName') ?? '') }), 'Details saved.'); }}>
            <label>Food name<input name="name" defaultValue={product.name} required minLength={2} maxLength={180} /></label>
            <label>Maker label<input name="makerName" defaultValue={product.makerName ?? ''} maxLength={120} /></label>
            <label>Description<textarea name="description" defaultValue={product.description ?? ''} rows={3} maxLength={2000} /></label>
            <label>Storage<select name="storage" defaultValue={product.storage ?? 'ambient'}><option value="ambient">Room temperature</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="other">Other</option></select></label>
            <button className="btn secondary" type="submit" disabled={busy}>Save details</button></form></details>
          <details className="admin-later admin-edit-prices"><summary>✎ Edit price &amp; pack sizes</summary><form className="admin-order-form" key={`${product.id}-${product.pricePaise}-${(product.sizes ?? []).map((x) => x.id + x.pricePaise).join()}`} onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => setProductPricingAction(token, product.id, { priceRupees: Number(d.get('price') || 0) || undefined, mrpRupees: Number(d.get('mrp') || 0) || undefined, sizes: readSizes(d) }), 'Prices saved.'); }}>
            <label>Price (₹){product.sizes?.length ? ' — used only if all sizes are cleared' : ''}<input name="price" type="number" step="0.01" min="1" max="100000" defaultValue={product.sizes?.length ? '' : product.pricePaise / 100} /></label>
            <label>MRP (₹, optional)<input name="mrp" type="number" step="0.01" min="0" max="100000" defaultValue={!product.sizes?.length && product.mrpPaise ? product.mrpPaise / 100 : ''} /></label>
            <PackSizeFields sizes={product.sizes} />
            <button className="btn secondary" type="submit" disabled={busy}>Save prices</button></form></details>
          <AdminReviews productId={product.id} getToken={getToken} />
          <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const d = new FormData(event.currentTarget); void act((token) => setProductImageAction(token, product.id, String(d.get('image') ?? '')), 'Picture changed.'); }}><label>Picture<select name="image" defaultValue={product.image ?? ''}><option value="">Automatic</option>{foodImages.map((img) => <option key={img.path} value={img.path}>{img.label}</option>)}</select></label><button className="btn secondary" type="submit" disabled={busy}>Set picture</button><label>Or upload a photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={picBusy || busy} onChange={(event) => { const input = event.currentTarget; void uploadPicture(input.files?.[0]).then((path) => { if (path) void act((token) => setProductImageAction(token, product.id, path), 'Photo uploaded and set.'); input.value = ''; }); }} /></label></form>
          <button className="btn secondary" type="button" disabled={busy} onClick={() => void act((token) => setProductVisibilityAction(token, product.id, !product.visible), 'Updated.')}>{product.visible ? 'Hide from shop' : 'Show in shop'}</button>
          <button className="btn secondary" type="button" disabled={busy} onClick={() => { if (window.confirm(`Remove "${product.name}" permanently? This cannot be undone. (Use Hide if you only want to pause it.)`)) void act((token) => deleteProductAction(token, product.id), 'Food removed.'); }}>Remove food</button>
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
