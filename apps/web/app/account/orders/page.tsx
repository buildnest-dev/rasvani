import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cancelMyOrder } from './actions';

export const metadata: Metadata = { title: 'Your orders' };
type OrderLine = { product_id: string; product_name: string; sku: string; quantity: number; unit_price_paise: number; line_total_paise: number };
type OrderRow = {
  order_id: string; order_number: string; order_status: string; payment_status: string; currency: string;
  subtotal_paise: number; shipping_paise: number; tax_paise: number; total_paise: number;
  shipping_address: Record<string, unknown>; customer_notes: string | null; created_at: string; lines: OrderLine[];
};
const money = (paise: number, currency: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(paise / 100);
const title = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function CustomerOrdersPage({ searchParams }: { searchParams: Promise<{ error?: string; cancelled?: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/account');
  const [{ data, error }, params] = await Promise.all([supabase.rpc('get_my_customer_orders'), searchParams]);
  const orders = (Array.isArray(data) ? data : []) as OrderRow[];
  const messages: Record<string, string> = {
    'invalid-cancellation': 'Enter a valid order and a cancellation reason of at least three characters.',
    'cancellation-unavailable': 'This order cannot be cancelled through the current workflow. It may already be packed or dispatched.',
  };
  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · Customer account</div><h1>Your orders</h1><p className="section-intro">Review your order history and current status. Payment and delivery tracking appear only when those services are configured and connected.</p></div>
    <p><Link href="/account" className="text-link">← Back to account</Link></p>
    {params.error && <p className="status" role="alert">{messages[params.error] ?? 'The request could not be completed.'}</p>}
    {params.cancelled && <p className="status" role="status">Your cancellation request was processed and the order list has been refreshed.</p>}
    {error ? <p className="notice">Order history is unavailable. Confirm migration 014 is applied and try again.</p> : orders.length === 0 ? <div className="form-shell"><h2>No orders yet</h2><p>Your order history will appear here after an order has been placed.</p><p>Rasvani checkout is not yet enabled for live purchases.</p><Link href="/shop" className="btn secondary">Explore the collection</Link></div> : <div className="customer-order-list">
      {orders.map((order) => {
        const canCancel = ['draft', 'placed', 'confirmed', 'allocated'].includes(order.order_status);
        return <article className="customer-order-card" key={order.order_id}>
          <div className="customer-order-head"><div><span className="eyebrow">{order.order_number}</span><h2>{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</h2></div><div className="customer-order-status"><strong>{title(order.order_status)}</strong><span>{title(order.payment_status)}</span></div></div>
          <ul className="customer-order-lines">{(order.lines ?? []).map((line) => <li key={line.product_id}><span>{line.product_name} <small>· {line.quantity} × {money(line.unit_price_paise, order.currency)}</small></span><strong>{money(line.line_total_paise, order.currency)}</strong></li>)}</ul>
          <div className="customer-order-total"><span>Order total</span><strong>{money(order.total_paise, order.currency)}</strong></div>
          <p className="notice">Payment status: {title(order.payment_status)}. This page does not confirm payment collection or delivery.</p>
          {canCancel && <details className="customer-order-cancel"><summary>Request order cancellation</summary><form action={cancelMyOrder}><input type="hidden" name="order_id" value={order.order_id}/><label>Reason<textarea name="reason" required minLength={3} maxLength={500} rows={3} placeholder="Tell us why you need to cancel"/></label><button className="btn secondary" type="submit">Cancel order</button></form></details>}
        </article>;
      })}
    </div>}
  </section>;
}
