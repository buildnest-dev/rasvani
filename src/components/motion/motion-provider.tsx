'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/* Motion policy (05-DESIGN §6, 04-AI-RULES §5): OS setting + in-site toggle. Nothing animates until `ready`. */
interface MotionCtx {
  ready: boolean;
  motionOK: boolean;
  fine: boolean;
  reducedByChoice: boolean;
  osReduced: boolean;
  toggleReduce: () => void;
}

const Ctx = createContext<MotionCtx>({ ready: false, motionOK: false, fine: false, reducedByChoice: false, osReduced: false, toggleReduce: () => {} });

const COOKIE = /(?:^|; )ys-reduce=1/;

export function MotionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ ready: false, os: true, choice: false, fine: false });

  useEffect(() => {
    const osMq = matchMedia('(prefers-reduced-motion: no-preference)');
    const fineMq = matchMedia('(hover: hover) and (pointer: fine)');
    let choice = COOKIE.test(document.cookie);
    try {
      choice = choice || localStorage.getItem('ys-reduce') === '1';
    } catch {
      /* storage blocked */
    }
    const sync = () => setState({ ready: true, os: osMq.matches, choice, fine: fineMq.matches });
    sync();
    osMq.addEventListener('change', sync);
    fineMq.addEventListener('change', sync);
    return () => {
      osMq.removeEventListener('change', sync);
      fineMq.removeEventListener('change', sync);
    };
  }, []);

  const toggleReduce = useCallback(() => {
    const next = !COOKIE.test(document.cookie);
    document.cookie = `ys-reduce=${next ? 1 : 0};path=/;max-age=31536000;SameSite=Lax`;
    try {
      localStorage.setItem('ys-reduce', next ? '1' : '0');
    } catch {
      /* storage blocked */
    }
    location.reload();
  }, []);

  const value = useMemo<MotionCtx>(
    () => ({
      ready: state.ready,
      motionOK: state.ready && state.os && !state.choice,
      fine: state.fine,
      reducedByChoice: state.choice,
      osReduced: !state.os,
      toggleReduce,
    }),
    [state, toggleReduce],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMotion = () => useContext(Ctx);
