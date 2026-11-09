'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadReviews, type PublicReview } from '@/app/actions/session';
import { ProductArt } from '@/components/product-art';
import { ProductBuy } from '@/components/product-buy';
import { PriceTag } from '@/components/price-tag';
import { Stars } from '@/components/stars';
import type { Product } from '@/lib/firebase/catalogue';

const storageLabels: Record<string, string> = { ambient: 'Room-temperature storage', chilled: 'Keep chilled', frozen: 'Keep frozen', other: 'Storage details on pack' };

/**
 * A product card that FLIPS (3D) to show the details on its back instead of opening another page:
 * description, every pack size with price / MRP / % off, rating, recent reviews and add to cart.
 */
export function ProductCard({ product, heading: Heading = 'h2' }: { product: Product; heading?: 'h2' | 'h3' }) {
  const [flipped, setFlipped] = useState(false);
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontButton = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    setFlipped(true);
    if (reviews === null) void loadReviews(product.id).then(setReviews);
  }, [product.id, reviews]);
  const close = useCallback(() => { setFlipped(false); window.setTimeout(() => frontButton.current?.focus(), 350); }, []);
  useEffect(() => {
    if (!flipped) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    window.setTimeout(() => backRef.current?.querySelector<HTMLElement>('button')?.focus(), 400);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, close]);

  const maker = product.makerName ? `${product.makerName}${product.makerDistrict ? ` · ${product.makerDistrict}` : ''}` : 'Home-made in Bihar';
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : null;
  return <article className={`shop-card flip-card${flipped ? ' is-flipped' : ''}`}>
    <div className="flip-inner">
      <div className="flip-face flip-front" aria-hidden={flipped} {...(flipped ? { inert: true } : {})}>
        <ProductArt product={product} sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" />
        <div className="shop-card-body"><div className="eyebrow">{maker}</div>
          <Heading>{product.name}</Heading><Stars sum={product.ratingSum} count={product.ratingCount} />
          <p>{product.description?.trim() || 'Home-made vegetarian regional food.'}</p>
          <ProductBuy productId={product.id} slug={product.slug} name={product.name} pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} sizes={product.sizes} />
          <div className="shop-card-foot"><span>{storageLabels[product.storage] ?? ''}</span><button ref={frontButton} type="button" className="text-link" onClick={open} aria-expanded={flipped}>View details →</button></div>
        </div>
      </div>

      <div className="flip-face flip-back" ref={backRef} aria-hidden={!flipped} {...(!flipped ? { inert: true } : {})}>
        <div className="flip-back-head"><div><div className="eyebrow">{maker}</div><Heading>{product.name}</Heading><Stars sum={product.ratingSum} count={product.ratingCount} /></div>
          <button type="button" className="flip-close" onClick={close} aria-label="Back to the card">✕</button></div>
        <div className="flip-back-scroll">
          {product.description?.trim() && <p className="flip-desc">{product.description.trim()}</p>}
          <ul className="flip-facts"><li><b>100%</b> vegetarian</li><li>{storageLabels[product.storage] ?? 'Storage details on pack'}</li></ul>
          <h4>{sizes ? 'Pack sizes & prices' : 'Price'}</h4>
          <ul className="flip-sizes">{(sizes ?? [{ id: 'one', label: 'Single pack', pricePaise: product.pricePaise, mrpPaise: product.mrpPaise ?? null }]).map((size) => <li key={size.id}><span>{size.label}</span><PriceTag pricePaise={size.pricePaise} mrpPaise={size.mrpPaise} /></li>)}</ul>
          <h4>Customer reviews</h4>
          {reviews === null ? <p className="notice" role="status">Loading reviews…</p>
            : reviews.length === 0 ? <p className="notice">No reviews yet. Customers can review a food after their order is delivered.</p>
            : <ul className="flip-reviews">{reviews.slice(0, 6).map((review) => <li key={review.id}><div><strong>{review.name}</strong> <Stars sum={review.rating} count={1} showCount={false} /></div>{review.comment && <p>{review.comment}</p>}</li>)}</ul>}
        </div>
        <div className="flip-back-buy"><ProductBuy productId={product.id} slug={product.slug} name={product.name} pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} sizes={product.sizes} /></div>
      </div>
    </div>
  </article>;
}
