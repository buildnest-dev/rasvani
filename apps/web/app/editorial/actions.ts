'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const editorRoles = ['content_editor', 'admin', 'super_admin'] as const;
const publisherRoles = ['content_editor', 'admin', 'super_admin'] as const;

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export async function saveEditorialDraft(formData: FormData) {
  await requireAnyRole(publisherRoles);
  const slug = value(formData, 'slug');
  const title = value(formData, 'title');
  const contentType = value(formData, 'content_type');
  const regionId = value(formData, 'region_id') || null;
  const summary = value(formData, 'summary');
  const bodyText = value(formData, 'body');
  if (!slug || !title || !summary || !bodyText || !['story', 'recipe', 'regional_guide', 'page'].includes(contentType)) {
    redirect('/editorial?error=complete-all-fields');
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) redirect('/editorial?error=invalid-slug');

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_editorial_draft', {
    p_content_id: null,
    p_slug: slug,
    p_content_type: contentType,
    p_title: title,
    p_body: { summary, blocks: [{ type: 'paragraph', text: bodyText }] },
    p_region_id: regionId,
  });
  if (error || !data) redirect('/editorial?error=save-failed');
  revalidatePath('/editorial');
  redirect('/editorial?saved=1');
}

export async function editorialTransition(formData: FormData) {
  await requireAnyRole(editorRoles);
  const contentId = value(formData, 'content_id');
  const action = value(formData, 'action');
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(contentId)) redirect('/editorial?error=invalid-item');
  const supabase = await createClient();
  let error: { message: string } | null = null;
  if (action === 'submit') {
    ({ error } = await supabase.rpc('submit_editorial_for_review', { p_content_id: contentId }));
  } else if (action === 'approve' || action === 'reject') {
    const reason = value(formData, 'reason');
    if (!reason) redirect('/editorial?error=review-reason-required');
    ({ error } = await supabase.rpc('review_editorial_content', {
      p_content_id: contentId, p_decision: action === 'approve' ? 'approved' : 'rejected', p_reason: reason,
    }));
  } else if (action === 'publish') {
    await requireAnyRole(publisherRoles);
    ({ error } = await supabase.rpc('publish_editorial_content', { p_content_id: contentId }));
  } else {
    redirect('/editorial?error=unknown-action');
  }
  if (error) redirect('/editorial?error=transition-failed');
  revalidatePath('/editorial');
  revalidatePath('/food-stories');
  redirect('/editorial?updated=1');
}

export async function saveTranslationDraft(formData: FormData) {
  await requireAnyRole(publisherRoles);
  const contentId = value(formData, 'content_id');
  const locale = value(formData, 'locale');
  const title = value(formData, 'translation_title');
  const body = value(formData, 'translation_body');
  const locales = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'kn', 'ml', 'or', 'as'];
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(contentId) || !locales.includes(locale) || !title || !body) {
    redirect('/editorial?error=translation-fields-required');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('save_translation_draft', {
    p_content_id: contentId, p_locale: locale, p_title: title,
    p_body: { blocks: [{ type: 'paragraph', text: body }] },
  });
  if (error) redirect('/editorial?error=translation-save-failed');
  revalidatePath('/editorial');
  redirect('/editorial?translationSaved=1');
}

export async function translationTransition(formData: FormData) {
  const translationId = value(formData, 'translation_id');
  const action = value(formData, 'action');
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(translationId)) redirect('/editorial?error=invalid-translation');
  const supabase = await createClient();
  let error: { message: string } | null = null;
  if (action === 'submit') {
    await requireAnyRole(publisherRoles);
    ({ error } = await supabase.rpc('submit_translation_for_review', { p_translation_id: translationId }));
  } else if (action === 'approve' || action === 'reject') {
    await requireAnyRole(['quality_reviewer', 'admin', 'super_admin']);
    const reason = value(formData, 'reason');
    if (!reason) redirect('/editorial?error=translation-review-reason-required');
    ({ error } = await supabase.rpc('review_editorial_translation', {
      p_translation_id: translationId, p_decision: action === 'approve' ? 'approved' : 'rejected', p_reason: reason,
    }));
  } else {
    redirect('/editorial?error=unknown-translation-action');
  }
  if (error) redirect('/editorial?error=translation-transition-failed');
  revalidatePath('/editorial');
  redirect('/editorial?translationUpdated=1');
}
