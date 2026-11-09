'use client';

import { useSyncExternalStore } from 'react';

const none = () => () => undefined;
/** On admin.<domain> the console lives at "/" (clean URLs: /orders, /products…). On the main domain it is under /admin. */
export function useAdminBase(): { base: string; shopUrl: string } {
  const onAdminHost = useSyncExternalStore(none, () => window.location.hostname.toLowerCase().startsWith('admin.'), () => false);
  if (!onAdminHost) return { base: '/admin', shopUrl: '/shop' };
  const host = window.location.hostname.toLowerCase().replace(/^admin\./, '');
  return { base: '', shopUrl: `https://www.${host.replace(/^www\./, '')}/shop` };
}
