'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

function value(data: FormData, key: string) { return String(data.get(key) ?? '').trim(); }
function validId(id: string) { return /^[0-9a-f-]{36}$/i.test(id); }

export async function reviewClaim(data: FormData) {
  await requireAnyRole(['quality_reviewer','admin','super_admin']);
  const id=value(data,'claim_id'), decision=value(data,'decision'), reason=value(data,'reason');
  if (!validId(id) || !['approved','rejected'].includes(decision) || reason.length < 3 || reason.length > 1000) redirect('/catalogue-review?error=claim-fields');
  const supabase=await createClient();
  const {error}=await supabase.rpc('review_product_claim',{p_claim_id:id,p_decision:decision,p_reason:reason});
  if(error) redirect('/catalogue-review?error=claim-review-failed');
  revalidatePath('/catalogue-review'); revalidatePath('/admin'); redirect('/catalogue-review?claimReviewed=1');
}

export async function reviewProduct(data: FormData) {
  await requireAnyRole(['quality_reviewer','admin','super_admin']);
  const id=value(data,'product_id'), decision=value(data,'decision'), reason=value(data,'reason');
  if (!validId(id) || !['approved','rejected'].includes(decision) || reason.length < 3 || reason.length > 1000) redirect('/catalogue-review?error=product-fields');
  const supabase=await createClient();
  const {error}=await supabase.rpc('review_product_for_catalogue',{p_product_id:id,p_decision:decision,p_reason:reason});
  if(error) redirect('/catalogue-review?error=product-review-failed');
  revalidatePath('/catalogue-review'); revalidatePath('/admin'); redirect('/catalogue-review?productReviewed=1');
}

export async function publishProduct(data: FormData) {
  await requireAnyRole(['content_editor','admin','super_admin']);
  const id=value(data,'product_id');
  if(!validId(id)) redirect('/catalogue-review?error=publish-fields');
  const supabase=await createClient();
  const {error}=await supabase.rpc('publish_catalogue_product',{p_product_id:id});
  if(error) redirect('/catalogue-review?error=publish-failed');
  revalidatePath('/catalogue-review'); revalidatePath('/shop'); revalidatePath('/admin'); redirect('/catalogue-review?published=1');
}


export async function reviewProductMedia(data: FormData) {
  await requireAnyRole(['quality_reviewer','admin','super_admin']);
  const id=value(data,'media_id'), decision=value(data,'decision'), reason=value(data,'reason');
  if (!validId(id) || !['approved','rejected'].includes(decision) || reason.length < 3 || reason.length > 1000) redirect('/catalogue-review?error=media-fields');
  const supabase=await createClient();
  const {error}=await supabase.rpc('review_producer_product_media',{p_media_id:id,p_decision:decision,p_reason:reason});
  if(error) redirect('/catalogue-review?error=media-review-failed');
  revalidatePath('/catalogue-review'); revalidatePath('/admin'); redirect('/catalogue-review?mediaReviewed=1');
}
