'use client';

import { useRef } from 'react';
import Image from 'next/image';
import festive from '@/assets/festive.jpg';
import { gsap, useGSAP } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import { goToNotify } from '@/lib/notify';
import { SplitHeading } from '@/components/motion/split-heading';
import { useMotion } from '@/components/motion/motion-provider';

const COLLECTIONS = [
  { title: 'Chhath Puja', body: 'Thekua is traditionally associated with this festival, alongside other offerings that vary by family and region.', cta: 'Notify me for Chhath', dish: 'Thekua', state: 'BR' },
  { title: 'Diwali', body: 'Dry sweets and snacks from many regions, chosen to travel well between cities.', cta: 'Notify me for Diwali', dish: 'Diwali sweets', state: undefined },
  { title: 'Durga Puja', body: 'Bengali sweets and snacks, starting with the ones that keep for days.', cta: 'Notify me for Durga Puja', dish: 'Durga Puja sweets', state: 'WB' },
] as const;

export function Festival() {
  const { t } = useLocale();
  const { ready, motionOK } = useMotion();
  const root = useRef<HTMLElement>(null);

  /* Background morphs maroon to saffron; text colour flips before contrast drops (05-DESIGN §5.1 scene 5). */
  useGSAP(
    () => {
      const el = root.current;
      if (!ready || !motionOK || !el) return;
      gsap.set(el, { '--fest-fg': 'rgb(255,248,236)' });
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: 'top 75%', end: 'center 45%', scrub: true } })
        .fromTo(el, { '--fest-bg': 'rgb(43,10,16)' }, { '--fest-bg': 'rgb(217,122,43)', ease: 'none', duration: 1 }, 0)
        .set(el, { '--fest-fg': 'rgb(74,15,23)' }, 0.8);
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } })
        .fromTo('.festival__diya.d1', { y: 60 }, { y: -80, ease: 'none' }, 0)
        .fromTo('.festival__diya.d2', { y: 90 }, { y: -50, ease: 'none' }, 0)
        .fromTo('.festival__flower.f1', { y: 40, rotation: -20 }, { y: -60, rotation: 30, ease: 'none' }, 0)
        .fromTo('.festival__flower.f2', { y: 80, rotation: 10 }, { y: -40, rotation: -40, ease: 'none' }, 0);
      gsap.from('.fest-card', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.fest-list', start: 'top 85%', once: true },
      });
    },
    { scope: root, dependencies: [ready, motionOK] },
  );

  return (
    <section ref={root} className="festival" id="festival" aria-labelledby="festTitle">
      <svg className="festival__diya d1" viewBox="0 0 120 90" aria-hidden="true">
        <use href="#diya" />
      </svg>
      <svg className="festival__diya d2" viewBox="0 0 120 90" aria-hidden="true">
        <use href="#diya" />
      </svg>
      <svg className="festival__flower f1" viewBox="0 0 800 800" aria-hidden="true">
        <use href="#mark-s" />
      </svg>
      <svg className="festival__flower f2" viewBox="0 0 800 800" aria-hidden="true">
        <use href="#mark-s" />
      </svg>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="petal"
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-i * 0.7}s`, animationDuration: `${7 + (i % 4)}s`, background: i % 2 ? 'var(--color-saffron-500)' : 'var(--color-gold-500)' }}
        />
      ))}
      <div className="container festival__inner">
        <div className="festival__head">
          <div>
            <SplitHeading id="festTitle" className="h2">
              {t('fest.title')}
            </SplitHeading>
            <p className="lede">{t('fest.lede')}</p>
          </div>
          <figure className="festival__photo grain arch">
            <Image src={festive} alt="Illustration of a festive sweets hamper with diyas" sizes="(min-width: 1024px) 34vw, 80vw" />
            <figcaption>Illustrative image</figcaption>
          </figure>
        </div>
        <ul className="fest-list">
          {COLLECTIONS.map((c) => (
            <li key={c.title} className="fest-card">
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <button type="button" className="btn btn--maroon" data-cursor="link" onClick={() => goToNotify({ dish: c.dish, state: c.state })}>
                {c.cta}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
