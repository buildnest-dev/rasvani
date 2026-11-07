import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCart } from '@/components/add-to-cart';
import { ProductArt } from '@/components/product-art';
import { PriceTag } from '@/components/price-tag';
import { loadVisibleProducts } from '@/lib/firebase/catalogue';
import { formatPaise } from '@/lib/money';

export const dynamic = 'force-dynamic';
const storageLabels: Record<string, string> = { ambient: 'Room-temperature storage', chilled: 'Keep chilled', frozen: 'Keep frozen', other: 'Storage details on pack' };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug.replace(/-[a-z0-9]{5}$/, '').replaceAll('-', ' ')} | Rasvani` };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, configured, failed } = await loadVisibleProducts();
  if (!configured || failed) return <section className="wrap shop-page"><p className="status" role="status">This product could not be loaded right now. <Link href="/shop" className="text-link">Back to shop</Link></p></section>;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  const maker = product.makerName ?? 'A Bihar home baker';
  const where = product.makerDistrict ? `${product.makerDistrict}, Bihar` : 'Bihar';
  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  return <section className="wrap shop-page pd-page">
    <Link className="text-link" href="/bihar#order-now">← Back to Bihar</Link>
    <div className="pd-grid">
      <ProductArt product={product} priority sizes="(max-width: 900px) 100vw, 50vw" className="pd-art" />
      <div className="pd-info">
        <span className="eyebrow">{maker}</span>
        <h1>{product.name}</h1>
        <p className="pd-price"><PriceTag pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} /></p>
        <div className="pd-from"><span aria-hidden="true">✳</span><div><small>Made by</small><strong>{maker}</strong><em>{where}</em></div></div>
        <ul className="pd-facts">
          <li><b>100%</b> vegetarian</li>
          <li><b>{storageLabels[product.storage] ?? 'Storage on pack'}</b></li>
          <li><b>Delivery</b> in selected areas of Bihar, or collect from a shop</li>
        </ul>
        <div className="product-buy"><AddToCart productId={product.id} slug={product.slug} name={product.name} unitPaise={product.pricePaise} showQuantity /></div>
        <p className="notice">Pay by cash on delivery or by UPI QR. Rasvani calls you to confirm every order and any delivery charge.</p>
      </div>
    </div>
    <div className="pd-about"><h2>About this food</h2><p>{product.description?.trim() || 'Home-made vegetarian regional food from Bihar.'}</p></div>
    {related.length > 0 && <div className="pd-related"><h2>You may also like</h2><div className="pd-related-row">{related.map((item) => <Link key={item.id} href={`/shop/${encodeURIComponent(item.slug)}`} className="pd-rel-card"><ProductArt product={item} sizes="120px" className="pd-rel-art" /><span><strong>{item.name}</strong><small>{formatPaise(item.pricePaise)}</small></span></Link>)}</div></div>}
  </section>;
}
