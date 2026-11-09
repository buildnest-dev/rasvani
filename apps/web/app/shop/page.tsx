import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { loadVisibleProducts } from '@/lib/firebase/catalogue';

export const metadata: Metadata = { title: 'Shop regional foods', description: 'Home-made vegetarian regional foods from Bihar. Order online for delivery or collect from a Rasvani partner shop.' };
export const dynamic = 'force-dynamic';

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
        {products.length === 0 ? <div className="shop-empty"><h2>The collection is taking shape.</h2><p>{term ? 'No products match your search.' : 'New Bihar foods will appear here very soon.'}</p></div> : <div className="shop-grid">{products.map((product) => <ProductCard key={product.id} product={product} heading="h2" />)}</div>}
        <p className="notice shop-disclaimer">Ordering is open for Bihar only. Rasvani calls you to confirm every order, the final amount, and delivery or pickup. 100% vegetarian.</p>
      </>}
  </section>;
}
