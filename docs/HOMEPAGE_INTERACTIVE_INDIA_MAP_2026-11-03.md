# Rasvani homepage interactive India map update — 3 November 2026

## Scope — corrected page separation

The complete interactive India Map belongs exclusively on the dedicated `/india-map` route. The homepage must not embed the full map, district map, or the complete State → District → Food interaction. The homepage retains a prominent hero link to `/india-map` and a separate editorial Explore India preview lower on the page that links to `/explore-india`.

The three experiences remain distinct:

1. `/` — premium homepage, food-led storytelling and a compact Explore India preview.
2. `/india-map` — complete India → State/UT → District → Vegetarian Food journey.
3. `/explore-india` — independent regional directory, reviewed search and editorial discovery.

## Homepage hierarchy

1. Global navigation and 12-language selector.
2. Prominent search band.
3. Circular food-image hero and brand introduction, with a CTA to the dedicated India Map.
4. Featured regional collections.
5. Regional food stories.
6. Producer partnership section.
7. Better Choices section.
8. Separate Explore India destination preview and button near the lower part of the homepage.

## Region and district navigation

- The canonical region directory contains 28 States and 8 Union Territories.
- Map polygons and labels use the 2024 LGD snapshot exposed through Bharatlas PMTiles. This is a dated data snapshot, not a live boundary feed. Its provenance and attribution remain visible in the map UI.
- The region index is also available as directly selectable buttons, so map interaction is not the only way to navigate.
- Bihar has 38 district navigation records in the fallback index. These are navigation records only; they do not imply that a traditional food association has been approved for every district.
- Hovering a State/UT applies an animated map highlight and exposes the region name. Selecting a region advances to the district stage. Selecting a district advances to the food stage.
- The food stage remains unpublished/pending until a district-food association and matching product/media records pass review. The UI must not invent a dish name, origin, product, price, stock or matching image.

## Responsive and accessibility notes

- Bihar's district index follows the same responsive column reduction.
- Map controls and the region/district index remain separate navigation mechanisms.
- Motion is disabled or reduced under `prefers-reduced-motion` where applicable.

## Commerce and localisation boundaries

- The homepage's featured food cards are editorial collection links, not purchasable product cards, and therefore do not show decorative Add to Cart buttons.
- The current public catalogue does not yet expose a complete cart/checkout/payment journey. Real Add to Cart actions must only be added when approved product IDs, pack/price data, availability, customer cart persistence, stock reservation and checkout rules are connected.
- The 12-language selector remains available. Shared navigation, hero/search and map interface strings use reviewed locale dictionary entries where present; the site is not yet fully professionally translated in every content area.

## Validation

- `qa/phase1_homepage_live_map_checks.py` now checks that the complete map is not embedded on Home and that the dedicated route and lower homepage preview remain connected.
- `qa/video_review_regressions_checks.py`: 29/29 source checks passed.
- Consolidated static QA: 884/884 across 50 suites.
- TypeScript/TSX syntax transpilation: 60 files, zero syntax diagnostics.
- CSS brace balance: passed.

These are static source checks. They do not prove a Next.js production build, live MapLibre/PMTiles network rendering, Supabase integration, browser/device behaviour, actual checkout/payment or a formal accessibility audit.

## Owner correction — homepage map separation

The owner explicitly corrected the earlier homepage-embedded-map decision. The full interactive map must remain only on `/india-map`. The homepage is preview-only and links to the dedicated map and separate Explore India page. Any earlier statements in this document describing a full-width homepage map are superseded by this section.

## 5 November 2026 — state-label collision repair

The state/UT label layer previously disabled MapLibre collision handling, which caused overlapping/repeated labels in the supplied screenshot. It now uses one fixed label anchor per each of the 36 State/UT entries, separate from the boundary polygons, and restores collision detection with variable anchor placement, label padding and zoom-responsive text. The State/UT and district polygons remain the click/hover geometry; the complete regional index remains selectable even when a small region label is suppressed at the national overview. See `INDIA_MAP_LABEL_OVERLAP_REPAIR_2026-11-05.md` for implementation and QA details.
