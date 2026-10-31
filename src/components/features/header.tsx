'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import { useUi } from '@/lib/ui-store';
import Link from 'next/link';
import { NavLink } from '@/components/motion/nav-link';
import { useMotion } from '@/components/motion/motion-provider';
import { Mark } from '@/components/brand/sprite';

function ScrollProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  const { motionOK } = useMotion();
  useGSAP(
    () => {
      if (!motionOK || !bar.current) return;
      gsap.to(bar.current, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
    },
    { dependencies: [motionOK] },
  );
  return (
    <div className="progress" aria-hidden="true">
      <span ref={bar} className="progress__bar" />
    </div>
  );
}

const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

const NAV: { label: string; href: `#${string}` | '/states' }[] = [
  { label: 'Home', href: '#top' },
  { label: 'Explore States', href: '/states' },
  { label: 'All Foods', href: '#featured' },
  { label: 'Food Stories', href: '#stories' },
  { label: 'Food Makers', href: '#makers' },
  { label: 'About Us', href: '#home' },
  { label: 'Contact', href: '#contact' },
];

function Links({ className }: { className?: string }) {
  return (
    <>
      {NAV.map((n) =>
        n.href === '/states' ? (
          <Link key={n.label} href={n.href} className={className}>
            {n.label}
          </Link>
        ) : (
          <NavLink key={n.label} href={n.href} className={className}>
            {n.label}
          </NavLink>
        ),
      )}
    </>
  );
}

export function Header() {
  const { t, lang, setLang } = useLocale();
  const pin = useUi((s) => s.pin);
  const loadPin = useUi((s) => s.loadPin);
  const setPinDialogOpen = useUi((s) => s.setPinDialogOpen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => loadPin(), [loadPin]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className="site-header" id="header" data-scrolled={scrolled}>
      <div className="site-header__bar container">
        <NavLink className="wordmark" href="#top" aria-label="Rasvani, back to top">
          <Mark className="wordmark__mark" simple={false} />
          <span className="wordmark__text">
            <span className="wordmark__en">Rasvani</span>
            <span className="wordmark__hi" lang="hi">
              रसवाणी
            </span>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Primary">
          <Links />
        </nav>
        <div className="site-header__tools">
          <Link href="/states" className="icon-btn" aria-label="Search states and foods">
            <svg {...ICON}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          {/* Accounts, wishlist and cart are not built yet (see README): shown for the layout, inert. */}
          <button type="button" className="icon-btn icon-btn--extra" aria-label="Account (coming soon)" aria-disabled="true" title="Coming soon">
            <svg {...ICON}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
          </button>
          <button type="button" className="icon-btn icon-btn--extra" aria-label="Wishlist (coming soon)" aria-disabled="true" title="Coming soon">
            <svg {...ICON}>
              <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.500 15.400 12 20 12 20z" />
            </svg>
          </button>
          <button type="button" className="icon-btn icon-btn--extra" aria-label="Cart (coming soon)" aria-disabled="true" title="Coming soon">
            <svg {...ICON}>
              <path d="M5 8h14l-1 12H6L5 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </button>
          <button className="pin-chip" type="button" aria-haspopup="dialog" onClick={() => setPinDialogOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span>{pin ? t('pin.delivering', { pin }) : t('pin.set')}</span>
          </button>
          <button className="lang" type="button" aria-label={t('lang.aria')} onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}>
            {t('lang.button')}
          </button>
        </div>
      </div>
      <nav className="site-header__strip" aria-label="Primary (compact)">
        <Links />
      </nav>
      <ScrollProgress />
    </header>
  );
}
