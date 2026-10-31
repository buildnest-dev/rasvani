'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { setLenis } from '@/lib/scroll';
import { useMotion } from './motion-provider';

/* One scroll driver: Lenis + GSAP ScrollTrigger share gsap.ticker (04-AI-RULES §5.2).
   Pointer-fine and motion-allowed only; native scroll on touch. */
export function SmoothScroll() {
  const { motionOK, fine } = useMotion();

  useEffect(() => {
    if (!motionOK || !fine) return;
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false });
    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, [motionOK, fine]);

  return null;
}
