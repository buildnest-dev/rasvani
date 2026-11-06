'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { cancelMyOrderAction } from '@/app/actions/session';
import { firestore } from '@/lib/firebase/client';
import { formatPaise } from '@/lib/money';
import { statusLabel, statusNote, type OrderDoc } from '@/lib/orders';

export default function MyOrdersPage() {
  const { user, loading, configured, getToken } = useAuth();
  const { clear } = useCart();
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('placed')) { setPlaced(true); clear(); }
  }, [clear]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore(), 'orders'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const rows = snapshot.docs.map((doc) => ({ ...(doc.data() as Omit<OrderDoc, 'id'>), id: doc.id }));
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setOrders(rows);
    }, () => setError('Your orders could not be loaded right now. Please try again shortly.'));
  }, [user]);

  async function cancel(orderId: string, form: HTMLFormElement) {
    const reason = String(new FormData(form).get('reason') ?? '');
    const result = await cancelMyOrderAction(await getToken(), orderId, reason);
    setError(result.ok ? '' : result.error);
  }

  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · My orders</div><h1>My orders</h1><p className="section-intro">All your orders in one place. Rasvani confirms each order, the final amount, and delivery or pickup by phone.</p></div>
    {placed && <p className="status" role="status">Thank you! Your order has been placed. We will call you to confirm.</p>}
    {error && <p className="status" role="alert">{error}</p>}
    {!configured ? <p className="notice">Orders are being set up.</p> : loading ? <p className="status" role="status">Loading…</p> : !user ? <div className="form-shell"><h2>Sign in to see your orders</h2><Link href="/account" className="btn">Sign in</Link></div>
      : orders === null ? <p className="status" role="status">Loading your orders…</p>
      : orders.length === 0 ? <div className="form-shell"><h2>No orders yet</h2><p>When you place an order, it will show up here.</p><Link href="/shop" className="btn">Go to the shop</Link></div>
      : <div className="customer-order-list">{orders.map((order) => {
        const a = order.address;
        const place = [a.address, a.landmark, a.district, a.pincode].filter(Boolean).join(', ');
        return <article className="customer-order-card" key={order.id}>
          <div className="customer-order-head"><div><span className="eyebrow">{order.orderNumber}</span><h2>{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</h2></div><div className="customer-order-status"><strong>{statusLabel(order.status)}</strong><span>Payment: {statusLabel(order.paymentStatus)}</span></div></div>
          <p className="notice">{statusNote[order.status] ?? ''}</p>
          <ul className="customer-order-lines">{order.lines.map((line) => <li key={line.productId}><span>{line.name} <small>· {line.qty} × {formatPaise(line.unitPaise)}</small></span><strong>{formatPaise(line.linePaise)}</strong></li>)}</ul>
          <div className="customer-order-total"><span>Order total</span><strong>{formatPaise(order.totalPaise)}</strong></div>
          <p className="notice"><strong>{a.fulfilment === 'pickup' ? 'Collect from shop' : 'Home delivery'}</strong>{place ? ` · ${place}` : ''} · Phone {a.phone}</p>
          {['placed', 'confirmed'].includes(order.status) && <details className="customer-order-cancel"><summary>Cancel this order</summary>
            <form onSubmit={(event) => { event.preventDefault(); void cancel(order.id, event.currentTarget); }}><label>Reason<textarea name="reason" required minLength={3} maxLength={300} rows={3} /></label><button className="btn secondary" type="submit">Cancel order</button></form></details>}
        </article>;
      })}</div>}
  </section>;
}
