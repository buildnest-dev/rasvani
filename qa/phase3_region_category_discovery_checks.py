from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
page=(root/"apps/web/app/explore-india/[region]/page.tsx").read_text()
shop=(root/"apps/web/app/shop/page.tsx").read_text()
css=(root/"apps/web/app/globals.css").read_text()
docs=(root/"docs/PHASE_3_REGION_CATEGORY_DISCOVERY.md").read_text()
checks={
 "regional_product_query_uses_approved_associations":"eq('review_status', 'approved')" in page and ".is('district_id', null)" in page,
 "product_category_id_is_read_with_association":"category_id" in page and "products!inner(id,name,slug,description,category_id,dietary_classification,dietary_review_status)" in page,
 "categories_are_limited_to_associated_ids":".in('id', associatedCategoryIds)" in page,
 "only_active_categories_are_used":".eq('active', true)" in page,
 "category_order_is_stable":".order('name')" in page,
 "no_categories_are_seeded":"regionalCategoryCounts.length > 0" in page and "regionalCategoryCounts.map" in page,
 "category_count_uses_unique_product_ids":"new Set(associations.filter" in page and "item.products?.id" in page,
 "category_links_target_shop_filter":"/shop?category=${encodeURIComponent(category.id)}" in page,
 "shop_consumes_category_filter":"params.category" in shop and "query.eq('category_id', category)" in shop,
 "category_labels_are_shown_on_region_food_cards":"regionalCategoryNames.get(item.products.category_id ?? '')" in page,
 "association_relationship_labels_are_preserved":"relationLabels[item.association_type]" in page,
 "category_navigation_has_accessible_heading":"aria-labelledby=\"region-category-heading\"" in page and "id=\"region-category-heading\"" in page,
 "empty_regional_category_section_is_omitted":"{regionalCategoryCounts.length > 0 && <section" in page,
 "responsive_category_grid_exists":".region-category-list{display:grid" in css and "@media(max-width:720px){.region-category-list" in css,
 "keyboard_focus_is_visible":".region-category-list a:focus-visible" in css,
 "documentation_states_publication_guardrails":"approved" in docs.lower() and "not imply" in docs.lower(),
}
passed=sum(checks.values()); result={"suite":"phase3_region_category_discovery","passed":passed,"total":len(checks),"checks":checks}
(root/"qa/phase3_region_category_discovery_static_results.json").write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({"passed":passed,"total":len(checks),"failed":[k for k,v in checks.items() if not v]},indent=2))
if passed != len(checks): raise SystemExit(1)
