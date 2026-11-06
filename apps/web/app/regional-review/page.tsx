import type { Metadata } from 'next';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { regions } from '@/lib/regions';
import { reviewRegionalDiscoveryRecord, saveRegionalAssociation, saveRegionalDistrict, saveRegionalGuide, saveRegionalSearchTerm } from './actions';

export const metadata: Metadata = { title: 'Regional discovery review workspace' };
const workspaceRoles = ['content_editor', 'quality_reviewer', 'admin', 'super_admin'] as const;
const authorRoles = ['content_editor', 'admin', 'super_admin'] as const;
const reviewerRoles = ['quality_reviewer', 'admin', 'super_admin'] as const;
const localeOptions = [
  ['en', 'English'], ['hi', 'Hindi'], ['bn', 'Bengali'], ['ta', 'Tamil'], ['te', 'Telugu'], ['mr', 'Marathi'],
  ['gu', 'Gujarati'], ['pa', 'Punjabi'], ['kn', 'Kannada'], ['ml', 'Malayalam'], ['or', 'Odia'], ['as', 'Assamese'],
] as const;

type QueueRow = {
  record_type: 'region_guide' | 'district' | 'association' | 'search_term'; record_id: string; parent_name: string | null;
  record_name: string; region_name: string; detail: string | null; evidence_reference: string; submitted_at: string;
};
type ProductOption = { id: string; name: string; sku: string };
type DistrictOption = { id: string; region_id: string; name: string };

