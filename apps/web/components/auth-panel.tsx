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

  return <div className="auth-panel form-shell">
    <h2>{audience === 'admin' ? 'Rasvani admin sign-in' : audience === 'baker' ? 'Baker and restaurant sign-in' : mode === 'signup' ? 'Create your account' : 'Sign in to order'}</h2>
    {audience !== 'customer' && <p className="notice">Only registered {audience === 'admin' ? 'admin' : 'baker'} accounts can use this area.</p>}
    <CaptchaField ref={captchaRef} onToken={onToken} />
    {captchaConfigured && checking && <p className="notice" role="status">Checking…</p>}
    <button type="button" className="btn secondary social-btn" disabled={!allowed} onClick={() => social('google')}>Continue with Google</button>
    {appleEnabled && <button type="button" className="btn secondary social-btn" disabled={!allowed} onClick={() => social('apple')}>Continue with Apple (iPhone / iCloud)</button>}
    <p className="notice auth-or">or use your email</p>
    <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <div className="hp-field" aria-hidden="true"><label htmlFor="au-company">Leave this empty</label><input id="au-company" ref={honeypot} tabIndex={-1} autoComplete="off" /></div>
      {mode === 'signup' && <><label htmlFor="au-name">Your name</label><input id="au-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name" /></>}
      <label htmlFor="au-email">Email address</label>
      <input id="au-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" />
      <label htmlFor="au-pass">Password</label>
      <input id="au-pass" type="password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
      <button className="btn" type="submit" disabled={!allowed}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
    </form>
    {error && <p className="status" role="alert">{error}</p>}
    {message && <p className="status" role="status">{message}</p>}
    <p className="notice">
      {canSignUp && <button type="button" className="text-link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>}
      {' '}<button type="button" className="text-link" disabled={!allowed} onClick={reset}>Forgot password?</button>
    </p>
    <p className="notice">Mobile-number verification will be added soon.</p>
  </div>;
}
