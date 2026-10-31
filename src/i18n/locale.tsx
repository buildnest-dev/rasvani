'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import en from './messages/en.json';
import hi from './messages/hi.json';

export type Lang = 'en' | 'hi';
export type MessageKey = keyof typeof en;

/* TODO(translate): Hindi strings need human review (04-AI-RULES §9). */
const CATALOGUES: Record<Lang, Record<MessageKey, string>> = { en, hi };

interface LocaleCtx {
  lang: Lang;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
  setLang: (lang: Lang) => void;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = useCallback((next: Lang) => {
    document.cookie = `ys-lang=${next};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = next;
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string>) => {
      let msg = CATALOGUES[lang][key] ?? CATALOGUES.en[key];
      if (vars) for (const [k, v] of Object.entries(vars)) msg = msg.replace(`{${k}}`, v);
      return msg;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}
