import type Lenis from 'lenis';

/* One smooth-scroll instance, owned by <SmoothScroll>. Everything else scrolls through scrollToTarget(). */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;

export function scrollToTarget(target: string | HTMLElement, smoothNative = true) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  const header = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72;
  if (instance) instance.scrollTo(el, { offset: -(header + 8) });
  else el.scrollIntoView({ behavior: smoothNative ? 'smooth' : 'auto', block: 'start' });
}
