'use client';

import type { ReactNode } from 'react';
import { goToNotify } from '@/lib/notify';

/* Small client island so server-rendered state pages can open the waitlist with fields prefilled. */
export function NotifyButton({ dish, state, className = 'btn btn--maroon', children }: { dish?: string; state?: string; className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} data-cursor="link" onClick={() => goToNotify({ dish, state })}>
      {children}
    </button>
  );
}
