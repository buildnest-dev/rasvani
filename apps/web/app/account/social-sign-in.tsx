'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Provider = 'google' | 'apple';

export function SocialSignIn({ next }: { next?: string }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Provider | null>(null);
  const appleEnabled = process.env.NEXT_PUBLIC_APPLE_SIGNIN === '1';

  async function start(provider: Provider) {
    setError(''); setBusy(provider);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (signInError) { setError('This sign-in option is not available yet. Please use email.'); setBusy(null); }
    } catch {
      setError('Sign-in is not available right now. Please try again shortly.'); setBusy(null);
    }
  }

  return <div className="social-signin">
    <button type="button" className="btn secondary social-btn" disabled={busy !== null} onClick={() => start('google')}>{busy === 'google' ? 'Opening Google…' : 'Continue with Google'}</button>
    {appleEnabled && <button type="button" className="btn secondary social-btn" disabled={busy !== null} onClick={() => start('apple')}>{busy === 'apple' ? 'Opening Apple…' : 'Continue with Apple (iPhone / iCloud)'}</button>}
    {error && <p className="notice" role="alert">{error}</p>}
    <p className="notice">Or use your email below. We verify your email with a link before you can order. Mobile-number verification will be added soon.</p>
  </div>;
}
