from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
page=(root/'apps/web/app/explore-india/[region]/page.tsx').read_text()
workspace=(root/'apps/web/app/regional-review/page.tsx').read_text()
actions=(root/'apps/web/app/regional-review/actions.ts').read_text()
migration=(root/'supabase/migrations/202611020024_region_guide_content.sql').read_text()
css=(root/'apps/web/app/globals.css').read_text()
docs=(root/'docs/PHASE_3_REGION_OVERVIEW.md').read_text() if (root/'docs/PHASE_3_REGION_OVERVIEW.md').exists() else ''
checks={
 'region_guide_table_is_separate_from_region_taxonomy': 'create table public.region_guides' in migration and 'references public.regions(id)' in migration,
 'region_guide_copy_lengths_are_bounded': 'between 1 and 500' in migration and 'between 1 and 2000' in migration,
 'region_guide_requires_evidence_reference': 'evidence_reference text not null' in migration and "nullif(trim(p_evidence_reference),'') is null" in migration,
 'public_region_guide_read_requires_approval': "using (publication_status='approved')" in migration,
 'direct_table_writes_are_revoked': 'revoke all on table public.region_guides from anon, authenticated' in migration,
 'save_rpc_requires_content_editor_or_admin': "public.has_app_role('content_editor')" in migration and 'Regional content editor role required' in migration,
 'save_rpc_resets_review_state_to_draft': "'draft',v_user,null,null,null,now()" in migration,
 'save_rpc_audits_region_guide': 'regional.region_guide_draft_saved' in migration,
 'review_queue_includes_region_guides': "select 'region_guide'::text" in migration and 'from public.region_guides' in migration,
 'submit_rpc_supports_region_guide': "if p_record_type='region_guide' then" in migration and 'publication_status=\'pending_review\'' in migration,
 'review_rpc_supports_region_guide': "if p_record_type='region_guide' then" in migration and 'reviewer_id=v_user' in migration,
 'region_guide_author_cannot_approve_own_work': 'Authors cannot review their own regional guide' in migration and 'created_by=v_user' in migration,
 'workspace_imports_region_guide_action': 'saveRegionalGuide' in workspace,
 'workspace_has_regional_overview_form': 'Prepare a regional overview' in workspace and 'name="region_introduction"' in workspace,
 'workspace_exposes_state_heritage_note': 'name="region_heritage_note"' in workspace and 'maxLength={2000}' in workspace,
 'workspace_displays_proposed_regional_copy': 'Proposed regional overview copy' in workspace and "item.record_type === 'region_guide'" in workspace,
 'action_bounds_copy_lengths': 'introduction.length > 500' in actions and 'heritageNote.length > 2000' in actions,
 'action_saves_to_region_guide_rpc': "rpc('save_region_guide_draft'" in actions and "'region_guide'" in actions,
 'state_overview_cache_is_revalidated': "revalidatePath('/explore-india/[region]', 'page')" in actions,
 'district_overview_cache_is_revalidated': "revalidatePath('/explore-india/[region]/district/[district]', 'page')" in actions,
 'review_action_allows_region_guide_type': "!['region_guide', 'district', 'association', 'search_term'].includes(recordType)" in actions,
 'public_page_selects_only_approved_region_guide': "from('region_guides').select('introduction,food_heritage_note').eq('region_id', slug).eq('publication_status', 'approved')" in page,
 'public_page_selects_only_approved_districts': "from('districts').select('id,name,slug').eq('region_id', slug).eq('publication_status', 'approved')" in page,
 'public_page_renders_approved_regional_intro': 'guide?.introduction' in page and 'region-guide-intro' in page,
 'public_page_renders_approved_heritage_note': 'guide?.food_heritage_note' in page and 'region-heritage-note' in page,
 'public_page_shows_approved_region_level_foods': "from('product_regional_associations')" in page and "eq('review_status', 'approved')" in page and ".is('district_id', null)" in page,
 'region_page_uses_existing_products_not_seed_examples': 'item.products.name' in page and "from('product_regional_associations')" in page and "eq('review_status', 'approved')" in page and 'The regional table is taking shape.' in page,
 'no_origin_exclusivity_claim_is_made': 'does not imply exclusive origin' in page,
 'responsive_region_guide_styles_exist': '.region-guide-intro' in css and '.region-food-collection' in css,
 'regional_docs_describe_review_guardrails': 'only approved' in docs.lower() and 'no regional facts' in docs.lower(),
}
passed=sum(checks.values()); result={'suite':'phase3_region_overview','passed':passed,'total':len(checks),'checks':checks}
(root/'qa/phase3_region_overview_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed != len(checks): raise SystemExit(1)
