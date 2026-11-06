'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi } }

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
/** False until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; forms then skip the challenge. */
export const captchaConfigured = SITE_KEY.length > 0;
export type CaptchaHandle = { reset: () => void };
type State = 'loading' | 'ready' | 'verified' | 'expired' | 'failed' | 'unavailable';

let scriptPromise: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.defer = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')));
    script.onerror = () => { scriptPromise = null; script.remove(); reject(new Error('turnstile blocked')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const labels: Record<State, string> = {
  loading: 'Loading the security check…',
  ready: 'Please tick the box to confirm you are not a robot.',
  verified: 'Verified. Thank you.',
  expired: 'The check expired. Please tick it again.',
  failed: 'The security check failed.',
  unavailable: 'The security check could not load. Check your internet and try again.',
};

/** "I'm not a robot" challenge (Cloudflare Turnstile). The server must still verify the token it receives. */
export const CaptchaField = forwardRef<CaptchaHandle, { onToken: (token: string | null) => void }>(function CaptchaField({ onToken }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [state, setState] = useState<State>('loading');
  const notify = useRef(onToken);
  useEffect(() => { notify.current = onToken; }, [onToken]);

  const mount = useCallback(() => {
    if (!captchaConfigured || !host.current) return;
    setState('loading'); notify.current(null);
    loadTurnstile().then((api) => {
      if (!host.current) return;
      if (widget.current) { api.remove(widget.current); widget.current = null; }
      widget.current = api.render(host.current, {
        sitekey: SITE_KEY, theme: 'light', language: 'auto', appearance: 'always',
        callback: (token: string) => { setState('verified'); notify.current(token); },
        'expired-callback': () => { setState('expired'); notify.current(null); },
        'timeout-callback': () => { setState('expired'); notify.current(null); },
        'error-callback': () => { setState('failed'); notify.current(null); },
      });
      setState('ready');
    }).catch(() => { setState('unavailable'); notify.current(null); });
  }, []);

  useEffect(() => {
    mount();
    return () => { if (widget.current && window.turnstile) { window.turnstile.remove(widget.current); widget.current = null; } };
  }, [mount]);

  useImperativeHandle(ref, () => ({
    reset: () => { notify.current(null); if (widget.current && window.turnstile) { window.turnstile.reset(widget.current); setState('ready'); } else mount(); },
  }), [mount]);

  if (!captchaConfigured) return null;
  return <div className="captcha-field" role="group" aria-label="Security check: I am not a robot">
    <div ref={host} className="captcha-widget" />
    <p className={`captcha-state is-${state}`} role="status" aria-live="polite">{labels[state]}
      {(state === 'expired' || state === 'failed' || state === 'unavailable') && <> <button type="button" className="text-link" onClick={() => (state === 'unavailable' ? mount() : (widget.current && window.turnstile ? (window.turnstile.reset(widget.current), setState('ready')) : mount()))}>Try again</button></>}
    </p>
  </div>;
});
