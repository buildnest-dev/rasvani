'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { bakerUpdateOrderAction } from '@/app/actions/session';
import { firestore } from '@/lib/firebase/client';
import { formatPaise } from '@/lib/money';
import { statusLabel, type OrderDoc } from '@/lib/orders';

export function BakerDashboard() {
  const { user, getToken } = useAuth();
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(firestore(), 'orders'), where('bakerId', '==', user.uid)), (snap) => {
      const rows = snap.docs.map((doc) => ({ ...(doc.data() as Omit<OrderDoc, 'id'>), id: doc.id }));
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setOrders(rows);
    }, () => setMessage('Could not load your orders. Please try again.'));
  }, [user]);

  async function act(orderId: string, next: 'accepted' | 'preparing' | 'ready' | 'declined') {
    setBusy(true); setMessage('');
    try { const result = await bakerUpdateOrderAction(await getToken(), orderId, next); setMessage(result.ok ? 'Updated.' : result.error); }
    catch { setMessage('Something went wrong. Please try again.'); }
    setBusy(false);
  }

  return <div className="admin-dash">
    {message && <p className="status" role="status">{message}</p>}
    {orders === null ? <p className="status" role="status">Loading your orders…</p> : orders.length === 0 ? <div className="form-shell"><h2>No orders for you right now</h2><p>When Rasvani connects an order to you, it will appear here instantly.</p></div> : <div className="customer-order-list">
      {orders.map((order) => {
        const a = order.address;
        const final = ['delivered', 'cancelled'].includes(order.status);
        const place = [a.address, a.landmark, a.district, a.pincode].filter(Boolean).join(', ');
        return <article className="customer-order-card" key={order.id}>
          <div className="customer-order-head"><div><span className="eyebrow">{order.orderNumber}</span><h2>{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</h2></div><div className="customer-order-status"><strong>{statusLabel(order.status)}</strong></div></div>
          <ul className="customer-order-lines">{order.lines.map((line) => <li key={line.productId}><span>{line.name} <small>× {line.qty}</small></span><strong>{formatPaise(line.linePaise)}</strong></li>)}</ul>
          <p className="notice"><strong>{a.fulfilment === 'pickup' ? 'CUSTOMER WILL COLLECT' : 'HOME DELIVERY'}</strong> · {a.name} · <a className="text-link" href={`tel:${a.phone}`}>{a.phone}</a>{place ? ` · ${place}` : ''}</p>
          {order.notes && <p className="notice">Customer note: {order.notes}</p>}
          {!final && <div className="admin-order-form">
            {order.status === 'confirmed' && <><button className="btn" disabled={busy} onClick={() => void act(order.id, 'accepted')}>Accept order</button><button className="btn secondary" disabled={busy} onClick={() => void act(order.id, 'declined')}>Cannot make this</button></>}
            {order.status === 'accepted' && <button className="btn" disabled={busy} onClick={() => void act(order.id, 'preparing')}>Start preparing</button>}
            {order.status === 'preparing' && <button className="btn" disabled={busy} onClick={() => void act(order.id, 'ready')}>Mark ready</button>}
            {['ready', 'dispatched'].includes(order.status) && <p className="notice">Ready. Rasvani will handle pickup or delivery.</p>}
          </div>}
        </article>;
      })}
    </div>}
  </div>;
}
