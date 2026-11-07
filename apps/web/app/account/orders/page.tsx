'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { UpiQr } from '@/components/upi-qr';
import { cancelMyOrderAction, submitPaymentRefAction } from '@/app/actions/session';
import { firestore } from '@/lib/firebase/client';
import { formatPaise } from '@/lib/money';
import { payablePaise, progressSteps, statusLabel, statusNote, upiLink, type OrderDoc, type PaymentSettings } from '@/lib/orders';

export default function MyOrdersPage() {
  const { user, loading, configured, getToken } = useAuth();
  const { clear } = useCart();
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('placed')) { setPlaced(true); clear(); }
  }, [clear]);

  useEffect(() => {
    if (!user) return;
    const db = firestore();
    const stopOrders = onSnapshot(query(collection(db, 'orders'), where('userId', '==', user.uid)), (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ ...(d.data() as Omit<OrderDoc, 'id'>), id: d.id }));
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setOrders(rows);
    }, () => setError('Your orders could not be loaded right now. Please try again shortly.'));
    const stopPay = onSnapshot(doc(db, 'settings', 'payment'), (snap) => setPayment(snap.exists() ? (snap.data() as PaymentSettings) : null), () => undefined);
    return () => { stopOrders(); stopPay(); };
  }, [user]);

  async function cancel(orderId: string, form: HTMLFormElement) {
    const reason = String(new FormData(form).get('reason') ?? '');
    const result = await cancelMyOrderAction(await getToken(), orderId, reason);
    setError(result.ok ? '' : result.error);
  }
  async function sendRef(orderId: string, form: HTMLFormElement) {
    const result = await submitPaymentRefAction(await getToken(), orderId, String(new FormData(form).get('ref') ?? ''));
    setError(result.ok ? '' : result.error); setInfo(result.ok ? 'Thank you. Rasvani will check the payment and confirm it here.' : '');
  }

  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · My orders</div><h1>My orders</h1><p className="section-intro">Follow every order here. Rasvani confirms each order, any delivery charge, and delivery or pickup by phone.</p></div>
    {placed && <p className="status order-thanks" role="status">Thank you! Your order has been placed. We will call you to confirm. If you chose UPI, your QR is below.</p>}
    {info && <p className="status" role="status">{info}</p>}
    {error && <p className="status" role="alert">{error}</p>}
    {!configured ? <p className="notice">Orders are being set up.</p> : loading ? <p className="status" role="status">Loading…</p> : !user ? <div className="form-shell"><h2>Sign in to see your orders</h2><Link href="/account" className="btn">Sign in</Link></div>
      : orders === null ? <p className="status" role="status">Loading your orders…</p>
      : orders.length === 0 ? <div className="form-shell"><h2>No orders yet</h2><p>When you place an order, it will show up here.</p><Link href="/shop" className="btn">Go to the shop</Link></div>
      : <div className="customer-order-list">{orders.map((order) => {
        const a = order.address;
        const place = [a.address, a.landmark, a.district, a.pincode].filter(Boolean).join(', ');
        const steps = progressSteps(a.fulfilment);
        const current = order.status === 'cancelled' ? -1 : steps.findIndex((step) => step.statuses.includes(order.status));
        const payable = payablePaise(order);
        const showQr = order.paymentMethod === 'upi' && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && payment?.upiId;
        return <article className="customer-order-card" key={order.id}>
          <div className="customer-order-head"><div><span className="eyebrow">{order.orderNumber}</span><h2>{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</h2></div><div className="customer-order-status"><span className={`pill st-${order.status}`}>{statusLabel(order.status)}</span><span className={`pill pay-${order.paymentStatus}`}>{order.paymentMethod === 'upi' ? 'UPI' : 'Cash'} · {statusLabel(order.paymentStatus)}</span></div></div>
          {order.status === 'cancelled' ? <p className="notice">{statusNote.cancelled}</p> : <ol className="order-steps" aria-label="Order progress">{steps.map((step, index) => <li key={step.key} className={index < current ? 'is-done' : index === current ? 'is-now' : ''}><span>{index < current ? '✓' : index + 1}</span>{step.label}</li>)}</ol>}
          <p className="notice">{statusNote[order.status] ?? ''}</p>
          {order.customerNote && <p className="order-message"><strong>Message from Rasvani:</strong> {order.customerNote}</p>}
          <ul className="customer-order-lines">{order.lines.map((line) => <li key={line.productId}><span>{line.name} <small>· {line.qty} × {formatPaise(line.unitPaise)}</small></span><strong>{formatPaise(line.linePaise)}</strong></li>)}</ul>
          {order.deliveryTime ? <div className="customer-order-total"><span>Delivery time</span><strong>{order.deliveryTime}</strong></div> : null}
          {order.deliveryFeePaise ? <div className="customer-order-total"><span>Delivery charge</span><strong>{formatPaise(order.deliveryFeePaise)}</strong></div> : null}
          <div className="customer-order-total"><span>{order.paymentStatus === 'paid' ? 'Paid' : 'To pay'}</span><strong>{formatPaise(payable)}</strong></div>
          {showQr && payment && <div className="upi-box">
            <UpiQr link={upiLink(payment, payable, order.orderNumber)} label={`UPI QR to pay ${formatPaise(payable)} for order ${order.orderNumber}`} />
            <div><h3>Pay {formatPaise(payable)} by UPI</h3>
              <p className="notice">Scan with any UPI app (PhonePe, Google Pay, Paytm…). Paying to: <strong>{payment.payeeName}</strong> ({payment.upiId}). If Rasvani adds a delivery charge after you pay, the difference is settled on the call.</p>
              <a className="btn secondary upi-open" href={upiLink(payment, payable, order.orderNumber)}>Open my UPI app</a>
              {order.paymentRef ? <p className="notice">Your transaction ID <strong>{order.paymentRef}</strong> is with Rasvani for checking.</p>
                : <form className="admin-order-form" onSubmit={(event) => { event.preventDefault(); void sendRef(order.id, event.currentTarget); }}><label>After paying, enter the UPI transaction ID<input name="ref" required minLength={6} maxLength={30} pattern="[A-Za-z0-9]{6,30}" autoComplete="off" /></label><button className="btn" type="submit">I have paid</button></form>}</div></div>}
          {order.paymentMethod === 'upi' && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && !payment?.upiId && <p className="notice">UPI details are being set up. Rasvani will share them on the call.</p>}
          <p className="notice"><strong>{a.fulfilment === 'pickup' ? 'Takeaway: collect from shop' : 'Home delivery'}</strong>{place ? ` · ${place}` : ''} · Phone {a.phone}</p>
          {['placed', 'confirmed'].includes(order.status) && <details className="customer-order-cancel"><summary>Cancel this order</summary>
            <form onSubmit={(event) => { event.preventDefault(); void cancel(order.id, event.currentTarget); }}><label>Reason<textarea name="reason" required minLength={3} maxLength={300} rows={3} /></label><button className="btn secondary" type="submit">Cancel order</button></form></details>}
        </article>;
      })}</div>}
  </section>;
}
