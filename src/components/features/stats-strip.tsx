'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotion } from '@/components/motion/motion-provider';
import { STATES } from '@/modules/catalog/states';
import { FOODS } from '@/modules/catalog/foods';
import { REGIONS } from '@/modules/catalog/state-meta';

/* Every number here is counted from our own seed data, never a marketing figure (AGENTS §2.4). */
const TOTAL_FOODS = Object.values(FOODS).reduce((n, list) => n + list.length, 0);

const STATS: ReadonlyArray<{ n: number; suffix?: string; label: string }> = [
  { n: STATES.length, label: 'States in the Library' },
  { n: TOTAL_FOODS, label: 'Traditional foods in the seed list' },
  { n: REGIONS.length, label: 'Regions of India' },
  { n: 100, suffix: '%', label: 'Vegetarian, always' },
];

function Count({ to, suffix = '', run }: { to: number; suffix?: string; run: boolean }) {
  const { motionOK } = useMotion();
  const [n, setN] = useState(motionOK ? 0 : to);

  useEffect(() => {
    if (!motionOK) {
      setN(to);
      return;
    }
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1600);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, motionOK]);

  return (
    <>
      {n.toLocaleString('en-IN')}
      {suffix}
    </>
  );
}

export function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="stats" aria-label="The Library in numbers">
      <div ref={ref} className="container stats__grid">
        {STATS.map((s) => (
          <p key={s.label} className="stat">
            <strong>
              <Count to={s.n} suffix={s.suffix} run={seen} />
            </strong>
            <span>{s.label}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
