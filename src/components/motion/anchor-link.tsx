'use client';

import { useEffect, useRef, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { gsap } from '@/lib/gsap';
import { getLenis, scrollToTarget } from '@/lib/scroll';
import { useMotion } from './motion-provider';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: `#${string}`;
  /** Pull toward the pointer (<= 12 px). Pointer-fine only. */
  magnetic?: boolean;
}

/* In-page link that goes through Lenis when it is active, native otherwise. */
export function AnchorLink({ href, magnetic, onClick, ...rest }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { motionOK, fine } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!magnetic || !motionOK || !fine || !el) return;
    const mx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const my = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    const clamp = (n: number) => Math.max(-12, Math.min(12, n));
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx(clamp((e.clientX - (r.left + r.width / 2)) * 0.25));
      my(clamp((e.clientY - (r.top + r.height / 2)) * 0.25));
    };
    const leave = () => {
      mx(0);
      my(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [magnetic, motionOK, fine]);

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (href === '#top') {
      e.preventDefault();
      const l = getLenis();
      if (l) l.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: motionOK ? 'smooth' : 'auto' });
      return;
    }
    if (getLenis()) {
      e.preventDefault();
      scrollToTarget(href);
    }
  };

  return <a ref={ref} href={href} onClick={handle} {...rest} />;
}
