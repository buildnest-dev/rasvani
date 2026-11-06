'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const reviewerRoles = ['quality_reviewer', 'admin', 'super_admin'] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;
function field(form: FormData, key: string) { return String(form.get(key) ?? '').trim(); }
function validDate(input: string): string | null | undefined {
  if (!input) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return undefined;
  const d = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== input ? undefined : input;
}

export async function reviewProducerFacility(form: FormData) {
  await requireAnyRole(reviewerRoles);
  const id = field(form, 'facility_id');
  const decision = field(form, 'decision');
  const reason = field(form, 'reason');
  const from = validDate(field(form, 'approved_from'));
  const until = validDate(field(form, 'approved_until'));
  if (!uuid.test(id) || !['approved','rejected'].includes(decision) || reason.length < 3 || reason.length > 1000 || from === undefined || until === undefined || (from && until && until < from) || (decision === 'rejected' && (from || until))) {
    redirect('/facility-review?error=invalid-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('review_producer_facility', {
    p_facility_id: id, p_decision: decision, p_reason: reason,
    p_approved_from: decision === 'approved' ? from : null,
    p_approved_until: decision === 'approved' ? until : null,
  });
  if (error) redirect('/facility-review?error=review-failed');
  revalidatePath('/facility-review'); revalidatePath('/producer-portal/facilities'); revalidatePath('/admin');
  redirect('/facility-review?reviewed=1');
}
