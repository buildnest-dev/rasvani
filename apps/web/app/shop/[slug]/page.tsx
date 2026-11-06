import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCart } from '@/components/add-to-cart';
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
  return <section className="wrap shop-page">
    <div className="page-hero"><div className="eyebrow">{product.makerName ?? 'Home-made in Bihar'}</div><h1>{product.name}</h1><p className="section-intro">{product.description || 'Home-made vegetarian regional food.'}</p><Link className="text-link" href="/shop">← Back to shop</Link></div>
    <div className="product-detail-panel">
      <div className="shop-card-art shop-detail-art" aria-hidden="true"><span>Rasvani · Bihar</span></div>
      <div className="product-detail-copy">
        <h2>Product information</h2>
        <dl><dt>Storage</dt><dd>{storageLabels[product.storage] ?? 'On pack'}</dd><dt>Diet</dt><dd>100% vegetarian</dd><dt>Made by</dt><dd>{product.makerName ?? 'A Bihar home baker'}{product.makerDistrict ? `, ${product.makerDistrict}` : ''}</dd></dl>
        <div className="product-buy"><p className="product-price">{formatPaise(product.pricePaise)}</p><AddToCart productId={product.id} slug={product.slug} name={product.name} unitPaise={product.pricePaise} showQuantity /><p className="notice">Home delivery in selected areas of Bihar, or collect from a Rasvani partner shop. Rasvani confirms every order by phone.</p></div>
      </div>
    </div>
  </section>;
}
