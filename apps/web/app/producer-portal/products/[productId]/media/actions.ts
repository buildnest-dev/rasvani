'use server';

import { revalidatePath } from 'next/cache';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

export async function registerProducerProductMedia(productId: string, objectPath: string, filename: string, mimeType: string, byteSize: number) {
  await requireAnyRole(['producer']);
  if (!/^[0-9a-f-]{36}$/i.test(productId) || filename.length < 1 || filename.length > 180 ||
      !['image/jpeg','image/png','image/webp'].includes(mimeType) || !Number.isInteger(byteSize) || byteSize < 1 || byteSize > 5242880) {
    return { ok: false, error: 'invalid-fields' };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('register_producer_product_media', {
    p_product_id: productId, p_object_path: objectPath, p_original_filename: filename,
    p_mime_type: mimeType, p_byte_size: byteSize,
  });
  if (error) return { ok: false, error: 'registration-failed' };
  revalidatePath(`/producer-portal/products/${productId}/media`);
  revalidatePath('/catalogue-review');
  revalidatePath('/admin');
  return { ok: true };
}
