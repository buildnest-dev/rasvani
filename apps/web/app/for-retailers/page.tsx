import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For shops and bulk buyers',
  description: 'Shops, caterers and gifting buyers: write to Rasvani about Bihar’s home-made vegetarian foods.',
};

export default function RetailersPage() {
  return <div className="fp-page">
    <section className="fp-hero">
      <Image src="/images/rasvani-editorial-snack-feast.webp" alt="" fill priority sizes="100vw" className="fp-img" />
      <div className="fp-shade" aria-hidden="true" />
      <div className="wrap fp-copy">
        <span className="rg-badge">Shops, caterers and gifting</span>
        <h1>Buying in bulk?</h1>
        <p>Rasvani is live in Bihar. Tell us what you need and we will tell you honestly what we can supply, and when.</p>
        <div className="cta-row">
          <a className="btn" href="mailto:rasvanifoods@gmail.com?subject=Bulk%20enquiry">Write to Rasvani</a>
          <Link className="btn secondary rg-light" href="/shop">Browse the shop</Link>
        </div>
      </div>
    </section>
    <section className="wrap rg-main">
      <p className="notice">Prices, quantities and delivery for bulk orders are agreed with you directly. Nothing here is a promise of supply or coverage.</p>
    </section>
  </div>;
}
