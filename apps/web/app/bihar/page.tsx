import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AddToCart } from '@/components/add-to-cart';
import { BiharFoodsGrid, type BiharFoodCard } from '@/components/bihar-foods-grid';
import { biharHomeFoodItems } from '@/lib/bihar-home-food-items';
import { loadVisibleProducts } from '@/lib/firebase/catalogue';
import { formatPaise } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Bihar: famous foods and ordering',
  description: 'Famous traditional vegetarian foods of Bihar. Order home-made Bihari foods online for delivery in Bihar or collect from a partner shop.',
};
export const dynamic = 'force-dynamic';

const cards: BiharFoodCard[] = biharHomeFoodItems.map((item) => ({
  id: item.id, name: item.name, category: item.category, image: item.image, imageAlt: item.imageAlt, href: item.href,
  place: item.associations[0]?.label ?? 'Across Bihar',
  group: /sweet/i.test(item.category) || /(laddoo|ladoo|laddu|khaja|tilkut|anarsa|peda|barfi|gujiya|perukia|balushahi|jamun)/i.test(item.name) ? 'sweets' : /snack/i.test(item.category) ? 'snacks' : 'other',
}));

export default async function BiharPage() {
  const { products, configured, failed } = await loadVisibleProducts();
  return <div className="bihar-page">
    <section className="bh-hero">
      <Image src="/images/bihar-food.jpg" alt="" fill priority sizes="100vw" />
      <div className="bh-hero-shade" aria-hidden="true" />
      <div className="wrap bh-hero-copy">
        <p className="lp-badge"><span className="launch-dot" aria-hidden="true" /> Live in Bihar · part of Rasvani India</p>
        <h1>Bihar</h1>
        <p>Land of rich traditions and timeless flavours. Traditional vegetarian foods, made by home bakers and local kitchens.</p>
        <div className="cta-row"><a className="btn" href="#order-now">Order now</a><Link className="btn secondary bh-light" href="/explore-india/bihar">Explore districts</Link></div>
      </div>
    </section>

    <section className="wrap bh-section" id="order-now" aria-labelledby="bh-order-h">
      <div className="bh-head"><div><span className="eyebrow">ORDER TODAY IN BIHAR</span><h2 id="bh-order-h">Available to order now</h2></div><Link className="text-link" href="/shop">Open the shop →</Link></div>
      {!configured || failed ? <p className="status" role="status">We are refreshing the menu. Please check back shortly.</p>
        : products.length === 0 ? <div className="shop-empty"><h3>New foods are being added.</h3><p>Our first home bakers are joining. Order will open here very soon.</p></div>
        : <div className="shop-grid">{products.map((product) => <article className="shop-card" key={product.id}>
          <div className="shop-card-art" aria-hidden="true"><span>Rasvani · Bihar</span></div>
          <div className="shop-card-body"><div className="eyebrow">{product.makerName ? `${product.makerName}${product.makerDistrict ? ` · ${product.makerDistrict}` : ''}` : 'Home-made in Bihar'}</div>
            <h3><Link href={`/shop/${encodeURIComponent(product.slug)}`}>{product.name}</Link></h3><p>{product.description?.trim() || 'Home-made vegetarian regional food.'}</p>
            <div className="shop-card-price"><strong>{formatPaise(product.pricePaise)}</strong><AddToCart productId={product.id} slug={product.slug} name={product.name} unitPaise={product.pricePaise} /></div></div>
        </article>)}</div>}
      <p className="notice">Home delivery in selected areas of Bihar, or order online and collect from a shop. Pay by cash or UPI. We call you to confirm every order.</p>
    </section>

    <section className="wrap bh-section" aria-labelledby="bh-famous-h">
      <div className="bh-head"><div><span className="eyebrow">FAMOUS FOODS OF BIHAR</span><h2 id="bh-famous-h">Traditional Bihari specialities</h2><p className="lp-sub">Foods Bihar is known for. Illustrative images; availability to order depends on our bakers.</p></div></div>
      <BiharFoodsGrid items={cards} />
    </section>

    <section className="bh-why"><div className="wrap">
      <h2>Why order Bihar&apos;s traditional foods with Rasvani</h2>
      <ul><li><b>Traditional recipes</b><span>Foods rooted in Bihar&apos;s own kitchens</span></li><li><b>Home bakers</b><span>Made by local bakers and restaurants</span></li><li><b>100% vegetarian</b><span>Every item is checked before it is listed</span></li><li><b>Simple ordering</b><span>Delivery in Bihar or collect from a shop</span></li></ul>
    </div></section>
  </div>;
}
