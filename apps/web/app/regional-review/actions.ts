'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const editorRoles = ['content_editor', 'admin', 'super_admin'] as const;
const reviewerRoles = ['quality_reviewer', 'admin', 'super_admin'] as const;
const locales = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'kn', 'ml', 'or', 'as'];
const associationTypes = ['origin_claim', 'produced_in', 'traditionally_associated_with', 'popular_in'];
const termTypes = ['name_variant', 'regional_spelling', 'transliteration', 'synonym'];

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}
function validId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
function validIntent(intent: string): intent is 'draft' | 'submit' {
  return intent === 'draft' || intent === 'submit';
}

async function submitIfRequested(supabase: Awaited<ReturnType<typeof createClient>>, type: string, id: string, intent: string) {
  if (!validIntent(intent)) redirect('/regional-review?error=invalid-intent');
  if (intent === 'submit') {
    const { error } = await supabase.rpc('submit_regional_discovery_record', {
      p_record_type: type,
      p_record_id: id,
    });
    if (error) redirect('/regional-review?error=submit-failed');
  }
}

function finish(savedMessage: string, intent: string): never {
  revalidatePath('/regional-review');
  revalidatePath('/explore-india');
  revalidatePath('/explore-india/[region]', 'page');
  revalidatePath('/explore-india/[region]/district/[district]', 'page');
  revalidatePath('/shop');
  redirect(`/regional-review?${savedMessage}=${intent === 'submit' ? 'submitted' : 'draft'}`);
}


export async function saveRegionalGuide(formData: FormData) {
  await requireAnyRole(editorRoles);
  const regionId = value(formData, 'region_id');
  const introduction = value(formData, 'region_introduction');
  const heritageNote = value(formData, 'region_heritage_note');
  const evidence = value(formData, 'region_evidence_reference');
  const intent = value(formData, 'intent');
  if (!regionId || introduction.length > 500 || heritageNote.length > 2000 || !evidence || evidence.length > 1000 || !validIntent(intent)) {
    redirect('/regional-review?error=region-guide-fields');
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_region_guide_draft', {
    p_guide_id: null,
    p_region_id: regionId,
    p_introduction: introduction || null,
    p_food_heritage_note: heritageNote || null,
    p_evidence_reference: evidence,
  });
  if (error || typeof data !== 'string' || !validId(data)) redirect('/regional-review?error=region-guide-save-failed');
  await submitIfRequested(supabase, 'region_guide', data, intent);
  finish('regionGuide', intent);
}

export async function saveRegionalDistrict(formData: FormData) {
  await requireAnyRole(editorRoles);
  const regionId = value(formData, 'region_id');
  const name = value(formData, 'name');
  const slug = value(formData, 'slug');
  const evidence = value(formData, 'evidence_reference');
  const introduction = value(formData, 'introduction');
  const heritageNote = value(formData, 'heritage_note');
  const intent = value(formData, 'intent');
  if (!regionId || !name || name.length > 120 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !evidence || evidence.length > 1000 || introduction.length > 500 || heritageNote.length > 2000 || !validIntent(intent)) {
    redirect('/regional-review?error=district-fields');
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_district_draft', {
    p_district_id: null,
    p_region_id: regionId,
    p_name: name,
    p_slug: slug,
    p_evidence_reference: evidence,
    p_introduction: introduction || null,
    p_heritage_note: heritageNote || null,
  });
  if (error || typeof data !== 'string' || !validId(data)) redirect('/regional-review?error=district-save-failed');
  await submitIfRequested(supabase, 'district', data, intent);
  finish('district', intent);
}

export async function saveRegionalAssociation(formData: FormData) {
  await requireAnyRole(editorRoles);
  const productId = value(formData, 'product_id');
  const regionIdInput = value(formData, 'region_id');
  const districtSelection = value(formData, 'district_ref');
  const associationType = value(formData, 'association_type');
  const relationshipNote = value(formData, 'relationship_note');
  const evidence = value(formData, 'evidence_reference');
  const intent = value(formData, 'intent');
  let regionId = regionIdInput;
  let districtId: string | null = null;
  if (districtSelection) {
    const [districtRegionId, selectedDistrictId, ...extra] = districtSelection.split('::');
    if (extra.length || !districtRegionId || !validId(selectedDistrictId ?? '')) redirect('/regional-review?error=association-fields');
    regionId = districtRegionId;
    districtId = selectedDistrictId;
  }
  if (!validId(productId) || !regionId || !associationTypes.includes(associationType) || !evidence || evidence.length > 1000 || relationshipNote.length > 1000 || !validIntent(intent)) {
    redirect('/regional-review?error=association-fields');
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_product_regional_association_draft', {
    p_association_id: null,
    p_product_id: productId,
    p_region_id: regionId,
    p_district_id: districtId,
    p_association_type: associationType,
    p_relationship_note: relationshipNote || null,
    p_evidence_reference: evidence,
  });
  if (error || typeof data !== 'string' || !validId(data)) redirect('/regional-review?error=association-save-failed');
  await submitIfRequested(supabase, 'association', data, intent);
  finish('association', intent);
}

export async function saveRegionalSearchTerm(formData: FormData) {
  await requireAnyRole(editorRoles);
  const productId = value(formData, 'product_id');
  const locale = value(formData, 'locale');
  const term = value(formData, 'term');
  const termType = value(formData, 'term_type');
  const evidence = value(formData, 'evidence_reference');
  const intent = value(formData, 'intent');
  if (!validId(productId) || !locales.includes(locale) || !term || term.length > 160 || !termTypes.includes(termType) || !evidence || evidence.length > 1000 || !validIntent(intent)) {
    redirect('/regional-review?error=search-term-fields');
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_product_search_term_draft', {
    p_term_id: null,
    p_product_id: productId,
    p_locale: locale,
    p_term: term,
    p_term_type: termType,
    p_evidence_reference: evidence,
  });
  if (error || typeof data !== 'string' || !validId(data)) redirect('/regional-review?error=search-term-save-failed');
  await submitIfRequested(supabase, 'search_term', data, intent);
  finish('searchTerm', intent);
}

export async function reviewRegionalDiscoveryRecord(formData: FormData) {
  await requireAnyRole(reviewerRoles);
  const recordType = value(formData, 'record_type');
  const recordId = value(formData, 'record_id');
  const decision = value(formData, 'decision');
  const reason = value(formData, 'reason');
  if (!['region_guide', 'district', 'association', 'search_term'].includes(recordType) || !validId(recordId) || !['approved', 'rejected'].includes(decision) || reason.length < 3 || reason.length > 1000) {
    redirect('/regional-review?error=review-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('review_regional_discovery_record', {
    p_record_type: recordType,
    p_record_id: recordId,
    p_decision: decision,
    p_reason: reason,
  });
  if (error) redirect('/regional-review?error=review-failed');
  revalidatePath('/regional-review');
  revalidatePath('/explore-india');
  revalidatePath('/explore-india/[region]', 'page');
  revalidatePath('/explore-india/[region]/district/[district]', 'page');
  revalidatePath('/shop');
  redirect('/regional-review?reviewed=1');
}
