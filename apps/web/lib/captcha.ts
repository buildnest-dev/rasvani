import 'server-only';
import { headers } from 'next/headers';
import { verifyTurnstile, type CaptchaResult } from '@/lib/captcha-core';

/** True once TURNSTILE_SECRET_KEY is set in the server environment. */
export const captchaEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

/** Verifies a Turnstile token with the secret key. Call this first in every protected server action. */
export async function verifyCaptcha(token: string | null | undefined): Promise<CaptchaResult> {
  let ip: string | null = null;
  try { ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? null; } catch { /* no request context */ }
  const result = await verifyTurnstile({ token, secret: process.env.TURNSTILE_SECRET_KEY, ip });
  if (!result.ok) console.warn('captcha rejected:', result.reason);
  return result;
}
