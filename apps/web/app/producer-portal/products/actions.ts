'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const producerRoles = ['producer'] as const;
const value = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

export async function submitProducerProduct(form: FormData) {
  await requireAnyRole(producerRoles);
  const sku = value(form, 'sku');
  const name = value(form, 'name');
  const categoryId = value(form, 'category_id');
  const description = value(form, 'description');
  const ingredients = value(form, 'ingredients').split('\n').map((item) => item.trim()).filter(Boolean);
  const allergen = value(form, 'allergen_statement');
  const storage = value(form, 'storage_condition');
  const claimType = value(form, 'claim_type');
  const claimText = value(form, 'claim_text');
  const evidence = value(form, 'claim_evidence_reference');
  if (!sku || sku.length > 80 || !name || name.length > 180 || !/^[0-9a-f-]{36}$/i.test(categoryId) || description.length > 5000 || allergen.length > 1500 || ingredients.length > 80 || ingredients.some((item) => item.length > 180) || !['ambient', 'chilled', 'frozen', 'other'].includes(storage) || claimType.length > 80 || claimText.length > 1000 || evidence.length > 500 || Boolean(claimType) !== Boolean(claimText)) {
    redirect('/producer-portal/products?error=invalid-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_producer_product', {
    p_sku: sku, p_name: name, p_category_id: categoryId, p_description: description,
    p_ingredients: ingredients, p_allergen_statement: allergen, p_storage_condition: storage,
    p_claim_type: claimType || null, p_claim_text: claimText || null,
    p_claim_evidence_reference: evidence || null,
  });
  if (error) redirect('/producer-portal/products?error=submission-failed');
  revalidatePath('/producer-portal/products');
  revalidatePath('/catalogue-review');
  redirect('/producer-portal/products?submitted=1');
}
