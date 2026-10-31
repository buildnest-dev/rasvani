'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { joinWaitlistAction } from '@/app/actions/forms';
import { useLocale } from '@/i18n/locale';
import { useUi } from '@/lib/ui-store';
import { SplitHeading } from '@/components/motion/split-heading';
import { waitlistSchema, type WaitlistInput } from '@/modules/forms/schemas';
import { STATES_ALPHA } from '@/modules/catalog/states';

const digits = (e: { target: { value: string } }) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
};

function NotifyForm() {
  const { t } = useLocale();
  const pin = useUi((s) => s.pin);
  const prefill = useUi((s) => s.prefill);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { dish: '', state: '', pin: '', contact: '', consent: false },
  });

  useEffect(() => {
    if (pin && !getValues('pin')) setValue('pin', pin);
  }, [pin, getValues, setValue]);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.dish) setValue('dish', prefill.dish);
    if (prefill.state) setValue('state', prefill.state);
    if (prefill.pin) setValue('pin', prefill.pin);
    const id = window.setTimeout(() => setFocus('dish', { shouldSelect: false }), 900);
    return () => window.clearTimeout(id);
  }, [prefill, setValue, setFocus]);

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      const r = await joinWaitlistAction(values);
      if (r.ok) {
        setStatus({ ok: true, msg: `You’re on the list. We’ll message you when ${values.dish} can reach ${values.pin}.` });
        reset({ dish: '', state: '', pin: values.pin, contact: '', consent: false });
      } else {
        setStatus({ ok: false, msg: r.message });
      }
    } catch {
      setStatus({ ok: false, msg: 'We couldn’t send that. Check your connection and try again. Your answers are still here.' });
    }
  });

  return (
    <form className="card-form card-form--cream" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="nDish">{t('notify.dish')}</label>
        <input className="field__input" id="nDish" type="text" placeholder="e.g. Pharra, Thekua, Litti Chokha" aria-invalid={!!errors.dish} aria-describedby="nDishE" {...register('dish')} />
        <p className="field__err" id="nDishE">{errors.dish?.message}</p>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="nState">{t('notify.state')}</label>
          <select className="field__input" id="nState" {...register('state')}>
            <option value="">Not sure, any state</option>
            {STATES_ALPHA.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="nPin">{t('notify.pin')}</label>
          <input className="field__input" id="nPin" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} aria-invalid={!!errors.pin} aria-describedby="nPinE" {...register('pin', { onChange: digits })} />
          <p className="field__err" id="nPinE">{errors.pin?.message}</p>
        </div>
      </div>
      <div className="field">
        <label htmlFor="nContact">{t('notify.contact')}</label>
        <input className="field__input" id="nContact" type="text" inputMode="email" autoComplete="tel" aria-invalid={!!errors.contact} aria-describedby="nContactE" {...register('contact')} />
        <p className="field__err" id="nContactE">{errors.contact?.message}</p>
      </div>
      <label className="check">
        <input type="checkbox" aria-describedby="nConsentE" {...register('consent')} />
        <span>I agree to be contacted about this request. Details are used for this purpose only.</span>
      </label>
      <p className="field__err" id="nConsentE">{errors.consent?.message}</p>
      <button className="btn btn--maroon btn--block" type="submit" disabled={isSubmitting}>
        {t('notify.btn')}
      </button>
      <p className={status?.ok ? 'form__status is-ok' : 'form__status'} role="status" aria-live="polite">
        {status?.msg}
      </p>
      <p className="demo-note">Preview build: answers are checked on the server but not stored or sent anywhere yet.</p>
    </form>
  );
}

export function Notify() {
  const { t } = useLocale();
  return (
    <section className="notify" id="notify" aria-labelledby="notifyTitle">
      <div className="container notify__grid">
        <div className="notify__copy">
          <SplitHeading id="notifyTitle" className="h2">
            {t('notify.title')}
          </SplitHeading>
          <p className="lede">{t('notify.lede')}</p>
        </div>
        <NotifyForm />
      </div>
    </section>
  );
}
