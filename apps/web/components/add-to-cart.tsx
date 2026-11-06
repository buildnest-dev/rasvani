'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MAX_QTY, useCart } from '@/components/cart-provider';

type Props = { productId: string; slug: string; name: string; unitPaise: number; showQuantity?: boolean };

export function AddToCart({ productId, slug, name, unitPaise, showQuantity = false }: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  return <div className="add-to-cart">
    {showQuantity && <label className="qty-control">Quantity
      <input type="number" min={1} max={MAX_QTY} value={qty} onChange={(event) => setQty(Math.max(1, Math.min(MAX_QTY, Number(event.target.value) || 1)))} />
    </label>}
    <button className="btn" type="button" onClick={() => { add({ productId, slug, name, unitPaise }, qty); setAdded(true); window.setTimeout(() => setAdded(false), 2500); }}>Add to cart</button>
    {added && <span className="add-to-cart-note" role="status">Added. <Link href="/cart" className="text-link">View cart →</Link></span>}
  </div>;
}
