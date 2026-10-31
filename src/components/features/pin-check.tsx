'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { checkPinAction } from '@/app/actions/pin';
import { gsap } from '@/lib/gsap';
import { useLocale } from '@/i18n/locale';
import { useUi } from '@/lib/ui-store';
import { goToNotify } from '@/lib/notify';
import { useMotion } from '@/components/motion/motion-provider';
import type { Serviceability } from '@/modules/serviceability/service';
import { cn } from '@/lib/cn';

interface Props {
  variant: 'hero' | 'dialog';
  inputId: string;
  onNotify?: () => void;
}

/* FR-PDP-05 / FR-SVC-03 teaser. The server action fails closed: until the engine exists the answer is never "available". */
export function PinCheck({ variant, inputId, onNotify }: Props) {
  const { t } = useLocale();
  const { motionOK } = useMotion();
  const savedPin = useUi((s) => s.pin);
  const setPin = useUi((s) => s.setPin);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<(Serviceability & { pin: string }) | null>(null);
  const [pending, start] = useTransition();
  const chip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (savedPin) setValue((v) => v || savedPin);
  }, [savedPin]);

  useEffect(() => {
    if (result && result.status !== 'INVALID' && motionOK && chip.current) {
      gsap.fromTo(chip.current, { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.4)' });
    }
  }, [result, motionOK]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const pin = value.trim();
    start(async () => {
      const r = await checkPinAction(pin);
      setResult({ ...r, pin });
      if (r.status !== 'INVALID') setPin(pin);
    });
  };

  const invalid = result?.status === 'INVALID';
  return (
    <form className={cn('pincheck', variant === 'hero' && 'hero__pin hero-rv')} onSubmit={submit} noValidate>
      <label className="pincheck__label" htmlFor={inputId}>
        {t('pin.label')}
      </label>
      <div className="pincheck__row">
        <input
          id={inputId}
          className="field__input"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="e.g. 800001"
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={`${inputId}-msg`}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button className={cn('btn', variant === 'hero' ? 'btn--gold' : 'btn--maroon')} type="submit" disabled={pending}>
          {t('pin.check')}
        </button>
      </div>
      <div className="pincheck__result" id={`${inputId}-msg`} role="status" aria-live="polite">
        {result && (
          <div ref={chip} className={cn('pin-chip-result', invalid && 'pin-chip-result--err')}>
            {result.status === 'INVALID' ? (
              <div>
                <strong>Enter a 6-digit PIN code.</strong> It should not start with 0, for example 800001.
              </div>
            ) : (
              <div>
                <strong>We can’t confirm delivery to {result.pin} yet.</strong>
                Delivery checks switch on with our pilot.{' '}
                <button
                  type="button"
                  onClick={() => {
                    onNotify?.();
                    goToNotify({ pin: result.pin });
                  }}
                >
                  Tell us what you’d like to order
                </button>{' '}
                and we’ll message you the day it reaches {result.pin}.
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