function messageFor(code?: string) {
  const messages: Record<string, string> = {
    'region-guide-fields': 'Choose a state or Union Territory, provide an evidence reference and keep the introduction and heritage note within their limits.',
    'region-guide-save-failed': 'The state / Union Territory guide could not be saved. Apply migration 024 and confirm your content-editor role.',
    'district-fields': 'Enter a district name, valid URL slug, region and evidence reference.',
    'district-save-failed': 'The district draft could not be saved. Apply migrations 022–023 and confirm your content-editor role.',
    'association-fields': 'Choose a published product, relationship type and evidence reference. Confirm any selected district belongs to the chosen region.',
    'association-save-failed': 'The regional food association could not be saved. Check its product, region and district relationship.',
    'search-term-fields': 'Choose a product, supported language and term type, then enter the search term and evidence reference.',
    'search-term-save-failed': 'The regional search term could not be saved. Check migration 022, duplicate terms and your role.',
    'submit-failed': 'The draft was saved, but it could not be submitted. It remains a draft until submission succeeds.',
    'invalid-intent': 'Choose either save draft or submit for review.',
    'review-fields': 'Choose a valid decision and enter a review reason of at least three characters.',
    'review-failed': 'The review transition failed. The record may no longer be pending or your account may not have reviewer permission.',
  };
  return code ? messages[code] ?? 'The request could not be completed.' : null;
}
function regionId(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function typeLabel(type: QueueRow['record_type']) {
  return type === 'region_guide' ? 'State / UT guide' : type === 'district' ? 'District guide' : type === 'association' ? 'Food / region association' : 'Regional search term';
}
function associationLabel(value: string) {
  return ({ origin_claim: 'Origin claim', produced_in: 'Produced in', traditionally_associated_with: 'Traditionally associated with', popular_in: 'Popular in' } as Record<string, string>)[value] ?? value;
}

export default async function RegionalReviewWorkspace({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const roles = await requireAnyRole(workspaceRoles);
  const canAuthor = roles.some((role) => authorRoles.includes(role as (typeof authorRoles)[number]));
  const canReview = roles.some((role) => reviewerRoles.includes(role as (typeof reviewerRoles)[number]));
  const supabase = await createClient();
  const [queueResult, productsResult, districtsResult, params] = await Promise.all([
    supabase.rpc('get_regional_discovery_review_queue'),
    canAuthor ? supabase.from('products').select('id,name,sku').eq('approval_status', 'approved').not('published_at', 'is', null).order('name').limit(250) : Promise.resolve({ data: [], error: null }),
    canAuthor ? supabase.from('districts').select('id,region_id,name').eq('publication_status', 'approved').order('name').limit(500) : Promise.resolve({ data: [], error: null }),
    searchParams,
  ]);
  const queue = Array.isArray(queueResult.data) ? queueResult.data as QueueRow[] : [];
  const products = Array.isArray(productsResult.data) ? productsResult.data as ProductOption[] : [];
  const districts = Array.isArray(districtsResult.data) ? districtsResult.data as DistrictOption[] : [];
  const errorMessage = messageFor(params.error);
  const regionOptions = regions.map((name) => ({ name, id: regionId(name) }));

  return <section className="wrap regional-review-page">
    <div className="page-hero">
      <div className="eyebrow">Rasvani · Protected regional governance</div>
      <h1>Regional discovery desk</h1>
      <p className="section-intro">Prepare evidence-backed state and district guides, food-to-region relationships and multilingual search terms. Each item is saved as a draft first and enters public discovery only after a separate quality review and approval.</p>
      <p><a className="text-link" href="/admin">← Operations dashboard</a> · <a className="text-link" href="/editorial">Editorial desk →</a></p>
    </div>
    {errorMessage && <p className="status" role="alert">{errorMessage}</p>}
    {params.regionGuide === 'draft' && <p className="status" role="status">State / Union Territory guide draft saved. It remains unpublished.</p>}
    {params.regionGuide === 'submitted' && <p className="status" role="status">State / Union Territory guide submitted for quality review.</p>}
    {params.district === 'draft' && <p className="status" role="status">District draft saved. It remains unpublished.</p>}
    {params.district === 'submitted' && <p className="status" role="status">District submitted to the quality-review queue.</p>}
    {params.association === 'draft' && <p className="status" role="status">Regional food association draft saved. It is not public.</p>}
    {params.association === 'submitted' && <p className="status" role="status">Regional food association submitted for review.</p>}
    {params.searchTerm === 'draft' && <p className="status" role="status">Search-term draft saved. It is not searchable by customers.</p>}
    {params.searchTerm === 'submitted' && <p className="status" role="status">Search term submitted for evidence review.</p>}
    {params.reviewed && <p className="status" role="status">Review decision recorded. The queue has been refreshed.</p>}

    {canAuthor && <section className="regional-review-panel">
      <div className="eyebrow">State and Union Territory editorial content</div><h2>Prepare a regional overview</h2>
      <form action={saveRegionalGuide} className="regional-review-form">
        <label>State / Union Territory<select name="region_id" required defaultValue="bihar">{regionOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
        <label>Evidence reference<input name="region_evidence_reference" required maxLength={1000} placeholder="Source URL, document reference or internal evidence ID"/></label>
        <label>Short regional introduction<textarea name="region_introduction" rows={3} maxLength={500} placeholder="A concise, fact-checked overview for visitors"/></label>
        <label>Food heritage and traditions<textarea name="region_heritage_note" rows={4} maxLength={2000} placeholder="Documented state-level food traditions and context"/></label>
        <p className="notice">State copy is reviewed as a unit against the evidence reference. The state taxonomy entry itself is not published by this action. Only approved copy appears on the public regional overview.</p>
        <div className="actions"><button className="btn secondary" name="intent" value="draft">Save draft</button><button className="btn" name="intent" value="submit">Save and submit for review</button></div>
      </form>
    </section>}

    {canAuthor && <section className="regional-review-panel">
      <div className="eyebrow">Content editors · Create and submit</div><h2>Prepare a district guide</h2>
      <form action={saveRegionalDistrict} className="regional-review-form">
        <label>State / Union Territory<select name="region_id" required defaultValue="bihar">{regionOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
        <label>District name<input name="name" required maxLength={120} placeholder="Enter verified district name"/></label>
        <label>URL slug<input name="slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="district-name"/></label>
        <label>Short district introduction<textarea name="introduction" rows={3} maxLength={500} placeholder="A concise, fact-checked introduction for visitors"/></label>
        <label>Food heritage context<textarea name="heritage_note" rows={4} maxLength={2000} placeholder="Documented food traditions, context or local preparation practices"/></label>
        <label>Evidence reference<input name="evidence_reference" required maxLength={1000} placeholder="Source URL, document reference or internal evidence ID"/></label>
        <p className="notice">The introduction and heritage note are reviewed together against this evidence reference. Leave them blank rather than publish unverified claims. Saving a draft does not publish a customer-facing page.</p>
        <div className="actions"><button className="btn secondary" name="intent" value="draft">Save draft</button><button className="btn" name="intent" value="submit">Save and submit for review</button></div>
      </form>
    </section>}

    {canAuthor && <section className="regional-review-panel">
      <div className="eyebrow">Evidence-backed food heritage</div><h2>Associate a published food with a region</h2>
      <form action={saveRegionalAssociation} className="regional-review-form">
        <label>Published product<select name="product_id" required defaultValue=""><option value="" disabled>Select a published product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></label>
        <label>State / Union Territory<select name="region_id" required defaultValue="bihar">{regionOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
        <label>Optional approved district<select name="district_ref" defaultValue=""><option value="">No district · region-level association</option>{districts.map((district) => <option key={district.id} value={`${district.region_id}::${district.id}`}>{district.name} · {regionOptions.find((region) => region.id === district.region_id)?.name ?? district.region_id}</option>)}</select></label>
        <label>Relationship type<select name="association_type" required defaultValue="traditionally_associated_with"><option value="origin_claim">Origin claim · requires strong origin evidence</option><option value="produced_in">Produced in</option><option value="traditionally_associated_with">Traditionally associated with</option><option value="popular_in">Popular in</option></select></label>
        <label>Relationship note<textarea name="relationship_note" rows={2} maxLength={1000} placeholder="Describe the documented relationship without claiming exclusivity"/></label>
        <label>Evidence reference<input name="evidence_reference" required maxLength={1000} placeholder="Source URL, document reference or internal evidence ID"/></label>
        <p className="notice">A food may have multiple verified regional associations. Do not mark an origin as exclusive unless the evidence supports that exact claim. An optional district selection uses that district&apos;s own state automatically.</p>
        <div className="actions"><button className="btn secondary" name="intent" value="draft">Save draft</button><button className="btn" name="intent" value="submit">Save and submit for review</button></div>
        {products.length === 0 && <p className="notice">No published products are available to associate yet. Product drafts cannot be selected through this public-read selector.</p>}
      </form>
    </section>}

    {canAuthor && <section className="regional-review-panel">
      <div className="eyebrow">12-language search quality</div><h2>Add an evidence-reviewed local search term</h2>
      <form action={saveRegionalSearchTerm} className="regional-review-form">
        <label>Published product<select name="product_id" required defaultValue=""><option value="" disabled>Select a published product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></label>
        <label>Language<select name="locale" required defaultValue="hi">{localeOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <label>Alternative spelling / transliteration / synonym<input name="term" required maxLength={160}/></label>
        <label>Term type<select name="term_type" required defaultValue="regional_spelling"><option value="name_variant">Name variant</option><option value="regional_spelling">Regional spelling</option><option value="transliteration">Transliteration</option><option value="synonym">Synonym</option></select></label>
        <label>Evidence reference<input name="evidence_reference" required maxLength={1000} placeholder="Source URL, document reference or internal evidence ID"/></label>
        <p className="notice">Do not enter machine-generated translations as verified facts. Duplicate locale/product terms are rejected by the database. Only approved terms attached to published products are used in public search.</p>
        <div className="actions"><button className="btn secondary" name="intent" value="draft">Save draft</button><button className="btn" name="intent" value="submit">Save and submit for review</button></div>
      </form>
    </section>}

    <section className="regional-review-panel">
      <div className="eyebrow">Quality review · Evidence queue</div><h2>Items awaiting review <span className="regional-review-count">{queue.length}</span></h2>
      {queueResult.error && <p className="status" role="status">The queue is unavailable. Apply migrations 022–024 and confirm your account has regional workspace access.</p>}
      {!queueResult.error && queue.length === 0 && <p className="notice">No regional guides, district guides, food associations or localized search terms are currently awaiting review.</p>}
      {queue.map((item) => <article className="regional-review-item" key={`${item.record_type}-${item.record_id}`}>
        <div className="regional-review-item-head"><div><div className="eyebrow">{typeLabel(item.record_type)} · Submitted {new Date(item.submitted_at).toLocaleDateString('en-IN')}</div><h3>{item.record_type === 'district' ? item.record_name : item.parent_name ?? item.record_name}</h3></div><span className="regional-review-type">{item.region_name}</span></div>
        {item.record_type === 'association' && <p><strong>Relationship:</strong> {associationLabel(item.record_name)}{item.detail ? ` · ${item.detail}` : ''}</p>}
        {item.record_type === 'search_term' && <p><strong>Search term:</strong> {item.record_name} · {item.region_name.toUpperCase()} · {item.detail?.replaceAll('_', ' ')}</p>}
        {item.record_type === 'region_guide' && <><p><strong>State / Union Territory:</strong> {item.region_name}</p>{item.detail && <div className="regional-district-review-copy"><strong>Proposed regional overview copy</strong><p>{item.detail}</p></div>}</>}
        {item.record_type === 'district' && <><p><strong>Region:</strong> {item.region_name}</p>{item.detail && <div className="regional-district-review-copy"><strong>Proposed district guide copy</strong><p>{item.detail}</p></div>}</>}
        <p className="regional-evidence"><strong>Evidence reference:</strong> {item.evidence_reference}</p>
        {canReview ? <form action={reviewRegionalDiscoveryRecord} className="regional-review-decision">
          <input type="hidden" name="record_type" value={item.record_type}/><input type="hidden" name="record_id" value={item.record_id}/>
          <label>Review reason<textarea name="reason" rows={2} minLength={3} maxLength={1000} required placeholder="Record what evidence was checked and why this decision is appropriate"/></label>
          <div className="actions"><button className="btn" name="decision" value="approved">Approve</button><button className="btn secondary" name="decision" value="rejected">Reject</button></div>
        </form> : <p className="notice">Read-only queue. A quality reviewer or administrator must make the approval decision.</p>}
      </article>)}
    </section>
    <p className="notice regional-review-footnote">All decisions are written through role-gated database functions with reviewer identity, timestamp, reason and audit history. Approval makes a record eligible for public display subject to approved-only read policies and any related product or district publication conditions. This workspace does not itself certify the truth of evidence; reviewers must inspect each source.</p>
  </section>;
}
