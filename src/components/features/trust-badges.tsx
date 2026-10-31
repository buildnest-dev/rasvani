import type { ReactNode } from 'react';

/* Copy follows 04-AI-RULES §2: process promises we can keep, no nationwide-delivery or authenticity claims. */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const ITEMS: ReadonlyArray<{ icon: ReactNode; title: string; body: string }> = [
  {
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
        <path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14z" />
        <path d="M5 19c3-4 6-6 9-8" />
      </svg>
    ),
    title: '100% vegetarian',
    body: 'Foods that may have non-veg versions stay off sale until the recipe is confirmed.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
        <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    title: 'Delivery checked by PIN',
    body: 'We show a real delivery window for your PIN, or tell you plainly that we can’t yet.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: 'Makers checked first',
    body: 'Licence, sample and packaging are reviewed before anything is listed.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    ),
    title: 'Origin before adjectives',
    body: '“Verified origin” appears only when we hold the evidence for it.',
  },
];

export function TrustBadges() {
  return (
    <section className="trust" aria-label="What we promise">
      <ul className="container trust__grid">
        {ITEMS.map((i) => (
          <li key={i.title} className="trust__item">
            <span className="trust__icon">{i.icon}</span>
            <span>
              <strong>{i.title}</strong>
              <small>{i.body}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
