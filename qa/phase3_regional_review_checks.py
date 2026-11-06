from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page = (root / 'apps/web/app/regional-review/page.tsx').read_text()
actions = (root / 'apps/web/app/regional-review/actions.ts').read_text()
admin = (root / 'apps/web/app/admin/page.tsx').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
migration = (root / 'supabase/migrations/202611020022_regional_district_associations_search.sql').read_text()
checks = {
    'regional_workspace_route_exists': (root / 'apps/web/app/regional-review/page.tsx').exists(),
    'regional_workspace_requires_staff_role': "requireAnyRole(workspaceRoles)" in page,
    'workspace_roles_include_editors_reviewers_and_admins': all(x in page for x in ['content_editor', 'quality_reviewer', 'admin', 'super_admin']),
    'draft_authoring_is_hidden_without_editor_role': '{canAuthor &&' in page,
    'review_decisions_require_reviewer_role': 'const reviewerRoles' in page and 'canReview ?' in page,
    'district_form_captures_region_name_slug_evidence': all(x in page for x in ['name="region_id"', 'name="name"', 'name="slug"', 'name="evidence_reference"']),
    'district_form_offers_save_and_submit': 'Save and submit for review' in page and 'saveRegionalDistrict' in page,
    'district_form_lists_canonical_region_directory': "regions.map((name)" in page,
    'association_form_uses_published_products_only': "from('products').select('id,name,sku').eq('approval_status', 'approved').not('published_at', 'is', null)" in page,
    'association_form_offers_nonexclusive_relationship_types': all(x in page for x in ['origin_claim', 'produced_in', 'traditionally_associated_with', 'popular_in']),
    'association_form_supports_optional_district': 'name="district_ref"' in page,
    'association_form_explains_nonexclusive_origin': 'Do not mark an origin as exclusive unless the evidence supports that exact claim' in page,
    'search_term_form_supports_12_locales': all(x in page for x in ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Punjabi', 'Kannada', 'Malayalam', 'Odia', 'Assamese']),
    'search_term_form_requires_evidence_reference': 'name="evidence_reference"' in page,
    'search_term_form_lists_supported_term_types': all(x in page for x in ['name_variant', 'regional_spelling', 'transliteration', 'synonym']),
    'queue_uses_database_role_gated_rpc': "rpc('get_regional_discovery_review_queue')" in page,
    'queue_has_all_three_regional_record_types': all(x in page for x in ['district', 'association', 'search_term']),
    'queue_displays_evidence_reference': 'item.evidence_reference' in page,
    'review_form_requires_reason': 'name="reason"' in page and 'minLength={3}' in page,
    'review_form_has_approve_and_reject': 'value="approved"' in page and 'value="rejected"' in page,
    'read_only_reviewers_are_explained': 'Read-only queue. A quality reviewer or administrator' in page,
    'district_action_server_role_guard': 'await requireAnyRole(editorRoles)' in actions,
    'association_action_server_role_guard': actions.count('await requireAnyRole(editorRoles)') >= 3,
    'search_term_action_server_role_guard': actions.count('await requireAnyRole(editorRoles)') >= 3,
    'review_action_server_role_guard': 'await requireAnyRole(reviewerRoles)' in actions,
    'district_save_uses_audited_rpc': "rpc('save_district_draft'" in actions,
    'association_save_uses_audited_rpc': "rpc('save_product_regional_association_draft'" in actions,
    'search_term_save_uses_audited_rpc': "rpc('save_product_search_term_draft'" in actions,
    'submit_uses_role_gated_rpc': "rpc('submit_regional_discovery_record'" in actions,
    'review_uses_role_gated_rpc': "rpc('review_regional_discovery_record'" in actions,
    'server_actions_validate_ids_and_decisions': 'validId(recordId)' in actions and "['approved', 'rejected'].includes(decision)" in actions,
    'server_actions_bound_reason_and_evidence_fields': 'reason.length > 1000' in actions and 'evidence.length > 1000' in actions,
    'actions_revalidate_public_and_staff_discovery': all(x in actions for x in ["revalidatePath('/regional-review')", "revalidatePath('/explore-india')", "revalidatePath('/shop')"]),
    'admin_dashboard_links_regional_review': 'href="/regional-review"' in admin,
    'migration_queue_is_role_gated_and_bounded': "limit 200" in migration and 'public.has_app_role' in migration,
    'migration_review_function_audits_decision_reason': "'regional.record_reviewed'" in migration and "'reason',trim(p_reason)" in migration,
    'migration_submit_function_audits_submission': "'regional.record_submitted'" in migration,
    'migration_public_policies_require_approval': "publication_status='approved'" in migration and "review_status='approved'" in migration,
    'responsive_review_workspace_styles_exist': '.regional-review-form' in css and '@media(max-width:640px)' in css,
}
passed = sum(checks.values())
result = {'suite': 'phase3_regional_review', 'passed': passed, 'total': len(checks), 'checks': checks}
out = root / 'qa/phase3_regional_review_static_results.json'
out.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': passed, 'total': len(checks), 'failed': [k for k, v in checks.items() if not v]}, indent=2))
if passed != len(checks):
    raise SystemExit(1)
