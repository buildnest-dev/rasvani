'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MAX_QTY, lineKey, useCart, type CartLine } from '@/components/cart-provider';
import { PriceTag } from '@/components/price-tag';
import { loadVisibleProducts, type Product } from '@/lib/firebase/catalogue';
import { formatPaise } from '@/lib/money';
import { priceFor } from '@/lib/pack-sizes';

type Problem = 'needs-size' | 'gone' | null;

export default function CartPage() {
  const { lines, ready, subtotalPaise, setQty, remove, clear, replaceLine, reprice } = useCart();
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  useEffect(() => { void loadVisibleProducts().then((result) => setCatalog(result.configured && !result.failed ? result.products : null)); }, []);

  /** Compares each cart line with the food as it is NOW (admin may have added pack sizes or changed prices since it was added). */
  const status = useMemo(() => {
    const map = new Map<string, { problem: Problem; product?: Product }>();
    if (!catalog) return map;
    for (const line of lines) {
      const product = catalog.find((item) => item.id === line.productId);
      if (!product) { map.set(lineKey(line), { problem: 'gone' }); continue; }
      const current = priceFor(product, line.sizeId);
      map.set(lineKey(line), { problem: current ? null : 'needs-size', product });
    }
    return map;
  }, [catalog, lines]);

  // Keep the price on every valid line equal to the current price.
  useEffect(() => {
    if (!catalog) return;
    for (const line of lines) {
      const entry = status.get(lineKey(line));
      if (!entry?.product || entry.problem) continue;
      const current = priceFor(entry.product, line.sizeId);
      if (current && (current.pricePaise !== line.unitPaise || (current.mrpPaise ?? undefined) !== line.mrpPaise)) reprice(lineKey(line), current.pricePaise, current.mrpPaise ?? undefined);
    }
  }, [catalog, lines, status, reprice]);

  const blocked = lines.some((line) => status.get(lineKey(line))?.problem);
  const choose = (line: CartLine, product: Product, sizeId: string) => {
    const choice = priceFor(product, sizeId);
    if (!choice) return;
    replaceLine(lineKey(line), { productId: line.productId, slug: product.slug, name: product.name, ...(sizeId ? { sizeId, sizeLabel: choice.label } : {}), unitPaise: choice.pricePaise, ...(choice.mrpPaise ? { mrpPaise: choice.mrpPaise } : {}) });
  };

  return <section className="wrap cart-page">
    <div className="page-hero"><div className="eyebrow">Your cart</div><h1>Your cart</h1><p className="section-intro">Review what you picked. The final amount is confirmed again when you place the order.</p></div>
    {!ready ? <p className="status" role="status">Loading your cart…</p> : lines.length === 0 ? <div className="shop-empty"><h2>Your cart is empty</h2><p>Add something from the shop to start an order.</p><Link href="/shop" className="btn">Go to the shop</Link></div> : <div className="cart-layout">
      <ul className="cart-lines">{lines.map((line) => {
        const key = lineKey(line); const entry = status.get(key);
        return <li key={key} className="cart-line">
          <div className="cart-line-main"><strong>{line.slug ? <Link href={`/shop/${encodeURIComponent(line.slug)}`}>{line.name}</Link> : line.name}</strong>
            {entry?.problem === 'gone' ? <span className="notice" role="alert">This food is no longer available. Please remove it.</span>
              : entry?.problem === 'needs-size' && entry.product ? <label className="size-select notice" role="alert">This food now comes in pack sizes. Choose one:
                <select defaultValue="" onChange={(event) => { if (event.target.value) choose(line, entry.product as Product, event.target.value); }}>
                  <option value="" disabled>Choose pack size</option>
                  {(entry.product.sizes ?? []).map((size) => <option key={size.id} value={size.id}>{size.label} · {formatPaise(size.pricePaise)}</option>)}
                </select></label>
              : <span>{line.sizeLabel ? `${line.sizeLabel} pack · ` : ''}<PriceTag pricePaise={line.unitPaise} mrpPaise={line.mrpPaise} /> each</span>}
          </div>
          <label className="qty-control">Qty<input type="number" min={1} max={MAX_QTY} value={line.qty} onChange={(event) => setQty(key, Number(event.target.value))} /></label>
          <strong className="cart-line-total">{entry?.problem ? '—' : formatPaise(line.unitPaise * line.qty)}</strong>
          <button className="text-link" type="button" onClick={() => remove(key)} aria-label={`Remove ${line.name}`}>Remove</button>
        </li>;
      })}</ul>
      <aside className="cart-summary"><h2>Order summary</h2>
        <div className="cart-summary-row"><span>Subtotal</span><strong>{formatPaise(lines.reduce((sum, line) => sum + (status.get(lineKey(line))?.problem ? 0 : line.unitPaise * line.qty), 0) || (blocked ? 0 : subtotalPaise))}</strong></div>
        <p className="notice">Delivery charges, if any, are confirmed by Rasvani on the phone call after you place the order. Home delivery is available only in selected areas of Bihar. You can also pick up from a Rasvani partner shop.</p>
        {blocked ? <><span className="btn" aria-disabled="true" style={{ opacity: 0.5, pointerEvents: 'none' }}>Continue to checkout</span><p className="notice" role="status">Choose the pack size (or remove the unavailable food) above to continue.</p></> : <Link href="/checkout" className="btn">Continue to checkout</Link>}
        <button className="text-link" type="button" onClick={clear}>Empty cart</button>
      </aside>
    </div>}
  </section>;
}
