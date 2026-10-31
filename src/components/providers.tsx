'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MotionConfig } from 'motion/react';
import { LocaleProvider, type Lang } from '@/i18n/locale';
import { registerNavigate } from '@/lib/notify';
import { MotionProvider, useMotion } from '@/components/motion/motion-provider';

/* Keeps Motion (springs, presence) in step with the OS setting and the in-site toggle. */
function MotionBridge({ children }: { children: ReactNode }) {
  const { motionOK } = useMotion();
  return <MotionConfig reducedMotion={motionOK ? 'user' : 'always'}>{children}</MotionConfig>;
}

function NavigateBridge() {
  const router = useRouter();
  useEffect(() => {
    registerNavigate((href) => router.push(href));
    return () => registerNavigate(null);
  }, [router]);
  return null;
}

export function Providers({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <LocaleProvider initial={lang}>
      <MotionProvider>
        <MotionBridge>
          <NavigateBridge />
          {children}
        </MotionBridge>
      </MotionProvider>
    </LocaleProvider>
  );
}
