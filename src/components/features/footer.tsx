'use client';

import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import Link from 'next/link';
import { NavLink } from '@/components/motion/nav-link';
import { useMotion } from '@/components/motion/motion-provider';
import { Logo } from '@/components/brand/sprite';

export function Footer() {
  const { t, lang, setLang } = useLocale();
  const { ready, motionOK, reducedByChoice, osReduced, toggleReduce } = useMotion();
  const word = useRef<HTMLSpanElement>(null);

  /* Wordmark letters rise when the footer scrolls in. */
  useGSAP(
    () => {
      if (!ready || !motionOK || !word.current) return;
      const split = SplitText.create(word.current, {
        type: 'chars',
        mask: 'chars',
        onSplit(self) {
          return gsap.from(self.chars, {
            yPercent: 105,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.04,
            scrollTrigger: { trigger: '.footer__giant', start: 'top 95%', once: true },
          });
        },
      });
      return () => split.revert();
    },
    { dependencies: [ready, motionOK] },
  );

  return (
    <footer className="footer" id="contact">
      <div className="border-printed" aria-hidden="true" />
      <div className="container footer__top">
        <div className="footer__brand">
          <NavLink className="logo logo--lg" href="#top" aria-label="Rasvani, back to top">
            <Logo />
          </NavLink>
          <p className="footer__tag">{t('footer.tag')}</p>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          <Link href="/states">{t('nav.states')}</Link>
          <NavLink href="#journey">{t('nav.map')}</NavLink>
          <NavLink href="#festival">{t('nav.collections')}</NavLink>
          <NavLink href="#makers">{t('nav.makers')}</NavLink>
          <NavLink href="#how">{t('nav.how')}</NavLink>
          <NavLink href="#notify">{t('notify.btn')}</NavLink>
        </nav>
        <div className="footer__prefs">
          <button type="button" className="linkbtn" onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}>
            {t('footer.lang')}
          </button>
          <button
            type="button"
            className="linkbtn"
            aria-pressed={reducedByChoice || osReduced}
            title={osReduced ? 'Your device is already set to reduce motion' : undefined}
            onClick={toggleReduce}
          >
            {t('footer.motion')}
          </button>
        </div>
      </div>
      <p className="container footer__legal">
        Company, FSSAI and grievance-officer details, plus Terms, Privacy, Shipping and Refund policies, are published here before launch.
      </p>
      <div className="footer__giant" aria-hidden="true">
        <span ref={word}>Rasvani</span>
      </div>
    </footer>
  );
}
