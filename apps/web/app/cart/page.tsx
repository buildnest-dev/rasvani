'use client';

import Link from 'next/link';
import { MAX_QTY, lineKey, useCart } from '@/components/cart-provider';
import { PriceTag } from '@/components/price-tag';
import { formatPaise } from '@/lib/money';

export default function CartPage() {
  const { lines, ready, subtotalPaise, setQty, remove, clear } = useCart();
  return <section className="wrap cart-page">
    <div className="page-hero"><div className="eyebrow">Your cart</div><h1>Your cart</h1><p className="section-intro">Review what you picked. The final amount is confirmed again when you place the order.</p></div>
    {!ready ? <p className="status" role="status">Loading your cart…</p> : lines.length === 0 ? <div className="shop-empty"><h2>Your cart is empty</h2><p>Add something from the shop to start an order.</p><Link href="/shop" className="btn">Go to the shop</Link></div> : <div className="cart-layout">
      <ul className="cart-lines">{lines.map((line) => <li key={lineKey(line)} className="cart-line">
        <div className="cart-line-main"><strong>{line.slug ? <Link href={`/shop/${encodeURIComponent(line.slug)}`}>{line.name}</Link> : line.name}</strong><span>{line.sizeLabel ? `${line.sizeLabel} pack · ` : ''}<PriceTag pricePaise={line.unitPaise} mrpPaise={line.mrpPaise} /> each</span></div>
        <label className="qty-control">Qty<input type="number" min={1} max={MAX_QTY} value={line.qty} onChange={(event) => setQty(lineKey(line), Number(event.target.value))} /></label>
        <strong className="cart-line-total">{formatPaise(line.unitPaise * line.qty)}</strong>
        <button className="text-link" type="button" onClick={() => remove(lineKey(line))} aria-label={`Remove ${line.name}`}>Remove</button>
      </li>)}</ul>
      <aside className="cart-summary"><h2>Order summary</h2>
        <div className="cart-summary-row"><span>Subtotal</span><strong>{formatPaise(subtotalPaise)}</strong></div>
        <p className="notice">Delivery charges, if any, are confirmed by Rasvani on the phone call after you place the order. Home delivery is available only in selected areas of Bihar. You can also pick up from a Rasvani partner shop.</p>
        <Link href="/checkout" className="btn">Continue to checkout</Link>
        <button className="text-link" type="button" onClick={clear}>Empty cart</button>
      </aside>
    </div>}
  </section>;
}
