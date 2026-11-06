'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import {
  assignBakerAction, inviteBakerAction, publishProductAction, removeBakerAction,
  setOrderStatusAction, setProductPriceAction, setProductVisibilityAction,
} from '@/app/actions/session';
import { firestore } from '@/lib/firebase/client';
import { formatPaise } from '@/lib/money';
import { FINAL_STATUSES, ORDER_STATUSES, statusLabel, type OrderDoc } from '@/lib/orders';

type ProductRow = { id: string; name: string; sku: string; makerName: string | null; pricePaise: number; visible: boolean };
type BakerRow = { id: string; email: string; name?: string };
type Tab = 'orders' | 'products' | 'bakers';

export function AdminDashboard() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [bakers, setBakers] = useState<BakerRow[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const db = firestore();
    const stops = [
      onSnapshot(collection(db, 'orders'), (snap) => {
        const rows = snap.docs.map((doc) => ({ ...(doc.data() as Omit<OrderDoc, 'id'>), id: doc.id }));
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(rows);
      }, () => setMessage('Could not load orders. Check that Firestore rules are published and you are an admin.')),
      onSnapshot(collection(db, 'products'), (snap) => setProducts(snap.docs.map((doc) => ({ ...(doc.data() as Omit<ProductRow, 'id'>), id: doc.id })).sort((a, b) => a.name.localeCompare(b.name))), () => undefined),
      onSnapshot(query(collection(db, 'roles'), where('role', '==', 'baker')), (snap) => setBakers(snap.docs.map((doc) => ({ ...(doc.data() as Omit<BakerRow, 'id'>), id: doc.id }))), () => undefined),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  async function act(task: (token: string) => Promise<{ ok: boolean; error?: string }>, success = 'Saved.') {
    setBusy(true); setMessage('');
    try { const result = await task(await getToken()); setMessage(result.ok ? success : result.error ?? 'Could not save.'); }
    catch { setMessage('Something went wrong. Please try again.'); }
    setBusy(false);
  }
  const open = orders.filter((order) => !(FINAL_STATUSES as readonly string[]).includes(order.status)).length;

  return <div className="admin-dash">
    <div className="admin-tabs" role="tablist">
      {(['orders', 'products', 'bakers'] as Tab[]).map((item) => <button key={item} role="tab" aria-selected={tab === item} className={`btn ${tab === item ? '' : 'secondary'}`} onClick={() => setTab(item)}>{item === 'orders' ? `Orders (${open} open)` : item === 'products' ? 'Products & prices' : 'Bakers & restaurants'}</button>)}
    </div>
    {message && <p className="status" role="status">{message}</p>}

    {tab === 'orders' && (orders.length === 0 ? <div className="form-shell"><h2>No orders yet</h2><p>New orders appear here instantly.</p></div> : <div className="customer-order-list">
      {orders.map((order) => {
        const a = order.address;
        const final = (FINAL_STATUSES as readonly string[]).includes(order.status);
        const place = [a.address, a.landmark, a.district, a.pincode].filter(Boolean).join(', ');
        return <article className="customer-order-card" key={order.id}>
          <div className="customer-order-head"><div><span className="eyebrow">{order.orderNumber}</span><h2>{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</h2></div><div className="customer-order-status"><strong>{statusLabel(order.status)}</strong><span>Payment: {statusLabel(order.paymentStatus)}</span></div></div>
          <p><strong>{a.name}</strong> · <a className="text-link" href={`tel:${a.phone}`}>{a.phone}</a> · {order.customerEmail}</p>
          <p className="notice"><strong>{a.fulfilment === 'pickup' ? 'COLLECT FROM SHOP' : 'HOME DELIVERY'}</strong> · {place || 'No address given'}{a.location ? <> · <a className="text-link" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${a.location.lat},${a.location.lng}`}>Open map location</a></> : null}</p>
          <p className="notice">Payment choice: {a.paymentPreference}{order.notes ? ` · Note: ${order.notes}` : ''}{order.bakerName ? ` · Baker: ${order.bakerName}` : ' · No baker assigned yet'}</p>
          <ul className="customer-order-lines">{order.lines.map((line) => <li key={line.productId}><span>{line.name} <small>· {line.qty} × {formatPaise(line.unitPaise)}</small></span><strong>{formatPaise(line.linePaise)}</strong></li>)}</ul>
          <div className="customer-order-total"><span>Total</span><strong>{formatPaise(order.totalPaise)}</strong></div>
          {!final && <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void act((token) => setOrderStatusAction(token, order.id, String(data.get('status')), String(data.get('payment') ?? ''))); }}>
            <label>Status<select name="status" defaultValue={order.status}>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
            <label>Payment<select name="payment" defaultValue=""><option value="">No change</option><option value="paid">Received</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
            <button className="btn" type="submit" disabled={busy}>Update</button>
          </form>}
          {!final && <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void act((token) => assignBakerAction(token, order.id, String(data.get('baker') ?? '')), 'Baker updated.'); }}>
            <label>Connect baker / restaurant<select name="baker" defaultValue={order.bakerId ?? ''}><option value="">Not assigned</option>{bakers.map((baker) => <option key={baker.id} value={baker.id}>{baker.name ?? baker.email}</option>)}</select></label>
            <button className="btn secondary" type="submit" disabled={busy}>Assign</button>
          </form>}
        </article>;
      })}
    </div>)}

    {tab === 'products' && <>
      <form className="form-shell checkout-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void act((token) => publishProductAction(token, {
        name: String(data.get('name')), sku: String(data.get('sku')), description: String(data.get('description')), makerName: String(data.get('makerName')),
        priceRupees: Number(data.get('price')), storage: String(data.get('storage')), vegetarianEvidence: String(data.get('evidence')),
      }), 'Product published.').then(() => form.reset()); }}>
        <h2>Add a product</h2>
        <label htmlFor="p-name">Product name</label><input id="p-name" name="name" required maxLength={180} />
        <label htmlFor="p-sku">SKU (unique code, e.g. RV-THEKUA-250)</label><input id="p-sku" name="sku" required maxLength={80} />
        <label htmlFor="p-maker">Made by (home baker / restaurant name)</label><input id="p-maker" name="makerName" maxLength={120} />
        <label htmlFor="p-price">Price in rupees</label><input id="p-price" name="price" type="number" step="0.01" min="1" max="100000" required />
        <label htmlFor="p-desc">Description (what it is, pack size / weight)</label><textarea id="p-desc" name="description" rows={3} maxLength={2000} />
        <label htmlFor="p-storage">Storage</label><select id="p-storage" name="storage" defaultValue="ambient"><option value="ambient">Room temperature</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="other">Other</option></select>
        <label htmlFor="p-ev">How you confirmed it is 100% vegetarian</label><input id="p-ev" name="evidence" required maxLength={300} />
        <button className="btn" type="submit" disabled={busy}>Publish product</button>
      </form>
      <h2 style={{ font: '500 28px var(--serif)', margin: '32px 0 12px' }}>All products</h2>
      {products.length === 0 ? <p className="notice">No products yet.</p> : <div className="customer-order-list">{products.map((product) => <article className="customer-order-card" key={product.id}>
        <div className="customer-order-head"><div><span className="eyebrow">{product.sku}{product.makerName ? ` · ${product.makerName}` : ''}</span><h2>{product.name}</h2></div><div className="customer-order-status"><strong>{formatPaise(product.pricePaise)}</strong><span>{product.visible ? 'Visible in shop' : 'Hidden'}</span></div></div>
        <div className="admin-order-form">
          <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void act((token) => setProductPriceAction(token, product.id, Number(data.get('price'))), 'Price changed.'); }}><label>New price (₹)<input name="price" type="number" step="0.01" min="1" max="100000" required /></label><button className="btn secondary" type="submit" disabled={busy}>Change price</button></form>
          <button className="btn secondary" type="button" disabled={busy} onClick={() => void act((token) => setProductVisibilityAction(token, product.id, !product.visible), 'Updated.')}>{product.visible ? 'Hide from shop' : 'Show in shop'}</button>
        </div>
      </article>)}</div>}
    </>}

    {tab === 'bakers' && <>
      <form className="form-shell checkout-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void act((token) => inviteBakerAction(token, { email: String(data.get('email')), name: String(data.get('name')) }), 'Baker added. They can now sign in at baker.rasvani.com with this email.').then(() => form.reset()); }}>
        <h2>Add a baker or restaurant</h2>
        <p className="notice">Only emails added here can sign in to the baker site. They must verify their email.</p>
        <label htmlFor="b-name">Name (home baker / restaurant)</label><input id="b-name" name="name" maxLength={120} />
        <label htmlFor="b-email">Their email (Google or any email)</label><input id="b-email" name="email" type="email" required maxLength={254} />
        <button className="btn" type="submit" disabled={busy}>Add baker</button>
      </form>
      <h2 style={{ font: '500 28px var(--serif)', margin: '32px 0 12px' }}>Active bakers</h2>
      {bakers.length === 0 ? <p className="notice">No baker has signed in yet. After you add one, they appear here once they sign in.</p> : <div className="customer-order-list">{bakers.map((baker) => <article className="customer-order-card" key={baker.id}>
        <div className="customer-order-head"><div><h2>{baker.name ?? baker.email}</h2><span className="eyebrow">{baker.email}</span></div><button className="btn secondary" type="button" disabled={busy} onClick={() => void act((token) => removeBakerAction(token, baker.email), 'Baker removed.')}>Remove</button></div>
      </article>)}</div>}
    </>}
  </div>;
}
