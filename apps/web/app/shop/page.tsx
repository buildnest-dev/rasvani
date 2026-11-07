import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AddToCart } from '@/components/add-to-cart';
import { ProductArt } from '@/components/product-art';
import { PriceTag } from '@/components/price-tag';
import { loadVisibleProducts } from '@/lib/firebase/catalogue';

export const metadata: Metadata = { title: 'Shop regional foods', description: 'Home-made vegetarian regional foods from Bihar. Order online for delivery or collect from a Rasvani partner shop.' };
export const dynamic = 'force-dynamic';
const storageLabels: Record<string, string> = { ambient: 'Room-temperature storage', chilled: 'Keep chilled', frozen: 'Keep frozen', other: 'Storage details on pack' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const term = (params.q ?? '').trim().slice(0, 80);
  const { products: all, configured, failed } = await loadVisibleProducts();
  const needle = term.toLowerCase();
  const products = needle ? all.filter((item) => `${item.name} ${item.description ?? ''} ${item.makerName ?? ''}`.toLowerCase().includes(needle)) : all;
  return <section className="wrap shop-page">
    <div className="page-hero"><div className="eyebrow">Shop regional foods</div><h1>Fresh from Bihar&apos;s kitchens.</h1><p className="section-intro">Home-made vegetarian regional foods from Bihar. Add to cart, then choose home delivery (selected areas of Bihar) or order online and collect from a Rasvani partner shop.</p></div>
    {!configured ? <div className="shop-empty-editorial" role="status"><div className="shop-empty-editorial-image"><Image src="/images/rasvani-feast-hero.webp" alt="A richly arranged vegetarian table with regional dishes" fill sizes="(max-width: 760px) 100vw, 45vw" /></div><div className="shop-empty-editorial-copy"><div className="eyebrow">THE RASVANI COLLECTION</div><h2>Ordering opens very soon.</h2><p>Our first Bihar collection is being prepared with care.</p><div className="cta-row"><Link href="/explore-india" className="btn">Explore India ↗</Link></div></div></div>
      : failed ? <p className="status" role="status">We are refreshing the catalogue. Please revisit this collection shortly.</p> : <>
        <form className="shop-filters" action="/shop" method="get"><label>Search products<input type="search" name="q" defaultValue={term} maxLength={80} placeholder="Search by food name or baker" /></label><button className="btn" type="submit">Search</button>{term && <Link className="text-link" href="/shop">Clear</Link>}</form>
        {products.length === 0 ? <div className="shop-empty"><h2>The collection is taking shape.</h2><p>{term ? 'No products match your search.' : 'New Bihar foods will appear here very soon.'}</p></div> : <div className="shop-grid">{products.map((product) => <article className="shop-card" key={product.id}>
          <ProductArt product={product} sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" />
          <div className="shop-card-body"><div className="eyebrow">{product.makerName ? `${product.makerName}${product.makerDistrict ? ` · ${product.makerDistrict}` : ''}` : 'Home-made in Bihar'}</div><h2><Link href={`/shop/${encodeURIComponent(product.slug)}`}>{product.name}</Link></h2><p>{product.description?.trim() || 'Home-made vegetarian regional food.'}</p>
            <div className="shop-card-price"><PriceTag pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} /><AddToCart productId={product.id} slug={product.slug} name={product.name} unitPaise={product.pricePaise} /></div>
            <div className="shop-card-foot"><span>{storageLabels[product.storage] ?? ''}</span><Link className="text-link" href={`/shop/${encodeURIComponent(product.slug)}`}>View details →</Link></div></div>
        </article>)}</div>}
        <p className="notice shop-disclaimer">Ordering is open for Bihar only. Rasvani calls you to confirm every order, the final amount, and delivery or pickup. 100% vegetarian.</p>
      </>}
  </section>;
}
