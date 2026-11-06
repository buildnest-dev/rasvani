# Phase 3 — Evidence-reviewed district discovery

## Implemented

- State/UT pages query only approved district records scoped to the canonical region slug.
- District links are generated only from approved records; unpublished or draft districts are not exposed.
- District detail pages require an approved district in the requested region.
- District food collections include only approved product-to-district associations. Product rows are joined through the product relation and are subject to the association policy that requires the related product to be approved and published.
- Relationship labels distinguish `origin_claim`, `produced_in`, `traditionally_associated_with`, and `popular_in`. Copy explicitly avoids implying exclusivity.
- Empty, unconfigured and database-error states are handled without fabricating districts, foods, producers or availability.
- Responsive district list and collection layouts are included.

## Data and review controls

Migration `202611020022_regional_district_associations_search.sql` adds evidence-referenced districts, product/region/district associations and locale-aware product search terms. It enforces region/district consistency, role-gated draft save and submission, independent reviewer decisions and audit log entries. Approved public reads are constrained by RLS. No district or food-origin seed records are invented.

## Not yet implemented / not claimed

- District editorial introductions and food stories require fact-checked content and permissions.
- Locale-aware product-term and active-category search are now wired into `/explore-india` and `/shop`; see `docs/PHASE_3_REGIONAL_SEARCH.md`. Occasion-specific discovery remains pending verified occasion taxonomy/content.
- No interactive map is included pending provider and boundary-data licensing/cost decisions.
- Live database policies, joins, migrations and route rendering have not been tested against a configured Supabase project.

## Verification

`qa/phase3_district_discovery_checks.py`: 22/22 static source checks passed. Static checks do not replace database execution or browser testing.
