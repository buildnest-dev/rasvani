// Dependency-free Cloudflare Turnstile verification so it can be unit-tested without Next.js.
// Turnstile tokens are single-use and expire after ~5 minutes: the provider rejects reused and expired tokens.
export type CaptchaResult =
  | { ok: true }
  | { ok: false; reason: 'missing' | 'invalid' | 'expired' | 'unavailable'; message: string };

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const captchaMessages = {
  missing: 'Please tick "I am not a robot" first.',
  invalid: 'The security check failed. Please try again.',
  expired: 'The security check expired or was already used. Please tick it again.',
  unavailable: 'The security check is temporarily unavailable. Please try again in a minute.',
} as const;

const fail = (reason: keyof typeof captchaMessages): CaptchaResult => ({ ok: false, reason, message: captchaMessages[reason] });

export async function verifyTurnstile(options: { token?: string | null; secret?: string; ip?: string | null; fetchImpl?: typeof fetch }): Promise<CaptchaResult> {
  const { token, secret, ip, fetchImpl = fetch } = options;
  if (!secret) return { ok: true }; // Protection is switched off until the secret key is configured.
  if (!token || typeof token !== 'string' || token.length > 2048) return fail('missing');
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const response = await fetchImpl(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return fail('unavailable');
    const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (result.success === true) return { ok: true };
    const codes = result['error-codes'] ?? [];
    return codes.includes('timeout-or-duplicate') ? fail('expired') : fail('invalid');
  } catch { return fail('unavailable'); }
}
