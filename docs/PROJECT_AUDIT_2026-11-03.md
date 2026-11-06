# Rasvani complete project audit — 3 November 2026

## Scope and evidence

Audited the governing 29-page `Rasvani_Ultimate_Phase_by_Phase_Website_Build_Prompt.pdf`, the latest available complete source archive, its App Router pages/components, 43 ordered Supabase migrations, project documentation, QA scripts and both supplied reference videos.

The 251.98-second screen recording was visually inspected across its full timeline using one-second frame sampling. It contains an audio stream; spoken/audio content was not transcribed in this environment. The 29.18-second food-focused clip was also visually inspected across its full timeline. Video-derived observations are therefore visual only.

The latest full source archive was extracted into a separate working copy. The original archive was not modified. The project archive does not include Git metadata or installed `node_modules`; the separately uploaded root lockfile is an empty/incomplete lockfile and is not a substitute for the project dependency lock.

## Governing requirements audit

| PDF section / requirement | Existing source finding | Status / release condition |
|---|---|---|
| 1. Vision, purpose and audiences | Rasvani regional-food discovery, B2C, B2B and producer partnership framing exists in the public pages and architecture. | Partial; real products, producers and customer journeys are not live. |
| 2. Brand identity and UI system | Warm cream, maroon, terracotta, forest green and gold palette; serif/editorial design; responsive components and motion classes exist. | Partial; visual consistency, contrast and browser/device review remain. |
| 2.4 Image authenticity | Approved product media uses a separate review/private-storage flow. Decorative food artwork exists. | Partial; real product pack photos, producer portraits, usage-rights metadata and district-specific approved images remain incomplete. |
| 3. Sitemap and navigation | Home, Shop, product details, Explore India, state/district routes, India Map, Food Stories, Better Choices, producer, B2B, account, admin, editorial and warehouse routes exist. | Partial; Our Story, Contact, full support/legal pages, recipes, vlog and memory-story experiences are incomplete or absent. |
| 4. Homepage | Premium hero, search, featured themes, stories, producer section, Better Choices and lower Explore India preview exist. | Partial; visual/browser review pending. Full map was incorrectly embedded and has now been removed. |
| 4.2 India discovery | 36-region selector and a separate `/india-map` route exist; MapLibre/PMTiles loads vector boundaries. | Partial; 2024 boundary archive is stale versus current LGD count; full district index and content not populated. |
| 4.3 State/district templates | Server-rendered region/district routes, approved guide copy, approved associations and product-media gating exist. Bihar has 38 navigation entries. | Partial; other-state district taxonomy is incomplete in local index; no verified food records are seeded. |
| 5. Shop and product catalogue | Approved/published product queries, active category filters, approved product media and product details exist. | Partial; no complete live catalogue, variants, pack selection, prices, stock or purchase flow. |
| 5.2 Product detail | Ingredients, allergens, storage, approved images and reviewed regional relationship labels are supported. | Partial; actual packaging/back-label gallery, nutrition, manufacturer/legal label data and full product facts depend on approved records. |
| 6. Better Choices | Dedicated page and claim evidence/review governance exist. | Partial; verified product claims and complete nutrition/ingredient records are not populated. |
| 7. Producer Verified Programme | Producer application, facility/product submission, review and approval separation exist. | Partial; document collection, inspection/testing evidence, sample chain of custody, lab workflow and ongoing monitoring require operational completion. |
| 8. Quality and traceability | Batch/lot, receiving, inspection, expiry, FEFO/FIFO, stock reservations, recall, movement ledger and physical stock-count workflows exist in source/migrations. | Partial; database/RLS execution and live operational testing are not verified. Customer recall notification case management remains incomplete. |
| 9. Our Story, heritage, makers, recipes and vlogs | Food Stories editorial page and protected CMS/translation workspace exist. | Partial/missing; genuine founder story, recipe library, maker interviews, actual vlogs, captions, consent and user-submitted food-memory workflow are not complete. |
| 10. B2B / wholesale / distributors | Business registration, enquiry, quote and admin review foundation exists. | Partial; verified trade accounts, protected trade price lists, MOQ/case pack/volume tiers, invoices, downloads and full distributor workflow remain. |
| 11. Customer account | Sign-in, registration, sign-out and customer order history foundations exist. | Partial; password recovery, MFA, saved addresses, wishlist, support/complaints and complete tracking remain. |
| 11.2 Cart/checkout/payments | Order and reservation schema/actions exist. | Missing as customer-facing purchase journey; no shared cart, checkout, gateway, tax, payment reconciliation or transactional notifications are configured. |
| 11.3 Shipping | Warehouse/fulfilment data foundation exists. | Missing integration; no pincode serviceability, carrier rates, labels/AWB, tracking webhooks or shipment exception flow. |
| 12. Admin dashboard | Protected aggregate dashboard, catalogue review, regional review, editorial, translation, producer, B2B and warehouse workspaces exist. | Partial; complete order/customer/complaint/promotions/reporting workflows and bulk CSV/Excel import/export remain. |
| 13. Twelve languages | Selector and locale persistence for English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Odia and Assamese exist. | Partial; initial dictionaries cover shared navigation and selected public pages only. Full reviewed localisation through product, legal, account, checkout and transactional content is outstanding. |
| 14. Architecture and integrations | Next.js/React/TypeScript + Supabase schema/migrations, server-side role guard and private storage patterns exist. | Partial; dependency install, full build, database deployment, payment/shipping/email/analytics providers and production hosting are not configured. |
| 15. Motion and accessibility | Mouse-only bounded navigation tilt, reduced-motion handling, focus styling, responsive CSS and map keyboard/list alternatives exist. | Partial; broader component-specific 3D motion, keyboard/screen-reader checks and physical-device tests remain. |
| 16. SEO, performance, security, legal/food trust | Some metadata, access control, RLS design, private media and role checks exist. | Partial; full canonical/hreflang/sitemap/structured data audit, LCP/INP/CLS measurement, security/penetration, backup/restore and legal/FSSAI review remain. |
| 17. Analytics and reporting | Aggregate operations reporting exists; analytics provider is disabled/unselected. | Partial; consent-aware GA4/Search Console or alternative analytics not configured. |
| 18. Phased roadmap | Phase 0–12 documentation and multiple phase increments exist. | Not release-complete; Phase 0 open decisions and Phase 11 release gates remain. |
| 19–20. Acceptance and handover | QA scripts, deployment guide, migration sequence and project documentation exist. | Partial; no verified production deployment, final QA sign-off, staff training, operational SOP package or final complete handover. |

