'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useUi } from '@/lib/ui-store';
import { goToNotify } from '@/lib/notify';
import { STATE_BY_CODE } from '@/modules/catalog/states';
import { foodCount, foodsFor } from '@/modules/catalog/foods';

/* Desktop: card at the bottom right. Mobile: bottom sheet (CSS). Escape closes; focus returns to the trigger. */
export function StatePanel() {
  const code = useUi((s) => s.panelCode);
  const close = useUi((s) => s.closePanel);
  const returnFocus = useUi((s) => s.returnFocus);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (!code) return;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [code, close]);

  useEffect(() => {
    if (prev.current && !code && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    prev.current = code;
  }, [code, returnFocus]);

  const state = code ? STATE_BY_CODE[code] : undefined;
  const dishes = code ? foodsFor(code) : [];

  return (
    <AnimatePresence mode="wait">
      {state && code && (
        <motion.aside
          key={code}
          className="state-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="spName"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <button ref={closeBtn} type="button" className="state-panel__close" aria-label="Close state details" onClick={close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {state.native && (
            <p className="state-panel__native" lang="und">
              {state.native}
            </p>
          )}
          <h3 className="state-panel__name" id="spName">
            {state.name}
          </h3>
          <p className="state-panel__count">{foodCount(code)} traditional vegetarian foods in the Library</p>
          <motion.ol
            className="state-panel__foods"
            initial="hide"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } }}
          >
            {dishes.map((d, i) => (
              <motion.li
                key={d.name}
                className="food"
                variants={{ hide: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <span className="food__n" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="food__body">
                  <span className="food__name">{d.name}</span>
                  <span className="food__desc">{d.desc}</span>
                  {d.confirm && <span className="food__tag">Veg recipe being confirmed</span>}
                </span>
              </motion.li>
            ))}
          </motion.ol>
          <p className="state-panel__note">
            Representative foods traditionally associated with {state.name}, not exclusive to it. Recipes vary by district and community.
          </p>
          <Link href={`/states/${state.slug}`} className="state-panel__more" onClick={close}>
            See the full {state.name} page →
          </Link>
          <button
            type="button"
            className="btn btn--gold"
            onClick={() => {
              close();
              goToNotify({ state: code });
            }}
          >
            Tell me when {state.name} foods are available
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
