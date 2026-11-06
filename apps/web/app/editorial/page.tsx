import type { Metadata } from 'next';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { saveEditorialDraft, editorialTransition, saveTranslationDraft, translationTransition } from './actions';

export const metadata: Metadata = { title: 'Editorial workspace' };
const editorRoles = ['content_editor', 'quality_reviewer', 'admin', 'super_admin'] as const;
const contentReviewRoles = ['content_editor', 'admin', 'super_admin'] as const;
const translationReviewRoles = ['quality_reviewer', 'admin', 'super_admin'] as const;
const authorRoles = ['content_editor', 'admin', 'super_admin'] as const;

type TranslationRow = { translation_id: string; content_id: string; source_title: string; locale: string; translation_title: string; review_status: string; reviewed_at: string | null };
type QueueRow = {
  content_id: string; slug: string; content_type: string; title: string; region_id: string | null;
  status: string; updated_at: string; published_at: string | null;
  translation_locale: string | null; translation_status: string | null;
};

function messageFor(code?: string) {
  const messages: Record<string, string> = {
    'complete-all-fields': 'Please complete every required field.',
    'invalid-slug': 'Use a lowercase URL slug with hyphens only.',
    'save-failed': 'The draft could not be saved. Check the database migration and your role.',
    'invalid-item': 'The selected content item is invalid.',
    'review-reason-required': 'A review reason is required for every decision.',
    'transition-failed': 'The requested transition was not accepted. Check the item status and your role.',
    'unknown-action': 'That action is not supported.',
    'translation-fields-required': 'Choose a source item and supported language, then complete the translation title and body.',
    'translation-save-failed': 'The translation draft could not be saved.',
    'invalid-translation': 'The selected translation is invalid.',
    'translation-review-reason-required': 'A reason is required for every translation review decision.',
    'translation-transition-failed': 'The translation transition was not accepted. Check its status and your role.',
  };
  return code ? messages[code] ?? 'The request could not be completed.' : null;
}

