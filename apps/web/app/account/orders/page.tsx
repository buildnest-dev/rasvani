import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatPaise } from '@/lib/money';
import { ClearCartOnPlaced } from '@/components/clear-cart-on-placed';
import { cancelMyOrder } from './actions';

export const metadata: Metadata = { title: 'My orders' };
type OrderLine = { product_id: string; product_name: string; sku: string; quantity: number; unit_price_paise: number; line_total_paise: number };
type OrderRow = {
  order_id: string; order_number: string; order_status: string; payment_status: string; currency: string;
  subtotal_paise: number; shipping_paise: number; tax_paise: number; total_paise: number;
  shipping_address: Record<string, unknown>; customer_notes: string | null; created_at: string; lines: OrderLine[];
};
const title = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);
const statusNote: Record<string, string> = {
  placed: 'We have your order. Rasvani will call you to confirm.',
  confirmed: 'Confirmed by Rasvani.',
  allocated: 'Being prepared.',
  packed: 'Packed and ready.',
  dispatched: 'On the way / ready for pickup.',
  delivered: 'Delivered. Thank you!',
  cancelled: 'This order was cancelled.',
  refunded: 'This order was refunded.',
};

export default async function CustomerOrdersPage({ searchParams }: { searchParams: Promise<{ error?: string; cancelled?: string; placed?: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/account');
  const [{ data, error }, params] = await Promise.all([supabase.rpc('get_my_customer_orders'), searchParams]);
  const orders = (Array.isArray(data) ? data : []) as OrderRow[];
  const messages: Record<string, string> = {
    'invalid-cancellation': 'Enter a valid order and a cancellation reason of at least three characters.',
    'cancellation-unavailable': 'This order cannot be cancelled now. It may already be packed or on its way. Please contact Rasvani.',
  };
  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · My orders</div><h1>My orders</h1><p className="section-intro">All your orders in one place. Rasvani confirms each order, the final amount, and delivery or pickup by phone.</p></div>
    {params.placed && <><ClearCartOnPlaced /><p className="status" role="status">Thank you! Your order has been placed. We will call you to confirm.</p></>}
    {params.error && <p className="status" role="alert">{messages[params.error] ?? 'The request could not be completed.'}</p>}
    {params.cancelled && <p className="status" role="status">Your cancellation request was processed.</p>}
    {error ? <p className="notice">Your orders could not be loaded right now. Please try again shortly.</p> : orders.length === 0 ? <div className="form-shell"><h2>No orders yet</h2><p>When you place an order, it will show up here.</p><Link href="/shop" className="btn">Go to the shop</Link></div> : <div className="customer-order-list">
      {orders.map((order) => {
        const canCancel = ['draft', 'placed', 'confirmed', 'allocated'].includes(order.order_status);
        const address = order.shipping_address ?? {};
        const pickup = address.fulfilment === 'pickup';
        const place = [text(address.address), text(address.landmark), text(address.district), text(address.pincode)].filter(Boolean).join(', ');
        return <article className="customer-order-card" key={order.order_id}>
          <div className="customer-order-head"><div><span className="eyebrow">{order.order_number}</span><h2>{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</h2></div><div className="customer-order-status"><strong>{title(order.order_status)}</strong><span>Payment: {title(order.payment_status === 'not_configured' ? 'to be settled' : order.payment_status)}</span></div></div>
          <p className="notice">{statusNote[order.order_status] ?? ''}</p>
          <ul className="customer-order-lines">{(order.lines ?? []).map((line) => <li key={line.product_id}><span>{line.product_name} <small>· {line.quantity} × {formatPaise(line.unit_price_paise, order.currency)}</small></span><strong>{formatPaise(line.line_total_paise, order.currency)}</strong></li>)}</ul>
          <div className="customer-order-total"><span>Order total</span><strong>{formatPaise(order.total_paise, order.currency)}</strong></div>
          <p className="notice"><strong>{pickup ? 'Collect from shop' : 'Home delivery'}</strong>{place ? ` · ${place}` : ''}{text(address.phone) ? ` · Phone ${text(address.phone)}` : ''}</p>
          {canCancel && <details className="customer-order-cancel"><summary>Cancel this order</summary><form action={cancelMyOrder}><input type="hidden" name="order_id" value={order.order_id} /><label>Reason<textarea name="reason" required minLength={3} maxLength={500} rows={3} placeholder="Tell us why you need to cancel" /></label><button className="btn secondary" type="submit">Cancel order</button></form></details>}
        </article>;
      })}
    </div>}
  </section>;
}
