'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { MARQUEE } from '@/modules/catalog/states';
import { useMotion } from './motion-provider';

function List({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="marquee__list" aria-hidden={hidden || undefined}>
      {MARQUEE.map(([name, script]) => (
        <li key={name}>
          {name} <i lang="und">{script}</i>
        </li>
      ))}
    </ul>
  );
}

/* Endless strip; speed reacts to scroll velocity. Static scrollable strip when motion is off. */
export function Marquee() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const { motionOK } = useMotion();

  useGSAP(
    () => {
      if (!motionOK || !track.current) return;
      const tween = gsap.to(track.current, { xPercent: -50, ease: 'none', duration: 60, repeat: -1 });
      let boost = 0;
      let lastY = window.scrollY;
      const tick = () => {
        const v = Math.abs(window.scrollY - lastY);
        lastY = window.scrollY;
        boost += (Math.min(v * 0.35, 5) - boost) * 0.1;
        tween.timeScale(1 + boost);
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: root, dependencies: [motionOK] },
  );

  return (
    <section ref={root} className="marquee" aria-label="A few of the foods in our library">
      <div ref={track} className="marquee__track">
        <List />
        {motionOK && <List hidden />}
      </div>
    </section>
  );
}
