'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatPaise } from '@/lib/money';
import { FINAL_STATUSES, payablePaise, statusLabel, type OrderDoc } from '@/lib/orders';

type FoodLite = { id: string; name: string; visible: boolean; image?: string | null; ratingCount?: number; ratingSum?: number };

const DAY = 86_400_000;
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** The dashboard home: key numbers, a 7-day trend, what needs attention, and the latest orders. */
export function AdminOverview({ base, orders, products, requests }: { base: string; orders: OrderDoc[]; products: FoodLite[]; requests: number }) {
  const data = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(now.getTime() - (6 - i) * DAY); return { key: dayKey(d), label: d.toLocaleDateString('en-IN', { weekday: 'short' }), orders: 0, paise: 0 }; });
    for (const o of orders) {
      const t = new Date(o.createdAt); if (Number.isNaN(t.getTime())) continue;
      const slot = days.find((d) => d.key === dayKey(t)); if (!slot) continue;
      slot.orders += 1; if (o.status !== 'cancelled') slot.paise += payablePaise(o);
    }
    const isFinal = (s: string) => (FINAL_STATUSES as readonly string[]).includes(s);
    const by = (s: string) => orders.filter((o) => o.status === s).length;
    const paid = orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + payablePaise(o), 0);
    const week = days.reduce((sum, d) => sum + d.paise, 0);
    const lines = new Map<string, number>();
    for (const o of orders) if (o.status !== 'cancelled') for (const l of o.lines) lines.set(l.name, (lines.get(l.name) ?? 0) + l.qty);
    const top = [...lines.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { days, max: Math.max(1, ...days.map((d) => d.orders)), fresh: by('placed'), active: orders.filter((o) => !isFinal(o.status) && o.status !== 'placed').length, delivered: by('delivered'), cancelled: by('cancelled'), paid, week, top };
  }, [orders]);

  const hidden = products.filter((p) => !p.visible).length;
  const noPhoto = products.filter((p) => !p.image).length;
  const attention: [string, string, string][] = [];
  if (data.fresh) attention.push([`${data.fresh} new order${data.fresh > 1 ? 's' : ''} waiting`, 'Confirm and assign a baker', `${base}/orders`]);
  if (requests) attention.push([`${requests} cancel / refund request${requests > 1 ? 's' : ''}`, 'Approve or reject', `${base}/orders`]);
  if (noPhoto) attention.push([`${noPhoto} food${noPhoto > 1 ? 's' : ''} without a photo`, 'Photos help sell', `${base}/products`]);
  if (hidden) attention.push([`${hidden} food${hidden > 1 ? 's' : ''} hidden from the shop`, 'Show them when ready', `${base}/products`]);
  const kpis: [string, string, string, string][] = [
    ['New orders', String(data.fresh), 'Need confirmation', 'is-red'],
    ['In progress', String(data.active), 'Being prepared / delivered', 'is-amber'],
    ['Delivered', String(data.delivered), `${data.cancelled} cancelled`, 'is-green'],
    ['Payment received', formatPaise(data.paid), 'Marked paid so far', 'is-maroon'],
  ];

  return <div className="ao">
    <div className="ao-kpis">{kpis.map(([label, value, hint, tone]) => <div key={label} className={`ao-kpi ${tone}`}><span>{label}</span><strong>{value}</strong><em>{hint}</em></div>)}</div>

    <div className="ao-grid">
      <section className="ao-card ao-chart" aria-labelledby="ao-week">
        <div className="ao-card-head"><h2 id="ao-week">Last 7 days</h2><span>{formatPaise(data.week)} ordered</span></div>
        <div className="ao-bars" role="img" aria-label={`Orders per day: ${data.days.map((d) => `${d.label} ${d.orders}`).join(', ')}`}>
          {data.days.map((d) => <div key={d.key} className="ao-bar"><b>{d.orders || ''}</b><i style={{ height: `${Math.max(4, (d.orders / data.max) * 100)}%` }} className={d.orders ? 'on' : ''} /><span>{d.label}</span></div>)}
        </div>
      </section>

      <section className="ao-card" aria-labelledby="ao-attn">
        <div className="ao-card-head"><h2 id="ao-attn">Needs your attention</h2></div>
        {attention.length === 0 ? <p className="ao-empty">All clear. Nothing is waiting for you. ✨</p>
          : <ul className="ao-attn">{attention.map(([title, sub, href]) => <li key={title}><Link href={href}><div><b>{title}</b><span>{sub}</span></div><i aria-hidden="true">→</i></Link></li>)}</ul>}
      </section>
    </div>

    <div className="ao-grid ao-grid-b">
      <section className="ao-card" aria-labelledby="ao-recent">
        <div className="ao-card-head"><h2 id="ao-recent">Latest orders</h2><Link href={`${base}/orders`}>View all →</Link></div>
        {orders.length === 0 ? <p className="ao-empty">No orders yet. They appear here the moment a customer orders.</p>
          : <div className="ao-table" role="table" aria-label="Latest orders">{orders.slice(0, 6).map((o) => <Link key={o.id} href={`${base}/orders`} className="ao-row" role="row">
            <div role="cell"><b>{o.orderNumber}</b><span>{o.address?.name ?? 'Customer'}{o.address?.district ? ` · ${o.address.district}` : ''}</span></div>
            <div role="cell" className="ao-amt">{formatPaise(payablePaise(o))}</div>
            <div role="cell"><span className={`pill st-${o.status}`}>{statusLabel(o.status)}</span></div>
          </Link>)}</div>}
      </section>

      <section className="ao-card" aria-labelledby="ao-top">
        <div className="ao-card-head"><h2 id="ao-top">Best sellers</h2><Link href={`${base}/products`}>Foods →</Link></div>
        {data.top.length === 0 ? <p className="ao-empty">Sales will show here after the first orders.</p>
          : <ol className="ao-top">{data.top.map(([name, qty], i) => <li key={name}><span>{i + 1}</span><b>{name}</b><em>{qty} sold</em></li>)}</ol>}
      </section>
    </div>
  </div>;
}
