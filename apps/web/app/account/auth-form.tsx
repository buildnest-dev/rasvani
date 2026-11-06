'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import { useActionState } from 'react';
import { signInAction, signUpAction, type AuthActionState } from './actions';

const initialState: AuthActionState = {};

export function AuthForm() {
  const [signInState, signIn, signInPending] = useActionState(signInAction, initialState);
  const [signUpState, signUp, signUpPending] = useActionState(signUpAction, initialState);

  return <LocalizedCopy><div className="cards" style={{ marginTop: 22 }}>
    <form className="form-shell" action={signIn}>
      <h2>Sign in</h2>
      <label htmlFor="signin-email">Email address</label>
      <input id="signin-email" name="email" type="email" autoComplete="email" required maxLength={254} />
      <label htmlFor="signin-password">Password</label>
      <input id="signin-password" name="password" type="password" autoComplete="current-password" required minLength={10} maxLength={128} />
      <button className="btn" type="submit" disabled={signInPending}>{signInPending ? 'Signing in…' : 'Sign in'}</button>
      {signInState.error && <p className="notice" role="alert">{signInState.error}</p>}
    </form>
    <form className="form-shell" action={signUp}>
      <h2>Create an account</h2>
      <label htmlFor="signup-email">Email address</label>
      <input id="signup-email" name="email" type="email" autoComplete="email" required maxLength={254} />
      <label htmlFor="signup-password">Create password</label>
      <input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} aria-describedby="password-help" />
      <p id="password-help" className="notice">Use at least 10 characters. Your account may require email verification.</p>
      <button className="btn secondary" type="submit" disabled={signUpPending}>{signUpPending ? 'Creating…' : 'Create account'}</button>
      {signUpState.error && <p className="notice" role="alert">{signUpState.error}</p>}
      {signUpState.success && <p className="status" role="status">{signUpState.success}</p>}
    </form>
  </div></LocalizedCopy>;
}
