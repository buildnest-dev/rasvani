'use server';

import { makerSchema, waitlistSchema } from '@/modules/forms/schemas';

export type FormResult = { ok: true } | { ok: false; message: string };

/* Both actions validate on the server and stop there. TODO(db): persist to waitlist_requests / seller
   applications, add rate limiting, and send the confirmation. Until then the page shows a "preview build" note. */
export async function joinWaitlistAction(input: unknown): Promise<FormResult> {
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check your answers and try again.' };
  return { ok: true };
}

export async function applyAsMakerAction(input: unknown): Promise<FormResult> {
  const parsed = makerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check your answers and try again.' };
  return { ok: true };
}
