'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MAX_QTY, useCart } from '@/components/cart-provider';
import { PriceTag } from '@/components/price-tag';
import { priceFor, type PackSize } from '@/lib/pack-sizes';

type Props = {
  productId: string; slug: string; name: string; pricePaise: number; mrpPaise?: number | null; sizes?: PackSize[] | null;
  /** "chips" on the product page, "select" on small cards. */
  layout?: 'chips' | 'select'; showQuantity?: boolean;
};

/** Pack-size picker + price (with MRP and % off) + add to cart. One product, many sizes: the customer never needs two products. */
export function ProductBuy({ productId, slug, name, pricePaise, mrpPaise, sizes, layout = 'select', showQuantity = false }: Props) {
  const { add } = useCart();
  const list = sizes && sizes.length > 0 ? sizes : null;
  const [sizeId, setSizeId] = useState<string | undefined>(list?.[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const choice = priceFor({ pricePaise, mrpPaise, sizes: list }, sizeId) ?? { pricePaise, mrpPaise: mrpPaise ?? null, label: '' };
  return <div className="product-buy-box">
    {list && (layout === 'chips'
      ? <fieldset className="size-chips"><legend>Pack size</legend>{list.map((size) => <label key={size.id} className={size.id === sizeId ? 'on' : ''}><input type="radio" name={`size-${productId}`} checked={size.id === sizeId} onChange={() => setSizeId(size.id)} />{size.label}</label>)}</fieldset>
      : <label className="size-select"><span className="sr-only">Pack size</span><select value={sizeId} onChange={(event) => setSizeId(event.target.value)} aria-label={`Pack size for ${name}`}>{list.map((size) => <option key={size.id} value={size.id}>{size.label}</option>)}</select></label>)}
    <div className="shop-card-price">
      <PriceTag pricePaise={choice.pricePaise} mrpPaise={choice.mrpPaise} />
      <div className="add-to-cart">
        {showQuantity && <label className="qty-control">Quantity<input type="number" min={1} max={MAX_QTY} value={qty} onChange={(event) => setQty(Math.max(1, Math.min(MAX_QTY, Number(event.target.value) || 1)))} /></label>}
        <button className="btn" type="button" onClick={() => { add({ productId, slug, name, sizeId, sizeLabel: sizeId ? choice.label : undefined, unitPaise: choice.pricePaise, ...(choice.mrpPaise ? { mrpPaise: choice.mrpPaise } : {}) }, qty); setAdded(true); window.setTimeout(() => setAdded(false), 2500); }}>Add to cart</button>
      </div>
    </div>
    {added && <span className="add-to-cart-note" role="status">Added{choice.label ? ` (${choice.label})` : ''}. <Link href="/cart" className="text-link">View cart →</Link></span>}
  </div>;
}
