from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page = (root / 'apps/web/app/explore-india/page.tsx').read_text()
component = (root / 'apps/web/components/regional-search-results.tsx').read_text()
shop = (root / 'apps/web/app/shop/page.tsx').read_text()
migration = (root / 'supabase/migrations/202611020022_regional_district_associations_search.sql').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'explore_page_supports_search_query': 'searchParams: Promise<{ q?: string }>' in page,
    'explore_page_has_server_search_form': 'action="/explore-india"' in (root / 'apps/web/components/explore-india-experience.tsx').read_text() and 'name="q"' in (root / 'apps/web/components/explore-india-experience.tsx').read_text(),
    'explore_page_links_search_results_component': '<RegionalSearchResults query={query}/>' in page,
    'explore_page_discloses_supported_12_locales': all(x in component for x in ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Punjabi', 'Kannada', 'Malayalam', 'Odia', 'Assamese']),
    'search_component_normalizes_unicode': "normalize('NFC')" in component,
    'search_component_bounds_query_length': 'slice(0, 80)' in component,
    'search_component_requires_two_characters': 'term.length < 2' in component,
    'search_component_uses_literal_pattern_sanitization': "replace(/[\\\\%_(),.*]/g, ' ')" in component,
    'search_component_matches_canonical_regions': 'regions.filter(' in component,
    'search_component_reads_approved_districts': "from('districts').select('id,region_id,name,slug').eq('publication_status', 'approved')" in component,
    'search_component_reads_approved_localized_terms': "from('product_search_terms').select('product_id,term,locale,term_type').eq('review_status', 'approved')" in component,
    'search_component_matches_normalized_terms': "ilike('normalized_term', pattern)" in component,
    'search_component_reads_active_categories_only': "from('categories').select('id,name').eq('active', true)" in component,
    'search_component_reads_published_products_only': "eq('approval_status', 'approved').not('published_at', 'is', null)" in component,
    'search_component_reads_approved_associations_only': "from('product_regional_associations').select('product_id,region_id,district_id,association_type').eq('review_status', 'approved')" in component,
    'search_component_limits_product_results': "slice(0, 100)" in component and ".limit(100)" in component,
    'search_component_links_to_shop_detail': '/shop/${encodeURIComponent(product.slug)}' in component,
    'search_component_links_to_district_pages': '/district/${encodeURIComponent(district.slug)}' in component,
    'search_component_shows_alias_locale': 'localeNames[alias.locale]' in component,
    'search_component_labels_nonexclusive_relationships': 'relationNames[item.association_type]' in component,
    'search_component_has_unconfigured_state': '!configured' in component and 'State and Union Territory matches are available below' in component,
    'search_component_has_load_error_state': 'loadError' in component and 'Some regional results are temporarily unavailable' in component,
    'search_component_has_no_results_state': 'No approved regional foods or places match this search yet' in component,
    'shop_search_uses_approved_search_terms': "from('product_search_terms').select('product_id').eq('review_status', 'approved')" in shop,
    'shop_search_uses_normalized_search_term': "ilike('normalized_term', `%${safeTerm}%`)" in shop,
    'shop_search_aliases_require_approved_published_products': "eq('approval_status', 'approved').not('published_at', 'is', null).in('id', aliasIds)" in shop,
    'shop_search_preserves_category_filter_for_aliases': 'aliasProductsQuery.eq(\'category_id\', category)' in shop,
    'migration_has_12_reviewed_locales': all(f"'{x}'" in migration for x in ['en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as']),
    'migration_public_search_policy_requires_approved_term_and_published_product': "review_status='approved'\n  and exists (select 1 from public.products p where p.id=product_search_terms.product_id and p.approval_status='approved' and p.published_at is not null)" in migration,
    'migration_requires_evidence_for_search_term': 'evidence_reference text not null' in migration,
    'search_controls_have_responsive_layout': '.regional-global-search-row' in css and '@media(max-width:620px)' in css,
}
passed = sum(checks.values())
result = {'suite': 'phase3_regional_search', 'passed': passed, 'total': len(checks), 'checks': checks}
out = root / 'qa/phase3_regional_search_static_results.json'
out.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': passed, 'total': len(checks), 'failed': [k for k, v in checks.items() if not v]}, indent=2))
if passed != len(checks):
    raise SystemExit(1)
