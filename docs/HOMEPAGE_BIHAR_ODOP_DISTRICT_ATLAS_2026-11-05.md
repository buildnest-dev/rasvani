> SUPERSEDED — This was an intermediate ODOP gallery iteration. Its extra ODOP card data and spotlight are not part of the current site. The active food scope is limited to foods already present in the original uploaded ZIP plus the exact vegetarian dry-snack list in DOC-20261105-WA0005.pdf.

> Superseded for the homepage snack catalogue by `HOMEPAGE_BIHAR_EXACT_DRY_SNACK_ATLAS_2026-11-05.md`. The ODOP dataset remains separate reference information.

# Homepage Bihar district ODOP atlas and India map completion — 5 November 2026

## Scope completed

This increment is limited to the two requested areas: (1) the dedicated interactive India map and (2) the homepage district-wise Bihar food/agro-product collection.

### Homepage: 38 Bihar district entries

- Added a searchable, category-filterable gallery with one card for each of Bihar's 38 districts.
- The displayed focus item follows the Ministry of Food Processing Industries' PIB annexure dated 19 December 2023 for the PMFME One District One Product (ODOP) programme. The PIB source lists 38 Bihar districts and their respective ODOP entries.
- Each card has an image path, alt text, district number, product focus, category and a link to that district's Bihar guide.
- 26 distinct AI-generated food/agro-product illustrations are used across the 38 cards. Repeated official ODOP focus items (for example makhana, litchi, tomato, rice-based products and pulses) use the matching category image rather than suggesting that every district has a different product.
- Added the same ODOP focus item to the relevant district page, including the separately rendered Siwan page, so homepage links have a contextual landing point.
- Added an explicit notice that ODOP focus is not evidence of an exclusive traditional origin, a Rasvani-approved producer, a product SKU, stock or permission to sell.
- Added a visible note that the imagery is AI-generated illustration, not documentary product/packaging photography. Actual product listing still requires exact real product photos, label information, producer and product approval.

### India map

- Preserved the dedicated `/india-map` experience and the separate homepage/map relationship.
- Kept the 36-region selector: 28 States and 8 Union Territories.
- Added state/UT camera presets for list-selected regions so district view opens around the selected region even when the user selects it from the text index instead of clicking its map polygon.
- Added a searchable district index populated from district features currently loaded by the selected region's PMTiles boundary source. Bihar retains its static 38-name navigation list as a fallback.
- A selected Bihar district now shows its ODOP focus item and an evidence/context note before linking to its district guide.
- Added district-name aliases for known Bihar tile-name variants (`Kaimur`, `Purba/Purbi Champaran`, `Pashchim/Pashchimi Champaran`) to align map selection with the canonical Bihar district routes.
- Added a boundary date disclosure. The loaded Bharatlas geometry is an LGD 2024 snapshot, not the current live LGD district master.

## Source and data limitations

The PIB release states that ODOP selections were approved for 713 districts in 35 States/UTs at the time and that additional products can be added from time to time. Therefore the homepage accurately describes these records as the **19 December 2023 PIB annexure selections**, not as a live 2026 ODOP register. Reconfirm the current Bihar ODOP list with the Ministry/State before production launch.

The existing Bharatlas district boundary layer contains 785 polygons from an LGD 2024 snapshot. The LGD district resource page is updated monthly (the OGD resource reported an update on 27 October 2026), and the earlier LGD portal audit recorded a 790-district dashboard total. The current geometry and current district master do not reconcile. Do not call the 785-polygon boundary snapshot a current 790-district map. It remains an explicitly dated visual/navigation layer until current district-code records and geometry are reconciled.

The non-Bihar district index is populated from vector features currently loaded in the selected map viewport. It is not a substitute for importing a complete, current, official LGD district-name master with LGD codes and provenance. The official LGD/OGD register and current boundaries still require a dated import and code-level reconciliation before production sign-off.

The new district cards do not change `districts.publication_status`, product regional association approval, vegetarian classification review, producer status, stock, or checkout eligibility. Research leads remain editorial leads until evidence and review are complete.

## Files added/updated

- `apps/web/lib/bihar-odop.ts`
- `apps/web/components/bihar-odop-spotlight.tsx`
- `apps/web/components/home-experience.tsx`
- `apps/web/components/india-map-experience.tsx`
- `apps/web/components/india-boundary-map.tsx`
- `apps/web/app/explore-india/[region]/district/[district]/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/public/images/odop-*.webp`
- `qa/homepage_bihar_exact_dry_snacks_and_full_map_checks.py` (current scope-cleanup suite; this ODOP implementation is superseded)
- `qa/homepage_bihar_exact_dry_snacks_and_full_map_static_results.json`

## Verification

- Focused ODOP/map static suite: 22/22 checks passed.
- Previous homepage/map regression suite: 23/23 checks passed after updating one stale assertion to the new searchable district index.
- District discovery suite: 22/22 checks passed.
- District-guide content suite: 17/17 checks passed.
- Siwan food/image/3D regression suite: 22/22 checks passed.
- TypeScript transpile-only syntax checks for the six changed TS/TSX files: zero syntax diagnostics.
- Full `npm run typecheck` was attempted but cannot be treated as a valid semantic check because this uploaded project snapshot has no `node_modules` and no npm lockfile. The errors include missing `next`, `react`, `zod`, Supabase and Node type packages, followed by cascading JSX/type errors.
- Full Next.js production build, live browser/map-network verification and visual device QA remain pending dependency installation.
