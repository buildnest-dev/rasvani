'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useMotion } from './motion-provider';

/* Spec 05-DESIGN §6.4. Visible only for pointer-fine + motion allowed; never blocks clicks. */
export function Cursor() {
  const { motionOK, fine } = useMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const d = dot.current;
    const r = ring.current;
    if (!motionOK || !fine || !d || !r) return;

    const root = document.documentElement;
    root.classList.add('has-custom-cursor');
    gsap.set([d, r], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    const dX = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'power3' });
    const dY = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'power3' });
    const rX = gsap.quickTo(r, 'x', { duration: 0.4, ease: 'power3' });
    const rY = gsap.quickTo(r, 'y', { duration: 0.4, ease: 'power3' });

    const onMove = (e: PointerEvent) => {
      gsap.to([d, r], { autoAlpha: 1, duration: 0.2, overwrite: 'auto' });
      dX(e.clientX);
      dY(e.clientY);
      rX(e.clientX);
      rY(e.clientY);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element;
      const el = target.closest<HTMLElement>('[data-cursor]');
      const disabled = target.closest(':disabled, [aria-disabled="true"]');
      const plain = target.closest('a, button, [role="button"], summary, label');
      r.dataset.state = disabled ? 'disabled' : el ? (el.dataset.cursor ?? 'default') : plain ? 'link' : 'default';
      if (label.current) label.current.textContent = el?.dataset.cursorLabel ?? '';
    };
    const onLeave = () => gsap.to([d, r], { autoAlpha: 0, duration: 0.2 });

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerleave', onLeave);
      root.classList.remove('has-custom-cursor');
    };
  }, [motionOK, fine]);

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" data-state="default">
        <div className="cursor-ring__inner">
          <span ref={label} />
        </div>
      </div>
    </div>
  );
}
