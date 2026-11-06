import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { formatPaise } from '@/lib/money';
import { setOrderStatus } from './actions';

export const metadata: Metadata = { title: 'Customer orders (admin)' };
type Line = { name: string; quantity: number; unit_price_paise: number; line_total_paise: number };
type Order = {
  order_id: string; order_number: string; order_status: string; payment_status: string; total_paise: number;
  shipping_address: Record<string, unknown>; customer_notes: string | null; created_at: string; customer_email: string | null; lines: Line[];
};
const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : '');
const title = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const next: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'], draft: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'], allocated: ['packed', 'cancelled'],
  packed: ['dispatched', 'delivered', 'cancelled'], dispatched: ['delivered', 'cancelled'],
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  await requireAnyRole(['admin', 'super_admin', 'warehouse_operator']);
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_list_orders', { p_limit: 150 });
  const orders = (Array.isArray(data) ? data : []) as Order[];
  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Operations</div><h1>Customer orders</h1><p className="section-intro">Call the customer on the number shown, confirm the final amount, then move the order forward.</p></div>
    <p><Link href="/account" className="text-link">← Account</Link> · <Link href="/admin/catalogue" className="text-link">Products &amp; prices →</Link></p>
    {params.updated && <p className="status" role="status">Order updated.</p>}
    {params.error && <p className="status" role="alert">That update could not be applied (the order may already be final).</p>}
    {error ? <p className="notice">Orders could not be loaded. Confirm migration 044 has been run in Supabase and you have an admin role.</p> : orders.length === 0 ? <div className="form-shell"><h2>No orders yet</h2></div> : <div className="customer-order-list">
      {orders.map((order) => {
        const a = order.shipping_address ?? {};
        const options = next[order.order_status] ?? [];
        const place = [text(a.address), text(a.landmark), text(a.district), text(a.pincode)].filter(Boolean).join(', ');
        const loc = a.location && typeof a.location === 'object' ? a.location as { lat?: number; lng?: number } : null;
        return <article className="customer-order-card" key={order.order_id}>
          <div className="customer-order-head"><div><span className="eyebrow">{order.order_number}</span><h2>{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</h2></div><div className="customer-order-status"><strong>{title(order.order_status)}</strong><span>Payment: {title(order.payment_status === 'not_configured' ? 'not settled' : order.payment_status)}</span></div></div>
          <p><strong>{text(a.name)}</strong> · <a className="text-link" href={`tel:${text(a.phone)}`}>{text(a.phone)}</a>{order.customer_email ? ` · ${order.customer_email}` : ''}</p>
          <p className="notice"><strong>{a.fulfilment === 'pickup' ? 'COLLECT FROM SHOP' : 'HOME DELIVERY'}</strong> · {place || 'No address given'}{loc?.lat && loc?.lng ? <> · <a className="text-link" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}>Open map location</a></> : null}</p>
          <p className="notice">Payment choice: {text(a.payment_preference) || 'not stated'}{order.customer_notes ? ` · Note: ${order.customer_notes}` : ''}</p>
          <ul className="customer-order-lines">{(order.lines ?? []).map((line, index) => <li key={index}><span>{line.name} <small>· {line.quantity} × {formatPaise(line.unit_price_paise)}</small></span><strong>{formatPaise(line.line_total_paise)}</strong></li>)}</ul>
          <div className="customer-order-total"><span>Total</span><strong>{formatPaise(order.total_paise)}</strong></div>
          {options.length > 0 && <form action={setOrderStatus} className="admin-order-form">
            <input type="hidden" name="order_id" value={order.order_id} />
            <label>Move to<select name="status" defaultValue={options[0]}>{options.map((value) => <option key={value} value={value}>{title(value)}</option>)}</select></label>
            <label>Payment<select name="payment" defaultValue=""><option value="">No change</option><option value="captured">Received</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
            <button className="btn" type="submit">Update</button>
          </form>}
        </article>;
      })}
    </div>}
  </section>;
}
