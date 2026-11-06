# Rasvani visual redesign — 3 November 2026

## Design direction

**The Living Pantry of India** — a visual identity distinct from the supplied reference board. The board is treated as general visual inspiration only; its RASO identity, layouts, product names and visual compositions are not copied.

The redesign uses the existing Rasvani brand palette:

- Warm cream `#F6EBDD`
- Deep maroon `#5A1F24`
- Terracotta `#A64F2B`
- Forest green `#263D32`
- Harvest gold `#D6A44D`

The visual system combines editorial food imagery, warm cartographic textures, restrained 3D depth, fine linework, rounded but not card-template-heavy components, and elegant Playfair Display / DM Sans typography with system fallbacks. Motion respects `prefers-reduced-motion`, and map selection controls are keyboard-focusable.

## Page inventory

### Homepage (`/`)

1. Global language-aware site header.
2. Top-level search form submitting to `/explore-india?q=...` (the existing reviewed regional search route).
3. Brand hero: “India, Served by Region.” with original AI-generated illustrative vegetarian feast artwork (WebP-optimised for delivery).
4. Interactive India Map preview linking to `/india-map`.
5. Featured editorial panels for ingredients, everyday foodways and craft, using distinct original AI-generated pantry, savoury-snack and sweet-assortment visuals; these are illustrative themes, not asserted district dishes or verified regional facts.
6. Producer partnership section linking to the existing producer application flow; no producer identities are fabricated.
7. Better Choices / transparency section linking to `/better-choices`.
8. Separate Explore India feature linking to `/explore-india`.

### Dedicated Interactive India Map (`/india-map`)

The map journey is implemented on one route and in one client experience:

`India → State / Union Territory → District → Traditional Vegetarian Food Collection`

- All 28 States and 8 Union Territories are loaded from the canonical existing `lib/regions.ts` list.
- Region points and region-index buttons support mouse hover, keyboard focus and click selection.
- Selecting a region opens its district stage without navigating to a different page.
- Bihar displays 38 district navigation records. Names were cross-checked against the Government of Bihar district directory and the Government of India's Integrated Government Online Directory.
- Other States / UTs display a clear pending state until district records pass the same verification and publication process.
- Selecting a Bihar district opens the vegetarian-food collection stage inside the same route. The collection is explicitly marked as pending because no approved district/food/product records were present in the current project baseline.
- The district-stage artwork is AI-generated and labelled illustrative. It is not represented as the dish, product, producer or origin of the selected district. District-specific creative assets are deliberately deferred until the corresponding vegetarian food associations are verified.
- A real product link, where relevant, uses the existing `/shop` regional filter. The live catalogue remains the source of truth; empty/unapproved results are not replaced with sample products.

### Geographic map source and boundary dependency

The interactive map now uses MapLibre GL with PMTiles vector archives from Bharatlas, based on the 2024 Local Government Directory (LGD) snapshot. State/UT polygons use the `State_LGD` identifier; district features are filtered by that state identifier when available. The state and district archive metadata supplies region-name fields for hover labels and click selection. The UI includes all 36 canonical regions and a complete state/UT index fallback if the external boundary service is unavailable.

Bharatlas documents the 2024 LGD boundary release as 36 state/UT polygons and 785 district polygons, with the distributed data licensed under CC0-1.0 / CC-BY-4.0. The map displays dataset attribution in the interface. This is a 2024 snapshot, not a claim that the geometry is the latest current delimitation. Before production, the project owner must validate against the latest LGD release, approve the selected boundary source/licence, and define update ownership and cadence under open Phase 0 decision D18.

Source references:
- Bharatlas dataset catalogue: https://bharatlas.com/ — 2024 LGD states/districts and data licensing.
- Bharatlas documentation: https://bharatlas.com/docs — state/district feature metadata and MapLibre/PMTiles integration details.
- Government of India Integrated Government Online Directory: https://igod.gov.in/sg/BR/E042/organizations — Bihar district directory cross-check.
- Government of Bihar district index: https://www.bvm.bihar.gov.in/district/

Map boundary requests require internet access. The UI keeps a navigable 36-region index when remote vector tiles or glyph requests fail. The map source must still be tested in the user's browser and revalidated before production.

## Separate Explore India page (`/explore-india`)

