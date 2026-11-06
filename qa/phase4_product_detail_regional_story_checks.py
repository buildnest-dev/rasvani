from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
detail = (root / 'apps/web/app/shop/[slug]/page.tsx').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
migration = (root / 'supabase/migrations/202611020022_regional_district_associations_search.sql').read_text()
docs = (root / 'docs/PHASE_4_PRODUCT_DETAIL_REGIONAL_STORY.md').read_text()
checks = {
    'product_detail_requires_approved_and_published_product': "eq('approval_status', 'approved')" in detail and "not('published_at', 'is', null)" in detail,
    'regional_associations_are_scoped_to_current_product': "eq('product_id', product.id)" in detail,
    'only_approved_associations_are_queried': "eq('review_status', 'approved')" in detail,
    'all_four_schema_relationship_types_have_labels': all(k in detail and v in detail for k, v in {
        'origin_claim': 'Origin claim', 'produced_in': 'Produced in',
        'traditionally_associated_with': 'Traditionally associated with', 'popular_in': 'Popular in',
    }.items()),
    'canonical_region_directory_drives_region_names': "import { regions } from '@/lib/regions'" in detail and 'knownRegions.get(association.region_id)' in detail,
    'unknown_region_ids_are_not_rendered': 'if (!name) return []' in detail,
    'districts_are_loaded_only_for_associated_ids': '.in(\'id\', districtIds)' in detail,
    'districts_must_be_approved': ".eq('publication_status', 'approved')" in detail,
    'district_must_match_association_region': 'district.region_id !== association.region_id' in detail,
    'district_link_uses_approved_slug': 'relationship.district.slug' in detail and '/district/${encodeURIComponent' in detail,
    'region_link_uses_canonical_region_id_slug': 'relationship.region_slug' in detail and '/explore-india/${relationship.region_slug}' in detail,
    'reviewed_relationship_note_is_visible': 'relationship.relationship_note' in detail,
    'internal_evidence_and_reviewer_notes_are_not_selected': 'evidence_reference' not in detail and 'review_note' not in detail and 'reviewer_id' not in detail,
    'approved_product_media_rpc_remains_the_photo_source': 'get_public_catalogue_product_media' in detail and 'createSignedUrl(item.object_path, 900)' in detail,
    'no_unapproved_product_media_fallback_is_used': 'No quality-approved product photograph is published yet.' in detail,
    'product_private_and_commercial_fields_are_not_selected': all(field not in detail for field in ['producer_id', 'sku', 'amount_paise', 'quantity_on_hand', 'expiry_date']),
    'relationship_disclaimer_rejects_exclusivity_assumption': 'does not establish that a food is exclusive to a place' in detail,
    'regional_association_policy_requires_approved_product_and_district': "review_status='approved'" in migration and "p.approval_status='approved'" in migration and "d.publication_status='approved'" in migration,
    'responsive_regional_relationship_cards_exist': '.product-regional-grid' in css and '@media(max-width:620px){.product-regional-section' in css,
    'implementation_documentation_covers_guardrails': 'relationship_note' in docs and 'does not reveal internal evidence references' in docs and 'delivery promises' in docs,
}
passed = sum(checks.values())
result = {
    'suite': 'phase4_product_detail_regional_story',
    'passed': passed,
    'total': len(checks),
    'status': 'PASS' if passed == len(checks) else 'FAIL',
    'checks': checks,
}
(root / 'qa/phase4_product_detail_regional_story_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': passed, 'total': len(checks), 'failed': [name for name, passed_check in checks.items() if not passed_check]}, indent=2))
if passed != len(checks):
    raise SystemExit(1)
