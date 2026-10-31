'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useUi } from '@/lib/ui-store';
import { useMotion } from './motion-provider';

/* Entry: first visit per session, <= 900 ms, overlaps real loading (05-DESIGN §5.1 scene 0).
   `html.has-intro` is set by the inline script in layout.tsx before first paint. */
export function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, motionOK } = useMotion();
  const setIntroDone = useUi((s) => s.setIntroDone);

  useGSAP(
    () => {
      const el = ref.current;
      if (!ready || !el) return;
      if (!motionOK || !document.documentElement.classList.contains('has-intro')) {
        setIntroDone();
        return;
      }
      try {
        sessionStorage.setItem('ys-intro', '1');
      } catch {
        /* storage blocked */
      }
      gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)' });
      gsap
        .timeline({ onComplete: () => void (el.style.display = 'none') })
        .from('.intro__mark', { scale: 0.5, rotation: -45, opacity: 0, duration: 0.45, ease: 'expo.out' })
        .from('.intro__word', { opacity: 0, y: 10, duration: 0.25 }, 0.15)
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.4, ease: 'power3.inOut' }, 0.4)
        .call(setIntroDone, undefined, 0.55);
    },
    { scope: ref, dependencies: [ready, motionOK] },
  );

  return (
    <div ref={ref} className="intro" aria-hidden="true">
      <svg className="intro__mark" viewBox="0 0 800 800">
        <use href="#mark" />
      </svg>
      <p className="intro__word">Rasvani</p>
    </div>
  );
}