- Independent editorial destination; it is not merged into the map page.
- Premium editorial hero and illustration.
- Search form calls the existing regional search/results path, including evidence-reviewed aliases, reviewed regional spellings and approved catalogue records.
- Canonical 36-region directory remains integrated, with region links and existing state/UT detail routes.
- Regional detail routes continue to show only approved districts, guides, product associations and categories.
- Editorial bridge links into Food Stories and the separate Interactive India Map.

## Additional public page design

- `/food-stories`: editorial journal with ingredients, traditions and people pillars; no invented interviews, recipes, producer names or historical claims.
- `/for-producers`: partnership explanation and existing producer application link; separate facility and product review gates retained.
- `/better-choices`: transparency information page covering ingredients/allergens, regional relationship labels, batch/shelf-life and producer/product review. It explicitly avoids unsupported “organic”, “preservative-free”, medical suitability and similar general claims.
- `/shop` and `/shop/[slug]`: existing server-backed catalogue and product detail routes remain in place and inherit the new visual system. Only published/approved products and approved product media may appear. Catalogue and product media now have distinct hover depth/tilt treatments. Public prices, live stock, pack-size selection, add-to-cart, cart and payment are not enabled in this codebase yet; no decorative purchase controls were added.
- Existing account, producer, B2B, editorial, admin and warehouse routes are preserved. The shared shell applies the new visual language without removing existing role restrictions.

## Multilingual interface

The global language selector supports the 12 requested locales: English (`en`), Hindi (`hi`), Bengali (`bn`), Tamil (`ta`), Telugu (`te`), Marathi (`mr`), Gujarati (`gu`), Punjabi (`pa`), Kannada (`kn`), Malayalam (`ml`), Odia (`or`) and Assamese (`as`). The selected locale persists in browser local storage and updates the document language. Primary shared navigation, homepage, India Map and Explore India interface labels have initial locale dictionaries.

This is an initial interface-localisation layer, not completion of the entire multilingual programme. Product content, editorial content, legal/help text, all remaining account/portal/internal pages, and checkout strings still need professionally reviewed locale content. The existing translation workspace and locale-aware reviewed search design remain authoritative. Machine-generated regional names, dish translations and food-origin claims are not automatically published.

## Commerce and fulfilment boundaries retained

The redesign does not change the confirmed primary fulfilment model: Producer → Rasvani warehouse / collection centre → Customer. The new public pages do not bypass product approval, inventory batch/expiry controls, producer/facility review, seller-of-record decisions, pricing/tax settings, shipping configuration, returns/refunds, settlements or payment-gateway configuration. Public shopping flows must be completed against the approved product and stock model before any real purchase controls are enabled.

## Original project baseline

This visual redesign is an addition to the existing project, not a replacement for the 29-page governing PDF or Master Specification v3.0. Both source documents are retained unchanged in `docs/`. Existing Phase 0 requirements, warehouse controls, producer governance, commerce foundations, 12-language plan and remaining phase backlog remain in force.

## Verification

- Visual redesign static source checks: `qa/phase1_visual_redesign_checks.py` (48/48 pass).
- Consolidated registered static QA summary: 833/833 checks across 48 suites (`qa/static_qa_summary.json`).
- TypeScript syntax transpilation: 60 implementation `.ts` / `.tsx` files; 0 syntax diagnostics. This checks syntax only, not semantic typechecking.
- Dependency installation, Next.js production build, ESLint, browser rendering of MapLibre/PMTiles, responsive-device QA, keyboard/screen-reader audit, live Supabase execution, cart/checkout/payment integration, and production boundary validation remain NOT RUN in this sandbox.
- The user should update the app dependencies from this build before running locally. Use Node.js 20.19 or newer; the user's earlier Node.js 20.18.0 produced engine warnings during dependency installation.


## Premium editorial image update — 3 November 2026

Four retained high-resolution Rasvani editorial visuals have been converted to WebP and added under `apps/web/public/images/rasvani-editorial-*.webp`. They now support the homepage hero, featured food themes, Food Stories, For Producers and Explore India visual presentation. These are general decorative/editorial food visuals only; they are not exact product pack photographs, verified producer photographs, district-specific evidence or proof of origin. Actual product detail images continue to come only from the approved product-media workflow. See `docs/PHASE_1_IMAGE_ASSET_REGISTER.md`.
