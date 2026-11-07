'use client';

import { useRef, useState } from 'react';
import { CaptchaField, captchaConfigured, type CaptchaHandle } from '@/components/captcha-field';
import { verifyCaptchaAction } from '@/app/actions/session';
import {
  GoogleAuthProvider, OAuthProvider, createUserWithEmailAndPassword, sendEmailVerification,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updateProfile,
} from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/client';

const friendly = (code: string) => {
  if (/popup-closed|cancelled-popup/.test(code)) return 'Sign-in was closed before finishing.';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return 'Email or password is not correct.';
  if (/email-already-in-use/.test(code)) return 'An account with this email already exists. Please sign in.';
  if (/weak-password/.test(code)) return 'Choose a stronger password (at least 8 characters).';
  if (/too-many-requests/.test(code)) return 'Too many attempts. Please wait a few minutes and try again.';
  if (/operation-not-allowed|configuration/.test(code)) return 'This sign-in option is not switched on yet.';
  if (/unauthorized-domain/.test(code)) return 'This website address is not allowed yet in Firebase (Authentication > Settings > Authorized domains).';
  if (/api-key-not-valid|invalid-api-key/.test(code)) return 'The Firebase API key on this site is wrong or missing.';
  if (/popup-blocked/.test(code)) return 'Your browser blocked the Google window. Allow pop-ups for this site and try again.';
  if (/network-request-failed/.test(code)) return 'Network problem. Check your internet and try again.';
  return `Sign-in did not work (${code || 'unknown error'}). Please try again.`;
};

export function AuthPanel({ audience = 'customer' }: { audience?: 'customer' | 'admin' | 'baker' }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const appleEnabled = process.env.NEXT_PUBLIC_APPLE_SIGNIN === '1';
  const canSignUp = audience === 'customer';
  const [verified, setVerified] = useState(!captchaConfigured);
  const [checking, setChecking] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const allowed = verified && !busy;

  // The token is verified by the server as soon as it is solved, so the Google/Apple pop-up can still open
  // straight from the click (browsers block pop-ups that wait on a network call).
  function onToken(token: string | null) {
    if (!captchaConfigured) return;
    if (!token) { setVerified(false); return; }
    setChecking(true);
    verifyCaptchaAction(token).then((result) => {
      setVerified(result.ok);
      if (!result.ok) { setError(result.error ?? 'The security check failed. Please try again.'); captchaRef.current?.reset(); }
    }).catch(() => { setVerified(false); setError('The security check could not be completed. Please try again.'); captchaRef.current?.reset(); })
      .finally(() => setChecking(false));
  }

  async function run(task: () => Promise<void>) {
    if (honeypot.current?.value) return; // a bot filled the hidden field
    if (!verified) { setError('Please tick "I am not a robot" first.'); return; }
    setError(''); setMessage(''); setBusy(true);
    try { await task(); } catch (caught) { setError(friendly(String((caught as { code?: string }).code ?? ''))); }
    setBusy(false);
    // Each security check is single-use: ask for a fresh one after every attempt.
    if (captchaConfigured) { setVerified(false); captchaRef.current?.reset(); }
  }
  const social = (provider: 'google' | 'apple') => run(async () => {
    const auth = firebaseAuth();
    if (provider === 'google') await signInWithPopup(auth, new GoogleAuthProvider());
    else { const apple = new OAuthProvider('apple.com'); apple.addScope('email'); apple.addScope('name'); await signInWithPopup(auth, apple); }
  });
  const submit = () => run(async () => {
    const auth = firebaseAuth();
    if (mode === 'signup') {
      const created = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) await updateProfile(created.user, { displayName: name.trim().slice(0, 80) });
      await sendEmailVerification(created.user);
      setMessage('Account created. We sent a verification link to your email. Open it, then come back and press I have verified.');
    } else await signInWithEmailAndPassword(auth, email.trim(), password);
  });
  const reset = () => run(async () => {
    if (!email.trim()) { setError('Type your email first.'); return; }
    await sendPasswordResetEmail(firebaseAuth(), email.trim());
    setMessage('If that email has an account, a reset link is on its way.');
  });

  const [showPass, setShowPass] = useState(false);
  const title = audience === 'admin' ? 'Admin sign-in' : audience === 'baker' ? 'Baker & restaurant sign-in' : mode === 'signup' ? 'Create your account' : 'Welcome back';
  const strength = Math.min(4, (password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(password) && /[a-z]/.test(password) ? 1 : 0) + (/\d/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0));

  return <div className="au-card">
    <div className="au-head">
      <h2>{title}</h2>
      <p>{audience !== 'customer' ? `Only registered ${audience === 'admin' ? 'admin' : 'baker'} accounts can use this area.` : mode === 'signup' ? 'Order Bihar’s home-made foods and track every order.' : 'Sign in to order and track your food.'}</p>
    </div>
    {canSignUp && <div className="au-tabs" role="tablist" aria-label="Sign in or create account">
      <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-on' : ''} onClick={() => { setMode('signin'); setError(''); setMessage(''); }}>Sign in</button>
      <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-on' : ''} onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>Create account</button>
    </div>}
    <button type="button" className="au-social" disabled={!allowed} onClick={() => social('google')}>
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" /><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
      Continue with Google
    </button>
    {appleEnabled && <button type="button" className="au-social" disabled={!allowed} onClick={() => social('apple')}>Continue with Apple</button>}
    <div className="au-or"><span>or use your email</span></div>
    <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="au-form">
      <div className="hp-field" aria-hidden="true"><label htmlFor="au-company">Leave this empty</label><input id="au-company" ref={honeypot} tabIndex={-1} autoComplete="off" /></div>
      {mode === 'signup' && <div className="au-field"><label htmlFor="au-name">Your name</label><input id="au-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name" placeholder="Full name" /></div>}
      <div className="au-field"><label htmlFor="au-email">Email address</label><input id="au-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder="you@example.com" /></div>
      <div className="au-field"><label htmlFor="au-pass">Password</label>
        <div className="au-pass"><input id="au-pass" type={showPass ? 'text' : 'password'} required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" />
          <button type="button" className="au-eye" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}>{showPass ? 'Hide' : 'Show'}</button></div>
        {mode === 'signup' && password.length > 0 && <div className="au-meter" aria-hidden="true"><i className={strength >= 1 ? 'on' : ''} /><i className={strength >= 2 ? 'on' : ''} /><i className={strength >= 3 ? 'on' : ''} /><i className={strength >= 4 ? 'on' : ''} /></div>}
      </div>
      <CaptchaField ref={captchaRef} onToken={onToken} />
      {captchaConfigured && checking && <p className="au-note" role="status">Checking…</p>}
      <button className="au-submit" type="submit" disabled={!allowed}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
    </form>
    {error && <p className="au-msg au-err" role="alert">{error}</p>}
    {message && <p className="au-msg au-ok" role="status">{message}</p>}
    <p className="au-foot"><button type="button" className="au-link" disabled={!allowed} onClick={reset}>Forgot password?</button></p>
  </div>;
}