export default async function EditorialWorkspace({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; updated?: string; translationSaved?: string; translationUpdated?: string }> }) {
  const roles = await requireAnyRole(editorRoles);
  const canAuthor = roles.some((role) => authorRoles.includes(role as (typeof authorRoles)[number]));
  const canReviewContent = roles.some((role) => contentReviewRoles.includes(role as (typeof contentReviewRoles)[number]));
  const canReviewTranslations = roles.some((role) => translationReviewRoles.includes(role as (typeof translationReviewRoles)[number]));
  const canPublish = canAuthor;
  const supabase = await createClient();
  const [{ data, error }, { data: translationData, error: translationError }, params] = await Promise.all([
    supabase.rpc('get_editorial_work_queue'), supabase.rpc('get_translation_work_queue'), searchParams,
  ]);
  const rows = (Array.isArray(data) ? data : []) as QueueRow[];
  const translationRows = (Array.isArray(translationData) ? translationData : []) as TranslationRow[];
  const errorMessage = messageFor(params.error);

  return <section className="wrap editorial-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · Protected workspace</div><h1>Editorial desk</h1>
      <p className="section-intro">Create drafts, submit stories for review and publish only after approval. Translation approval remains a separate workflow.</p></div>
    {errorMessage && <p className="status" role="alert">{errorMessage}</p>}
    {params.saved && <p className="status" role="status">Draft saved. It remains unpublished until reviewed and explicitly published.</p>}
    {params.updated && <p className="status" role="status">The editorial status was updated.</p>}
    {params.translationSaved && <p className="status" role="status">Translation draft saved. It is not public until separately reviewed and the source item is published.</p>}
    {params.translationUpdated && <p className="status" role="status">Translation review status updated.</p>}
    {translationError && <p className="status" role="status">Translation queue unavailable. Apply migration 011 and confirm your translation workspace role.</p>}
    {error && <p className="status" role="status">The editorial queue is unavailable. Apply migration 010 and confirm the signed-in account has an editorial role.</p>}

    {canAuthor && <section className="editorial-panel">
      <div className="eyebrow">New content</div><h2>Create an editorial draft</h2>
      <form action={saveEditorialDraft} className="editorial-form">
        <label>Title<input name="title" required maxLength={180} /></label>
        <label>URL slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} placeholder="regional-food-story" /></label>
        <label>Content type<select name="content_type" required defaultValue="story"><option value="story">Story</option><option value="recipe">Recipe</option><option value="regional_guide">Regional guide</option><option value="page">Page</option></select></label>
        <label>Region ID (optional)<input name="region_id" maxLength={80} placeholder="Use an existing region ID" /></label>
        <label>Short summary<textarea name="summary" required rows={2} maxLength={500} /></label>
        <label>Draft body<textarea name="body" required rows={7} maxLength={12000} /></label>
        <p className="notice">This initial editor stores a structured summary and paragraph block. Rich media, citations and reviewed translations are handled in later CMS increments.</p>
        <button className="btn" type="submit">Save draft</button>
      </form>
    </section>}

    {canAuthor && <section className="editorial-panel">
      <div className="eyebrow">12-language publishing</div><h2>Create or update a translation draft</h2>
      <form action={saveTranslationDraft} className="editorial-form">
        <label>Source content<select name="content_id" required defaultValue=""><option value="" disabled>Select approved or in-progress source content</option>{rows.map((row) => <option key={row.content_id} value={row.content_id}>{row.title} · {row.status}</option>)}</select></label>
        <label>Language<select name="locale" required defaultValue="hi"><option value="en">English</option><option value="hi">Hindi</option><option value="bn">Bengali</option><option value="ta">Tamil</option><option value="te">Telugu</option><option value="mr">Marathi</option><option value="gu">Gujarati</option><option value="pa">Punjabi</option><option value="kn">Kannada</option><option value="ml">Malayalam</option><option value="or">Odia</option><option value="as">Assamese</option></select></label>
        <label>Translated title<input name="translation_title" required maxLength={180}/></label>
        <label>Translated body<textarea name="translation_body" required rows={5} maxLength={12000}/></label>
        <p className="notice">Save creates a draft or resets an existing locale translation to draft. Only a qualified reviewer/admin can approve it. Do not mark machine translation as professionally reviewed.</p>
        <button className="btn" type="submit">Save translation draft</button>
      </form>
    </section>}

    <section className="editorial-panel"><div className="eyebrow">Translation quality review</div><h2>Translation work queue</h2>
      {translationRows.length === 0 ? <p className="notice">No translations are currently available in this queue.</p> : <div className="editorial-list">{translationRows.map((row) => <article className="editorial-item" key={row.translation_id}>
        <div className="editorial-item-main"><div className="eyebrow">{row.locale.toUpperCase()} · {row.review_status.replace('_', ' ')}</div><h3>{row.translation_title}</h3><p className="notice">Source: {row.source_title}</p></div>
        <div className="editorial-actions">
          {row.review_status === 'draft' && canAuthor && <form action={translationTransition}><input type="hidden" name="translation_id" value={row.translation_id}/><input type="hidden" name="action" value="submit"/><button className="btn secondary" type="submit">Submit for review</button></form>}
          {row.review_status === 'pending_review' && canReviewTranslations && <><form action={translationTransition}><input type="hidden" name="translation_id" value={row.translation_id}/><input type="hidden" name="action" value="approve"/><input aria-label="Translation approval reason" name="reason" placeholder="Review reason" required/><button className="btn" type="submit">Approve translation</button></form><form action={translationTransition}><input type="hidden" name="translation_id" value={row.translation_id}/><input type="hidden" name="action" value="reject"/><input aria-label="Translation rejection reason" name="reason" placeholder="Review reason" required/><button className="btn secondary" type="submit">Reject</button></form></>}
          {row.review_status === 'approved' && <span className="published-label">Approved · source publication still required</span>}
        </div>
      </article>)}</div>}
    </section>

    <section className="editorial-panel"><div className="eyebrow">Content governance</div><h2>Editorial work queue</h2>
      {!data && !error ? <p className="notice">No queue data returned.</p> : rows.length === 0 ? <p className="notice">No editorial items are currently available to this workspace.</p> : <div className="editorial-list">
        {rows.map((row) => <article className="editorial-item" key={`${row.content_id}-${row.translation_locale ?? 'source'}`}>
          <div className="editorial-item-main"><div className="eyebrow">{row.content_type.replace('_', ' ')} · {row.region_id ?? 'All regions'}</div><h3>{row.title}</h3><p className="notice">/{row.slug} · {row.status.replace('_', ' ')} · Updated {new Date(row.updated_at).toLocaleDateString('en-IN')}</p>
            {row.translation_locale && <p className="notice">Translation: {row.translation_locale.toUpperCase()} · {row.translation_status?.replace('_', ' ')}</p>}
          </div>
          <div className="editorial-actions">
            {row.status === 'draft' && canAuthor && <form action={editorialTransition}><input type="hidden" name="content_id" value={row.content_id}/><input type="hidden" name="action" value="submit"/><button className="btn secondary" type="submit">Submit for review</button></form>}
            {row.status === 'pending_review' && canReviewContent && <>
              <form action={editorialTransition}><input type="hidden" name="content_id" value={row.content_id}/><input type="hidden" name="action" value="approve"/><input aria-label="Approval reason" name="reason" placeholder="Review reason" required/><button className="btn" type="submit">Approve</button></form>
              <form action={editorialTransition}><input type="hidden" name="content_id" value={row.content_id}/><input type="hidden" name="action" value="reject"/><input aria-label="Rejection reason" name="reason" placeholder="Review reason" required/><button className="btn secondary" type="submit">Reject</button></form>
            </>}
            {row.status === 'approved' && !row.published_at && canPublish && <form action={editorialTransition}><input type="hidden" name="content_id" value={row.content_id}/><input type="hidden" name="action" value="publish"/><button className="btn" type="submit">Publish</button></form>}
            {row.published_at && <span className="published-label">Published {new Date(row.published_at).toLocaleDateString('en-IN')}</span>}
          </div>
        </article>)}
      </div>}
    </section>
    <p className="notice">All transitions are revalidated by database functions and role checks. This page does not approve translations or assert that translations have been professionally reviewed.</p>
  </section>;
}
