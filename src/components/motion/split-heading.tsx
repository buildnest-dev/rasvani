'use client';

import { createElement, useEffect, useRef, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import { useUi } from '@/lib/ui-store';
import { useMotion } from './motion-provider';

interface Props {
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  className?: string;
  /** Hero headline: waits for the intro, then plays. */
  hero?: boolean;
  children: ReactNode;
}

/* Line-mask reveal (05-DESIGN §6.3). SplitText keeps accessible text; content is visible without JS/motion. */
function Inner({ as = 'h2', id, className, hero, children }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const { ready, motionOK } = useMotion();
  const introDone = useUi((s) => s.introDone);
  const played = useRef(false);

  useGSAP(
    () => {
      const el = ref.current;
      if (!ready || !el) return;
      if (!motionOK) {
        el.style.visibility = 'visible';
        return;
      }
      const split = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          const vars = { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 };
          if (hero) {
            const t = gsap.from(self.lines, { ...vars, paused: true });
            tween.current = t;
            if (useUi.getState().introDone) t.play();
            return t;
          }
          if (played.current) return undefined;
          return gsap.from(self.lines, {
            ...vars,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true, onEnter: () => (played.current = true) },
          });
        },
      });
      gsap.set(el, { visibility: 'visible' });
      return () => split.revert();
    },
    { scope: ref, dependencies: [ready, motionOK, hero] },
  );

  useEffect(() => {
    if (hero && introDone) tween.current?.play();
  }, [hero, introDone]);

  return createElement(as, { ref, id, className, 'data-split': '' }, children);
}

/* Remount on language change so React never fights SplitText's DOM. */
export function SplitHeading(props: Props) {
  const { lang } = useLocale();
  return <Inner key={lang} {...props} />;
}
