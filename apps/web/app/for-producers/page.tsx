import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cook with Rasvani',
  description: 'Home bakers and restaurants in Bihar: get your home-made vegetarian food in front of customers with Rasvani.',
};

const steps = [
  ['Tell us about your kitchen', 'Write to us with your name, district, phone and what you make.'],
  ['We add you to Rasvani', 'We save your details and location and list your foods with real pictures.'],
  ['Orders reach you', 'When a customer orders, Rasvani talks to you, confirms the delivery or takeaway, and you prepare the food.'],
];

export default function ProducersPage() {
  return <div className="fp-page">
    <section className="fp-hero">
      <Image src="/images/rasvani-editorial-sweets-brass.webp" alt="" fill priority sizes="100vw" className="fp-img" />
      <div className="fp-shade" aria-hidden="true" />
      <div className="wrap fp-copy">
        <span className="rg-badge is-live">Bihar home bakers and restaurants</span>
        <h1>Your kitchen, on Rasvani.</h1>
        <p>If you make traditional vegetarian food in Bihar, Rasvani can bring it to customers who miss the taste of home.</p>
        <div className="cta-row">
          <a className="btn" href="mailto:rasvanifoods@gmail.com?subject=Cook%20with%20Rasvani">Write to Rasvani</a>
          <Link className="btn secondary rg-light" href="/bihar">See what is live</Link>
        </div>
      </div>
    </section>
    <section className="wrap rg-main">
      <div className="eyebrow">HOW IT WORKS</div>
      <h2 className="fp-h2">Three simple steps.</h2>
      <div className="rg-steps">{steps.map(([title, text], index) => <article key={title}><b>{index + 1}</b><h3>{title}</h3><p>{text}</p></article>)}</div>
      <p className="notice">Rasvani lists only 100% vegetarian food. We confirm every listing with you before it goes live. Joining does not guarantee a listing.</p>
    </section>
  </div>;
}
