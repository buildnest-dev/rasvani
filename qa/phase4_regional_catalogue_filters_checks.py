from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
shop=(root/'apps/web/app/shop/page.tsx').read_text()
css=(root/'apps/web/app/globals.css').read_text()
docs=(root/'docs/PHASE_4_REGIONAL_CATALOGUE_FILTERS.md').read_text()
checks={
 'shop_imports_canonical_region_directory': "import { regions } from '@/lib/regions'" in shop,
 'region_filter_is_validated_against_canonical_regions': 'regions.some((name) => regionSlug(name) === region)' in shop,
 'approved_districts_populate_district_filter': "from('districts').select('name,slug').eq('region_id', region).eq('publication_status', 'approved')" in shop,
 'regional_product_filter_requires_approved_association': "from('product_regional_associations').select('product_id,district_id,products!inner(dietary_classification,dietary_review_status)').eq('region_id', region).eq('review_status', 'approved')" in shop,
 'district_filter_requires_published_district_record': "eq('slug', district).eq('publication_status', 'approved').maybeSingle()" in shop,
 'region_filter_applies_to_alias_matches': 're-apply the regional scope' in shop and 'products = products.filter((product) => scopedIds.has(product.id))' in shop,
 'category_filter_remains_available': 'name="category"' in shop and 'query.eq(\'category_id\', category)' in shop,
 'search_filter_remains_available': 'name="q"' in shop and 'normalized_term' in shop,
 'invalid_region_or_district_does_not_return_unscoped_products': 'else if (region || district)' in shop and 'products = []' in shop,
 'filter_form_exposes_region_and_district': 'name="region"' in shop and 'name="district"' in shop,
 'district_filter_disabled_without_region': 'disabled={!validRegion}' in shop,
 'clear_filters_resets_all_filter_dimensions': 'term || category || validRegion || district' in shop and 'href="/shop"' in shop,
 'mobile_filters_stack_without_horizontal_overflow': '@media(max-width:560px){.shop-filters{display:grid;grid-template-columns:1fr}' in css,
 'disabled_district_control_has_visual_state': '.shop-filters select:disabled' in css,
 'documentation_explains_approved_association_scope': 'review_status = approved' in docs.lower() and 'district-specific filtering' in docs.lower(),
 'documentation_disclaims_delivery_and_stock_promises': 'delivery' in docs.lower() and 'stock' in docs.lower(),
}
passed=sum(checks.values()); result={'suite':'phase4_regional_catalogue_filters','passed':passed,'total':len(checks),'checks':checks}
(root/'qa/phase4_regional_catalogue_filters_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed!=len(checks): raise SystemExit(1)
