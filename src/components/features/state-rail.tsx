'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import { useUi } from '@/lib/ui-store';
import { AnchorLink } from '@/components/motion/anchor-link';
import { SplitHeading } from '@/components/motion/split-heading';
import { useMotion } from '@/components/motion/motion-provider';
import { STATES_ALPHA } from '@/modules/catalog/states';
import { foodCount, foodsFor } from '@/modules/catalog/foods';

/* Pinned horizontal rail on desktop, native swipe with snap everywhere else. */
export function StateRail() {
  const { t } = useLocale();
  const { ready, motionOK } = useMotion();
  const openPanel = useUi((s) => s.openPanel);
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = section.current;
      const tr = track.current;
      const vp = viewport.current;
      if (!ready || !motionOK || !el || !tr || !vp) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        el.classList.add('rail--pinned');
        const dist = () => Math.max(0, tr.scrollWidth - vp.clientWidth + 32);
        gsap.to(tr, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true },
        });
        return () => {
          el.classList.remove('rail--pinned');
          gsap.set(tr, { clearProps: 'x' });
        };
      });
      return () => ScrollTrigger.refresh();
    },
    { scope: section, dependencies: [ready, motionOK] },
  );

  return (
    <section ref={section} className="rail" id="rail" aria-labelledby="railTitle">
      <div className="rail__head container">
        <SplitHeading id="railTitle" className="h2">
          {t('rail.title')}
        </SplitHeading>
        <p className="lede">{t('rail.lede')}</p>
      </div>
      <div ref={viewport} className="rail__viewport">
        <div ref={track} className="rail__track">
          {STATES_ALPHA.map((s) => {
            const code = s.code;
            const all = foodsFor(code);
            const extra = all.length - 3;
            const dishes = all.slice(0, 3).map((d) => d.name).join(' · ') + (extra > 0 ? `  +${extra} more` : '');
            return (
              <button
                key={code}
                type="button"
                className="scard"
                data-cursor="view"
                data-cursor-label="View"
                onClick={(e) => openPanel(code, e.currentTarget)}
              >
                <span className="scard__script" lang="und">
                  {s.native || s.code}
                </span>
                <span>
                  <span className="scard__name" style={{ display: 'block' }}>
                    {s.name}
                  </span>
                  <span className="scard__meta" style={{ display: 'block' }}>
                    {foodCount(code)} traditional foods
                  </span>
                  <span className="scard__dishes" style={{ display: 'block' }}>
                    {dishes}
                  </span>
                </span>
              </button>
            );
          })}
          <AnchorLink className="scard scard--all" href="#journey" data-cursor="link">
            <span className="scard__script">28</span>
            <span>
              <span className="scard__name" style={{ display: 'block' }}>
                All states
              </span>
              <span className="scard__dishes" style={{ display: 'block' }}>
                Open the map and pick any state.
              </span>
            </span>
          </AnchorLink>
        </div>
      </div>
    </section>
  );
}
