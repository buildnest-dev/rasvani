from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
state=(root/'apps/web/app/explore-india/[region]/page.tsx').read_text()
district=(root/'apps/web/app/explore-india/[region]/district/[district]/page.tsx').read_text()
migration=(root/'supabase/migrations/202611020022_regional_district_associations_search.sql').read_text()
css=(root/'apps/web/app/globals.css').read_text()
food_component=(root/'apps/web/components/district-food-discovery.tsx').read_text()
checks={
 'state_page_reads_approved_districts':"eq('publication_status', 'approved')" in state,
 'state_page_scopes_districts_to_region':"eq('region_id', slug)" in state,
 'state_page_limits_district_results':'.limit(200)' in state,
 'state_page_has_database_unconfigured_state':'!configured' in state and 'Regional stories and product collections are being prepared for publication.' in state,
 'state_page_has_database_error_state':'loadError' in state and 'Some regional details are temporarily unavailable.' in state,
 'state_page_has_empty_state':'being prepared' in state,
 'state_page_renders_district_navigation':'/explore-india/${slug}/district/${encodeURIComponent(district.slug)}' in state,
 'district_page_validates_region': 'if (!region) notFound();' in district,
 'district_page_requires_approved_district':"eq('publication_status', 'approved')" in district,
 'district_page_scopes_district_slug':"eq('slug', districtSlug)" in district,
 'district_page_requires_approved_associations':"eq('review_status', 'approved')" in district,
 'district_page_limits_associations':'.limit(100)' in district,
 'district_page_uses_relationship_labels':'Traditionally associated' in district,
 'district_page_avoids_exclusivity_claim':'does not imply exclusive origin' in district,
 'district_page_links_published_product_detail':'/shop/${encodeURIComponent(food.slug)}' in food_component,
 'district_page_handles_no_associations':'approved food collection is being prepared' in district and 'approved food records currently published' in district,
 'district_page_has_connection_error_state':'Some district details are temporarily unavailable.' in district,
 'migration_enforces_region_district_match':'validate_product_regional_association_district' in migration,
 'migration_requires_evidence_reference':'evidence_reference text not null' in migration,
 'migration_public_associations_require_published_products':"p.approval_status='approved' and p.published_at is not null" in migration,
 'district_list_has_responsive_grid':'.district-list{' in css and 'auto-fit' in css,
 'district_food_cards_have_responsive_grid':'.district-food-list{' in css and 'auto-fit' in css,
}
passed=sum(checks.values());result={'suite':'phase3_district_discovery','passed':passed,'total':len(checks),'checks':checks}
out=root/'qa/phase3_district_discovery_static_results.json';out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed!=len(checks):raise SystemExit(1)
