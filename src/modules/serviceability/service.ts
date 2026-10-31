import 'server-only';
import { pinSchema } from '@/modules/forms/schemas';

export type Serviceability =
  | { status: 'INVALID'; message: string }
  | { status: 'AVAILABLE' | 'AVAILABLE_LIMITED' | 'UNAVAILABLE' | 'UNKNOWN'; reason: string };

/* FR-SVC-03: fail closed. The engine (couriers, delivery classes, blackout dates) is not built yet,
   so every valid PIN is UNKNOWN. Never return AVAILABLE from a stub. */
export async function checkServiceability(pin: string): Promise<Serviceability> {
  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) {
    return { status: 'INVALID', message: parsed.error.issues[0]?.message ?? 'Enter a 6-digit PIN code.' };
  }
  return { status: 'UNKNOWN', reason: 'SERVICEABILITY_NOT_LIVE' };
}
