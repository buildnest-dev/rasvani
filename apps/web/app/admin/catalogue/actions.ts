'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;
const toPaise = (value: FormDataEntryValue | null) => {
  const rupees = Number(String(value ?? '').trim());
  return Number.isFinite(rupees) ? Math.round(rupees * 100) : NaN;
};
function done(flag: string): never {
  revalidatePath('/admin/catalogue'); revalidatePath('/shop');
  redirect(`/admin/catalogue?${flag}`);
}

export async function publishProduct(formData: FormData) {
  await requireAnyRole(['admin', 'super_admin']);
  const paise = toPaise(formData.get('price'));
  const categoryRaw = String(formData.get('category') ?? '');
  if (!Number.isInteger(paise) || paise < 100 || (categoryRaw && !uuid.test(categoryRaw))) redirect('/admin/catalogue?error=invalid');
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_publish_product', {
    p_sku: String(formData.get('sku') ?? ''), p_name: String(formData.get('name') ?? ''),
    p_description: String(formData.get('description') ?? ''), p_category_id: categoryRaw || null,
    p_price_paise: paise, p_storage: String(formData.get('storage') ?? 'ambient'),
    p_dietary_evidence: String(formData.get('evidence') ?? ''),
  });
  if (error) redirect(`/admin/catalogue?error=${encodeURIComponent(error.message.slice(0, 120))}`);
  done('published=1');
}

export async function changePrice(formData: FormData) {
  await requireAnyRole(['admin', 'super_admin']);
  const id = String(formData.get('product_id') ?? '');
  const paise = toPaise(formData.get('price'));
  if (!uuid.test(id) || !Number.isInteger(paise) || paise < 100) redirect('/admin/catalogue?error=invalid');
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_set_product_price', { p_product_id: id, p_price_paise: paise });
  if (error) redirect('/admin/catalogue?error=price-failed');
  done('priced=1');
}

export async function setVisibility(formData: FormData) {
  await requireAnyRole(['admin', 'super_admin']);
  const id = String(formData.get('product_id') ?? '');
  if (!uuid.test(id)) redirect('/admin/catalogue?error=invalid');
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_set_product_visibility', { p_product_id: id, p_visible: formData.get('visible') === 'true' });
  if (error) redirect('/admin/catalogue?error=visibility-failed');
  done('visibility=1');
}
