'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import { SplitHeading } from '@/components/motion/split-heading';
import { useMotion } from '@/components/motion/motion-provider';

const STEPS = [
  { title: 'Discover', body: 'Start from a state, a region or the dish you’re missing. Spellings and native-script names all work in search.' },
  { title: 'Verify', body: 'See who makes it, where, what’s in it and how long it keeps, before you add it to your cart.' },
  { title: 'Check your PIN', body: 'We check each product against your PIN code and show a real delivery window, or say it isn’t available yet.' },
  { title: 'Order', body: 'Pay securely, then follow it from confirmed to prepared, packed, dispatched and delivered.' },
] as const;

/* The connecting path draws as you scroll (desktop only); mobile is a plain vertical stepper. */
export function HowItWorks() {
  const { t } = useLocale();
  const { ready, motionOK } = useMotion();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ready || !motionOK) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        gsap.set('.how__step', { opacity: 0.25, y: 14 });
        gsap.set('#howPath path', { strokeDashoffset: 1 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.how__steps', start: 'top 72%', end: 'bottom 60%', scrub: true } });
        tl.to('#howPath path', { strokeDashoffset: 0, ease: 'none', duration: 4 }, 0);
        gsap.utils.toArray<HTMLElement>('.how__step').forEach((s, i) => tl.to(s, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, i * 1.1));
        return () => void gsap.set('.how__step', { clearProps: 'opacity,transform' });
      });
    },
    { scope: root, dependencies: [ready, motionOK] },
  );

  return (
    <section ref={root} className="how" id="how" aria-labelledby="howTitle">
      <div className="container">
        <SplitHeading id="howTitle" className="h2">
          {t('how.title')}
        </SplitHeading>
        <div className="how__steps">
          <svg className="how__path" id="howPath" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M10 20 C 170 -4, 330 44, 500 20 S 830 -4, 990 20" pathLength={1} fill="none" stroke="#d9a441" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <ol className="how__list">
            {STEPS.map((s, i) => (
              <li key={s.title} className="how__step">
                <span className="how__node" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
