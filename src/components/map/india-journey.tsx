'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import { useUi } from '@/lib/ui-store';
import { SplitHeading } from '@/components/motion/split-heading';
import { useMotion } from '@/components/motion/motion-provider';
import { INDIA_SHAPES, MAP_H, MAP_W } from '@/modules/catalog/india-shapes';
import { ROUTE, ROUTE_DISHES, STATES, STATES_ALPHA, STATE_BY_CODE, foodCount } from '@/modules/catalog/states';
import { cn } from '@/lib/cn';

const STEPS = ROUTE.length - 1;

/* FR-DISC-01: tile map + route scene. Pinned and scrubbed on desktop, simple static scene elsewhere.
   Every state is a real button, with an alphabetical list below as the non-visual alternative. */
export function IndiaJourney() {
  const { t } = useLocale();
  const { ready, motionOK } = useMotion();
  const openPanel = useUi((s) => s.openPanel);
  const panelCode = useUi((s) => s.panelCode);

  const section = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const dot = useRef<SVGGElement>(null);
  const tiles = useRef<Record<string, SVGPathElement | null>>({});
  const cum = useRef<number[]>([0, 1]);

  const [pinned, setPinned] = useState(false);
  const [step, setStep] = useState({ cur: 0, lit: 0, done: false });

  const layoutRoute = useCallback(() => {
    const w = wrap.current;
    const p = path.current;
    const s = svg.current;
    if (!w || !p || !s) return;
    const wr = w.getBoundingClientRect();
    if (!wr.width) return;
    const pts = ROUTE.map((c) => {
      const r = tiles.current[c]?.getBoundingClientRect();
      return r ? ([r.left - wr.left + r.width / 2, r.top - wr.top + r.height / 2] as const) : ([0, 0] as const);
    });
    s.setAttribute('viewBox', `0 0 ${wr.width} ${wr.height}`);
    p.setAttribute('d', 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L'));
    const seg = [0];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      seg.push(seg[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    const total = seg[seg.length - 1] || 1;
    cum.current = seg.map((v) => v / total);
  }, []);

  const applyT = useCallback((raw: number) => {
    const t = Math.max(0, Math.min(STEPS, raw));
    const i = Math.floor(t + 1e-6);
    const f = t - i;
    const c = cum.current;
    const frac = i >= STEPS ? 1 : c[i]! + (c[i + 1]! - c[i]!) * f;
    const p = path.current;
    if (p) {
      p.style.strokeDashoffset = String(1 - frac);
      const pt = p.getPointAtLength(p.getTotalLength() * frac);
      dot.current?.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    }
    const cur = Math.round(t);
    const done = t >= STEPS - 1e-3;
    setStep((p) => (p.cur === cur && p.lit === i && p.done === done ? p : { cur, lit: i, done }));
  }, []);

  useEffect(() => {
    layoutRoute();
    const w = wrap.current;
    if (!w) return;
    const ro = new ResizeObserver(layoutRoute);
    ro.observe(w);
    return () => ro.disconnect();
  }, [layoutRoute]);

  useGSAP(
    () => {
      const el = section.current;
      if (!ready || !motionOK || !el) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        el.classList.add('journey--pinned');
        setPinned(true);
        layoutRoute();
        applyT(0);
        ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: () => '+=' + STEPS * 560,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: layoutRoute,
          onUpdate: (self) => applyT(self.progress * STEPS),
        });
        return () => {
          el.classList.remove('journey--pinned');
          setPinned(false);
          layoutRoute();
          if (path.current) path.current.style.strokeDashoffset = '0';
        };
      });
    },
    { scope: section, dependencies: [ready, motionOK] },
  );

  /* States ripple in from the centre once the map scrolls into view. */
  useGSAP(
    () => {
      if (!ready || !motionOK) return;
      gsap.from('.shape', {
        opacity: 0,
        scale: 0.7,
        duration: 0.8,
        ease: 'back.out(1.6)',
        stagger: { amount: 1, from: 'center' },
        clearProps: 'opacity,scale',
        scrollTrigger: { trigger: wrap.current, start: 'top 85%', once: true },
      });
    },
    { scope: section, dependencies: [ready, motionOK] },
  );

  /* Each state the route reaches pops like a stamp. */
  useEffect(() => {
    if (!pinned || !motionOK) return;
    const el = tiles.current[ROUTE[step.lit] ?? ''];
    if (el) gsap.fromTo(el, { '--pop': 1.5 }, { '--pop': 1, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
  }, [step.lit, pinned, motionOK]);

  const titleLines = t('journey.title').split('\n');
  const hint = !pinned ? t('journey.hintStatic') : step.done ? t('journey.hintDone') : t('journey.hint');

  return (
    <section ref={section} className="journey" id="journey" aria-labelledby="journeyTitle">
      <div className="journey__inner container">
        <div className="journey__copy">
          <SplitHeading id="journeyTitle" className="h2">
            {titleLines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </SplitHeading>
          <p className="lede">{t('journey.lede')}</p>

          <p className="journey__counter" aria-live="polite">
            <strong>{pinned ? step.lit + 1 : ROUTE.length}</strong> <span>{t('journey.counter')}</span>
          </p>

          <div className="journey__cards">
            {ROUTE.map((code, k) => {
              const d = ROUTE_DISHES[code];
              if (!d) return null;
              return (
                <article key={code} className={cn('jcard', (!pinned || step.cur === k) && 'is-active')}>
                  <p className="jcard__script" lang="und">{d.script}</p>
                  <h3 className="jcard__name">
                    {d.name}
                    <span>{STATE_BY_CODE[code]?.name}</span>
                  </h3>
                  <p className="jcard__desc">{d.desc}</p>
                </article>
              );
            })}
          </div>
          <p className="journey__hint">{hint}</p>
          <a className="skip-inline" href="#stateList">
            Skip map, jump to the state list
          </a>
        </div>

        <div className="journey__map">
          <div ref={wrap} className="mapwrap">
            <svg className="indiamap" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="group" aria-label="Map of India. Select a state to see its foods.">
              {INDIA_SHAPES.map((sh) => {
                const st = sh.code ? STATE_BY_CODE[sh.code] : undefined;
                if (!st) return <path key={sh.name} d={sh.d} className="shape shape--ut" />;
                const idx = ROUTE.indexOf(st.code);
                const lit = idx >= 0 && (!pinned || idx <= step.lit);
                return (
                  <path
                    key={st.code}
                    ref={(el) => {
                      tiles.current[st.code] = el;
                    }}
                    d={sh.d}
                    role="button"
                    tabIndex={0}
                    className={cn('shape', lit && 'is-lit', pinned && idx >= 0 && idx === step.cur && 'is-current', panelCode === st.code && 'is-open')}
                    data-cursor="state"
                    data-cursor-label={st.name}
                    aria-label={`${st.name}, ${foodCount(st.code)} traditional foods in the Library`}
                    onClick={(e) => openPanel(st.code, e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openPanel(st.code, e.currentTarget);
                      }
                    }}
                  />
                );
              })}
            </svg>
            <svg ref={svg} className={cn('route', pinned && 'is-live')} aria-hidden="true">
              <path ref={path} pathLength={1} />
              <g ref={dot} className="route__dot">
                <circle className="route__halo" r="16" />
                <circle r="6.5" />
              </g>
            </svg>
          </div>
          <p className="map__caption">Boundaries from a public dataset, not yet verified against Survey of India. Union territories are shown but not selectable.</p>
          <ul id="stateList" className="statelist" aria-label="All states, alphabetical">
            {STATES_ALPHA.map((s) => (
              <li key={s.code}>
                <button type="button" onClick={(e) => openPanel(s.code, e.currentTarget)}>
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