## Corrected information architecture

The approved structure is:

1. `/` — premium homepage with hero, search, food visuals, featured regional themes, stories, producer section, Better Choices and a lower Explore India preview.
2. `/india-map` — complete interactive State/UT → District → verified vegetarian food journey.
3. `/explore-india` — separate regional directory, search and editorial discovery experience.

The shared header links to both dedicated discovery routes. The homepage's full embedded `IndiaMapExperience` has been removed. The dedicated map component and route remain intact.

## India district and map data audit

- `lib/regions.ts` contains 36 canonical region names (28 States and 8 UTs).
- `lib/bihar-districts.ts` contains 38 Bihar district navigation names only.
- Existing map geometry is a 2024 LGD snapshot via Bharatlas PMTiles, described by the codebase as 785 district polygons.
- The Government of India LGD portal reported 790 districts across 36 States/UTs on 3 November 2026. The current administrative count therefore does not reconcile to the 2024 geometry archive.
- The regional `districts` table is evidence/review oriented and the migration intentionally seeds no district or food examples.
- Verified district vegetarian-food content is not populated. The system correctly keeps unapproved food associations and products out of public collections.

See `docs/INDIA_DISTRICT_DATA_AUDIT_2026-11-03.md`. Do not call India-wide district coverage complete until the latest dated official district master and matching current licensed boundary geometry have been reconciled by LGD codes.

## Reference-video observations

Visual inspection of the 252-second screen recording identified prior issues around map loading, Bihar district navigation, empty shop state, producer application error handling, partial language translation and editorial image presentation. Some source-level remediations exist. The clip also shows the desired editorial direction: warm cream, refined serif typography, cinematic food visuals, dark green feature panels and varied editorial layouts. The shorter 29-second clip is a food-visual reference, not a complete specification for website menu animation behaviour.

## Fresh verification snapshot after the current continuation changes

| Check | Result | Scope |
|---|---:|---|
| Homepage/map separation checks | 23/23 | Static source checks |
| Navigation motion checks | 23/23 | Static source checks |
| Premium editorial asset checks | 15/15 | Asset existence, format, dimensions and source wiring |
| TypeScript/TSX syntax transpilation | 60 files, 0 syntax errors | Syntax only; not semantic typechecking |
| Legacy Phase 1 prototype browser QA | Passed | Prototype only, not current Next.js app |
| All current `*_checks.py` scripts | 53/53 passed | Static source scripts only |
| Consolidated registered QA report | 885/885 across 50 suites | Static source checks only |
| `npm install` | Blocked | npm registry DNS resolution timed out (`EAI_AGAIN` observed in the prior project record; current install attempt timed out) |
| Next.js build / semantic typecheck / ESLint | Not run successfully | Dependencies are not installed |
| Current Next.js app browser test | Not run | App cannot be launched without dependencies |
| Live Supabase/PostgreSQL/RLS | Not run | No owner-controlled development project is connected |
| Payment/shipping end-to-end | Not run | Providers and business decisions are not configured |

The earlier 884/884 static QA figure is a historical snapshot. The current continuation rerun passes all 53 Python source-check scripts, and the rebuilt registered report passes 885/885 checks across 50 suites. These checks do not prove runtime functionality.

## Changes made in this continuation working copy

1. Removed the full interactive map from the homepage while preserving the dedicated `/india-map` and `/explore-india` experiences.
2. Replaced the homepage live-map QA expectations with checks for the approved three-page structure.
3. Improved navigation motion: bounded pointer tilt, pointer-follow highlight, reset on leave, and motion on the account action and mobile menu trigger.
4. Added four high-resolution WebP editorial visuals and updated homepage, Food Stories, For Producers and Explore India image placements. These visuals are decorative only, not product/producer/origin evidence.
5. Added evidence-gated state/UT category discovery, unique approved-product counts and non-exclusive relationship disclosures.
6. Added the official LGD district-count discrepancy audit and updated project documentation.

## Current release blockers

- Reconcile the latest official LGD district master and obtain matching current licensed boundary geometry.
- Populate evidence-reviewed district/food content; no fabricated food or district associations.
- Complete all 12-language content review.
- Complete actual cart, checkout, payments, shipping and customer support workflows.
- Complete producer inspection/sample/lab operational workflows and admin bulk import/export.
- Install dependencies and pass Next.js build, semantic typecheck, lint and current-app browser/device tests.
- Execute Supabase migrations/RLS tests in a disposable development project, then complete security, accessibility, performance, legal/food-safety and launch acceptance.
