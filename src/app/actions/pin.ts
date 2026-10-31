'use server';

import { checkServiceability, type Serviceability } from '@/modules/serviceability/service';

export async function checkPinAction(pin: string): Promise<Serviceability> {
  // TODO(rate-limit): PIN-check endpoint needs Upstash rate limiting (04-AI-RULES §3.7).
  return checkServiceability(String(pin).slice(0, 12));
}
