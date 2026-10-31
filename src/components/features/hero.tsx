'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import { useUi } from '@/lib/ui-store';
import { AnchorLink } from '@/components/motion/anchor-link';
import { SplitHeading } from '@/components/motion/split-heading';
import { useMotion } from '@/components/motion/motion-provider';
import { PinCheck } from './pin-check';
import { ThaliHero } from './thali-hero';

export function Hero() {
  const { t } = useLocale();
  const { motionOK, fine } = useMotion();
  const introDone = useUi((s) => s.introDone);
  const root = useRef<HTMLElement>(null);

  /* Entry choreography. Initial states are set while the intro plays, then released. */
  useGSAP(
    () => {
      if (!motionOK) return;
      gsap.set('.hero-rv:not(.hero__thali)', { y: 18 });
      gsap.set('.hero__thali', { scale: 0.6, rotation: -40, transformOrigin: '50% 50%' });
      if (!introDone) return;
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .to('.hero__thali', { scale: 1, rotation: 0, opacity: 1, duration: 1.6 }, 0)
        .to('.hero-rv:not(.hero__thali)', { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.35);
    },
    { scope: root, dependencies: [motionOK, introDone] },
  );

  /* Gentle pointer parallax (pointer-fine only). */
  useGSAP(
    () => {
      const el = root.current;
      if (!motionOK || !fine || !el) return;
      const thali = el.querySelector<HTMLElement>('.thali__float');
      const rings = el.querySelector<SVGSVGElement>('.hero__rings svg');
      if (!thali || !rings) return;
      const fx = gsap.quickTo(thali, 'x', { duration: 0.9, ease: 'power3' });
      const fy = gsap.quickTo(thali, 'y', { duration: 0.9, ease: 'power3' });
      const rx = gsap.quickTo(rings, 'x', { duration: 1.2, ease: 'power3' });
      const ry = gsap.quickTo(rings, 'y', { duration: 1.2, ease: 'power3' });
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        fx(nx * -18);
        fy(ny * -14);
        rx(nx * 14);
        ry(ny * 10);
      };
      el.addEventListener('pointermove', onMove);
      return () => el.removeEventListener('pointermove', onMove);
    },
    { scope: root, dependencies: [motionOK, fine] },
  );

  return (
    <section ref={root} className="hero" id="top" aria-labelledby="heroTitle">
      <div className="hero__art" aria-hidden="true">
        <div className="hero__rings">
          <svg viewBox="-500 -500 1000 1000">
            <circle r="470" fill="none" stroke="#d9a441" strokeOpacity=".16" strokeDasharray="2 10" strokeLinecap="round" strokeWidth="2" />
            <circle r="400" fill="none" stroke="#d9a441" strokeOpacity=".12" strokeWidth="1" />
            <circle r="330" fill="none" stroke="#d9a441" strokeOpacity=".2" strokeDasharray="1 7" strokeLinecap="round" strokeWidth="3" />
          </svg>
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <span key={n} className={`spark s${n}`} />
        ))}
      </div>

      <div className="container hero__grid">
        <div className="hero__body">
          <p className="hero__tag hero-rv">{t('hero.tag')}</p>
          <SplitHeading as="h1" id="heroTitle" className="hero__title" hero>
            {t('hero.title')} <span className="gold">{t('hero.titleAccent')}</span>
          </SplitHeading>
          <p className="hero__sub hero-rv">{t('hero.sub')}</p>
          <div className="hero__cta hero-rv">
            <AnchorLink className="btn btn--gold" href="#journey" magnetic data-cursor="link">
              {t('hero.cta1')}
            </AnchorLink>
            <AnchorLink className="btn btn--ghost" href="#notify" magnetic data-cursor="link">
              {t('hero.cta2')}
            </AnchorLink>
          </div>
          <PinCheck variant="hero" inputId="heroPin" />
        </div>
        <ThaliHero />
      </div>
      <p className="hero__note container hero-rv">{t('hero.note')}</p>
      <div className="border-printed" aria-hidden="true" />
    </section>
  );
}
