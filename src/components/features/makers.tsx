'use client';

import { useState } from 'react';
import Image from 'next/image';
import maker from '@/assets/maker.jpg';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applyAsMakerAction } from '@/app/actions/forms';
import { useLocale } from '@/i18n/locale';
import { SplitHeading } from '@/components/motion/split-heading';
import { makerSchema, type MakerInput } from '@/modules/forms/schemas';
import { STATES_ALPHA } from '@/modules/catalog/states';

const CHECKS = [
  'A valid FSSAI licence or registration',
  'A sample we taste before anything is listed',
  'Packaging that survives a courier journey',
  'A confirmed meat-, fish- and egg-free recipe',
] as const;

function MakerForm() {
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MakerInput>({
    resolver: zodResolver(makerSchema),
    defaultValues: { name: '', contact: '', state: '', what: '', consent: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      const r = await applyAsMakerAction(values);
      if (r.ok) {
        setStatus({ ok: true, msg: 'Application received. We’ll reach out on the number or email you gave.' });
        reset();
      } else setStatus({ ok: false, msg: r.message });
    } catch {
      setStatus({ ok: false, msg: 'We couldn’t send that. Check your connection and try again. Your answers are still here.' });
    }
  });

  return (
    <form className="card-form" onSubmit={onSubmit} noValidate>
      <h3 className="card-form__title">Apply as a maker</h3>
      <p className="card-form__sub">Tell us the basics. We’ll reach out for documents and a sample.</p>
      <div className="field">
        <label htmlFor="mName">Your name</label>
        <input className="field__input" id="mName" type="text" autoComplete="name" aria-invalid={!!errors.name} aria-describedby="mNameE" {...register('name')} />
        <p className="field__err" id="mNameE">{errors.name?.message}</p>
      </div>
      <div className="field">
        <label htmlFor="mContact">Mobile number or email</label>
        <input className="field__input" id="mContact" type="text" inputMode="email" autoComplete="tel" aria-invalid={!!errors.contact} aria-describedby="mContactE" {...register('contact')} />
        <p className="field__err" id="mContactE">{errors.contact?.message}</p>
      </div>
      <div className="field">
        <label htmlFor="mState">State you make in</label>
        <select className="field__input" id="mState" aria-invalid={!!errors.state} aria-describedby="mStateE" {...register('state')}>
          <option value="">Select a state</option>
          {STATES_ALPHA.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <p className="field__err" id="mStateE">{errors.state?.message}</p>
      </div>
      <div className="field">
        <label htmlFor="mMake">What do you make?</label>
        <input className="field__input" id="mMake" type="text" placeholder="e.g. Thekua, pickles, dry sweets" aria-invalid={!!errors.what} aria-describedby="mMakeE" {...register('what')} />
        <p className="field__err" id="mMakeE">{errors.what?.message}</p>
      </div>
      <label className="check">
        <input type="checkbox" aria-describedby="mConsentE" {...register('consent')} />
        <span>I agree to be contacted about this application. Details are used for this purpose only.</span>
      </label>
      <p className="field__err" id="mConsentE">{errors.consent?.message}</p>
      <button className="btn btn--maroon btn--block" type="submit" disabled={isSubmitting}>
        Apply as a maker
      </button>
      <p className={status?.ok ? 'form__status is-ok' : 'form__status'} role="status" aria-live="polite">
        {status?.msg}
      </p>
      <p className="demo-note">Preview build: answers are checked on the server but not stored or sent anywhere yet.</p>
    </form>
  );
}

export function Makers() {
  const { t } = useLocale();
  return (
    <section className="makers" id="makers" aria-labelledby="makersTitle">
      <div className="container makers__grid">
        <div className="makers__copy">
          <figure className="makers__photo grain arch-soft">
            <Image src={maker} alt="Illustration of a sweet maker frying khaja in an iron kadhai" sizes="(min-width: 1024px) 48vw, 92vw" />
            <figcaption>Illustrative image</figcaption>
          </figure>
          <SplitHeading id="makersTitle" className="h2">
            {t('makers.title')}
          </SplitHeading>
          <p className="lede">{t('makers.lede')}</p>
          <ul className="makers__kinds">
            <li>
              <strong>Home cooks</strong>
              <span>Family recipes, cooked in small batches.</span>
            </li>
            <li>
              <strong>Local sweet makers</strong>
              <span>Halwais who still make it by hand.</span>
            </li>
            <li>
              <strong>Regional kitchens</strong>
              <span>Small businesses rooted in their towns.</span>
            </li>
          </ul>
          <ul className="checks">
            {CHECKS.map((c) => (
              <li key={c}>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <MakerForm />
      </div>
    </section>
  );
}
