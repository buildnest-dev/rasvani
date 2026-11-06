# Rasvani — deep source-to-implementation audit and page-wise gap register
**Audit date:** 3 November 2026  
**Baseline:** `Rasvani_Ultimate_Phase_by_Phase_Website_Build_Prompt` (29 pages; SHA-256 `5cdbdd0f84c572b6d451a9156247728f7bc62288db44003c38f24217006d7af1`)  
**Code snapshot:** `Rasvani_Continuation_Checkpoint_2026-11-03.zip` (408 archive entries; working copy only)  
**Scope:** PDF text and all 29 rendered pages; the two supplied reference images; the newly supplied 146.19-second screen recording sampled at 2 frames/second (292 visual samples); source tree, 24 Next.js routes, 8 shared TSX components, 43 Supabase migrations, assets, QA scripts and project documentation.

## Evidence rules and limitations

- A source implementation is not runtime proof. The current Next.js app could not be launched because dependencies are absent (`next: not found`). The attempted dependency installation did not complete. The current app therefore has **not** passed live browser/device testing.
- Static QA is evidence only for the assertions made by those scripts. Current checkpoint record: 53/53 Python check scripts pass; consolidated registered static report 885/885 across 50 suites; TypeScript/TSX transpilation 60 files / 0 syntax diagnostics. This is not semantic typechecking, a production build, integration testing, or browser testing.
- The archive contains no Git metadata or installed `node_modules`. The separately supplied root lockfile is incomplete and cannot reproduce a deterministic install.
- The new video contains an AAC audio stream. Its entire visual timeline was sampled at 0.5-second intervals. Audio/spoken content could not be transcribed in this environment, so no claim is made about its spoken instructions.
- PDF visual pages were rendered and reviewed as a 29-page contact-sheet set alongside extracted text. Small page text was cross-checked against extracted text; the page illustrations/tables were visually checked. The two reference images were inspected directly.
- The reference board says RASO. The PDF explicitly requires the live brand to say **Rasvani** and not RASO (PDF p.1 and p.5). Use layout mood and colour treatment only; do not copy its logo, name or exact composition.
- The political map image carries a third-party copyright notice and says “Map not to Scale”. It is a visual reference only, not a boundary dataset, not a source for current district counts, and not an asset to copy into the product. Use a current licensed geospatial source matched to official administrative codes.

## Status vocabulary

- **Implemented / static-checked:** code and a matching static QA assertion exist; runtime not implied.
- **Implemented / runtime unverified:** a source implementation exists, but dependencies/services/browser verification are unavailable.
- **Partial:** meaningful foundation exists; required workflow, data, content or integration is incomplete.
- **Missing:** no complete implementation found in the audited source snapshot.
- **Blocked / owner or external dependency:** requires a decision, provider, official data, evidence, credentials or professional approval.
- **Visual review pending:** code exists but cannot be honestly judged in the current live browser.

## A. Page-wise requirement checklist

| PDF page | Requirement / source content | Current code evidence and status | Remaining gap / acceptance evidence |
|---:|---|---|---|
| 1 | Brand Rasvani; tagline “India, Served by Region.”; B2C+B2B+producer partnerships; Bihar-first; all 36 regions; Supabase | Brand and architecture conventions exist; 36-region directory exists. **Partial / static source evidence.** | Confirm all customer-visible brand instances, approved logo variants, operational launch scope and Supabase environment. Do not use RASO. |
| 2 | Build in phases; test and approve before each phase | Phase roadmap and QA docs/scripts exist. **Partial.** | Maintain explicit owner sign-off at every gate; no phase transition without approval. |
| 3 | Single governing spec; preserve requirements; realistic labelled sample data; Bihar launch; no fabricated claims, origins, reviews, licences or credentials | Evidence/review gates and pending states exist. **Partial.** | Add requirement-to-test traceability and enforce demo-data isolation; audit every public surface for fabricated/placeholder claims. |
| 4 | Vision, audiences and journeys: discover region, search product, collection, retailer enquiry, producer application, learn/shop | Home, regional, product, editorial, B2B and producer foundations exist. **Partial.** | End-to-end user journeys remain unproven; several destinations and transaction stages are incomplete. |
| 5 | Visual system: exact palette, typography, components, WCAG AA, regional motifs only when relevant, image authenticity | Palette/editorial styling and shared components exist. **Partial; visual review pending.** | Live visual review; contrast/accessibility audit; logo variants; real licensed product/producer/region media and rights/consent register. |
| 6 | Image handling, rights, captions, alt text, responsive image targets and optimisation | WebP decorative editorial assets and approved product-media workflow exist. **Partial.** | Asset-by-asset source/licence/consent audit; exact product packaging photos; producer portraits; verified regional images; responsive crops/fallbacks and CLS testing. |
| 7 | Full sitemap: core, shop, regions, editorial, Better Choices, B2B, producer, account, commerce, trust/support; accessible navigation | 24 App Router routes exist, including home/shop/product/map/explore/state/district/editorial/producer/B2B/account/admin/warehouse. **Partial.** | Our Story, Contact, full support/legal/cookie/accessibility pages, recipes, vlog and food-memory experiences are missing or incomplete. Wishlist and complete support/account routes incomplete. |
| 8 | Homepage, separate Explore India and India map; 36-region interactive map; searchable alternative; state/district templates; Bihar first | Home and separate `/india-map`, `/explore-india`, state and district routes exist. Homepage full map was removed; lower Explore India preview retained. **Partial; static checks pass.** | No current runtime map verification; district directory not complete India-wide; verified district-food data absent; current geometry stale (2024 785 district polygons vs official LGD portal 790 on 3 Nov 2026). |
| 9 | Shop filters; authentic product cards; detailed product data, origin evidence, pack/price/stock, product gallery and legal label fields | Approved-product catalogue and product detail routes/media approval foundation exist. **Partial.** | No complete purchasable catalogue, variant/pack selection, live price/stock, full label/back-panel and nutrition records, delivery check, real reviews or cart actions. |
| 10 | Better Choices: no-added-sugar vs sugar-free, ingredient/allergen/nutrition transparency, claims evidence and admin approval | Dedicated page and claim-review/evidence foundations exist. **Partial.** | Verified records and regulated claim approvals not populated; no unsupported health/diet claims; evidence expiry and public badges need runtime tests. |
| 11 | Producer application, facility inspection, hygiene/traceability review, sampling/lab workflow, licence/label review | Producer, facility and product submission/review foundations exist. **Partial.** | Complete inspection checklist, photo evidence, corrective actions, sample chain of custody, lab report linking, document validity and real approval operations require validation. |
| 12 | Producer statuses and scoped approval; no blanket approval across all products/facilities/batches | Separate review status and scope concepts exist. **Partial.** | Prove scope enforcement in database/RLS and admin UI; test rejection/suspension/expiry and re-review paths. |
| 13 | Ongoing quality, complaints, corrective action, batch traceability, recall readiness and truthful trust claims | Batch/lot, inspection, expiry, recall and movement-ledger foundations exist. **Partial.** | Customer notification/case management, recall-to-order traceability, periodic audits, complaint workflows and complete operational evidence remain. |
| 14 | Separate Our Story, Food Heritage, Meet the Makers, actual Vlogs, Recipes and Food Memory; rights, captions, editorial review | Food Stories page and protected CMS/editorial foundations exist. **Partial.** | Genuine founder story; verified recipes; real maker profiles/interviews; actual captioned video/vlogs; moderated customer memory submissions; consent/rights workflows. |
| 15 | B2B business verification, trade pricing, MOQ/case packs/volume tiers, quotes, invoices, lead management | Business registration/enquiry/quote and admin foundations exist. **Partial.** | Verified business accounts; private role-gated pricing; MOQ/case pack/tiers; invoice/document downloads; complete distributor/retailer workflow and privacy tests. |
| 16 | Accounts, saved addresses, wishlist, cart, checkout, payment gateway, shipping rates/AWB/tracking/webhooks, returns/refunds | Login/register/order history and warehouse/order schema foundations exist. **Partial to Missing.** | Customer-facing cart/checkout/payment reconciliation and shipping provider integration are missing; saved addresses, wishlist, serviceability, rates, notifications, exceptions, cancellation/refund support incomplete. |
| 17 | Operational admin dashboard for orders, catalogue, taxonomy, inventory, customers, producers, quality, B2B, CMS, promotions, reports; CSV/Excel | Protected admin, catalogue/regional/editorial/translation/producer/B2B/warehouse workspaces exist. **Partial.** | Complete operational modules, bulk import/export with validation/preview, reports, customer complaints, promotions and live permission tests. |
| 18 | 12 named Indian languages; complete reviewed UI/content/checkout/policies; native script, transliteration, fallback | 12-language selector and locale persistence/dictionary foundation exist. **Partial.** | Complete human-reviewed translations of all content, product/food names, labels, validation, legal, account, checkout and transactional messages; mobile/script QA. |
| 19 | Next.js/React/TS, reusable UI, Supabase/Postgres, migrations, secure env, backups/RLS, provider integrations documented | Next.js app, Supabase migrations and access-control foundations exist. **Partial.** | Installable lockfile; successful build/typecheck/lint; deployed DB/migrations/RLS verification; provider/API/account/cost/backup/restore documentation. |
| 20 | Motion/interactions/accessibility: hero, keyboard nav, map, product cards, gallery, stories, forms, loading; reduced motion and 200–600ms restrained motion | CSS motion, bounded navigation tilt, map selection and reduced-motion rules exist. **Partial.** | Video-inspired motion comparison and component-specific 3D polish; current browser/device performance; keyboard/screen-reader/contrast/form accessibility audit. Note PDF motion is restrained and performance-aware; newer owner request expands 3D styling but does not waive accessibility/performance. |
| 21 | SEO, CWV targets, security/privacy, FSSAI/Legal Metrology/GST/e-commerce/data protection review | Some metadata, access control, private media and RLS design exist. **Partial.** | Canonical/hreflang/sitemap/structured data; measured LCP/INP/CLS; HTTPS/security review, rate limits, secure uploads, consent/retention, backup restore; professional legal/food-safety sign-off. |
| 22 | Consent-aware analytics for search, discovery, language, commerce, B2B, producer quality and reports | Operations aggregate reporting foundation exists; external analytics unconfigured. **Partial.** | GA4/Search Console or selected alternative, consent mode, event taxonomy, dashboards and privacy validation. |
| 23 | Phase 0–3 roadmap and acceptance gates | Phase docs and regional/map work exist. **Partial.** | Reconfirm Phase 0 decisions and owner approvals; phase 3 cannot pass until official districts/geometries and verified content are reconciled. |
| 24 | Phase 3 regional data + map; Phase 4 catalogue/product/Better Choices; Phase 5 commerce; Phase 6 producer | Source foundations exist for regions/catalogue/producer; commerce incomplete. **Partial.** | Finish current data/map accuracy; product records/media; complete commerce integrations and producer SOP/testing. |
| 25 | Phase 7 B2B; Phase 8 stories/CMS; Phase 9 multilingual/SEO; Phase 10 admin/reporting | Partial foundations exist in routes/migrations. | Finish protected workflows, content rights, full reviewed translation, SEO and admin operational coverage. |
| 26 | Phase 11 QA/security/accessibility/launch; Phase 12 measured expansion | Static QA exists; production launch and expansion gates not met. **Blocked.** | Real app build/browser tests, RLS/security, legal sign-off, real content/stock/logistics readiness, measured demand and expansion evidence. |
| 27 | Final release checklist: brand/design, photos/content, Better Choices, producer, commerce, shipping, multilingual, accessibility, SEO/security, performance, launch readiness | Checklist areas have partial source foundations. **Not passed.** | Evidence-backed acceptance per area; no production-ready claim until all required gates pass. |
| 28 | Handover: production site/admin, code/assets, repository/deployment/env, data model, services/costs, SOPs/training, backups, QA, known issues/support | Docs, source, migrations and setup guide exist. **Partial.** | Production deployment, final code repository, integrations, SOP/training, backup/restore, QA evidence, support terms and final complete ZIP. |
| 29 | Closing brand page | No independent functionality requirement. | Ensure brand spelling/tagline consistency in final public experience. |

## B. New reference video — visual timeline observations

The newly supplied 146.19-second clip is a filmed screen recording (848×480, 30 fps) with visible monitor/browser framing. Visual samples were extracted every 0.5 seconds across the complete duration (292 samples). Timestamps are approximate to the sampled frame and the screen recording is not a clean source capture.

| Approx. timestamp | Visible experience | Gap/comparison note |
|---|---|---|
| 00:00–00:09 | Home hero: “India, served by region”; round/circular food composition; serif headline; cream editorial canvas; scroll into food discovery section. | Reference is editorial and restrained, not a conventional dense grocery grid. Current home has a hero and editorial imagery but needs live comparison for composition, movement and visual quality. |
| 00:09–00:22 | “Stories carried in food”; wide food still-life image with text; “Meet the people behind the pantry” section. | Need distinct editorial story and real maker evidence; do not use decorative image as a real producer portrait. |
| 00:22–00:30 | Dark green panel: “Know what goes into every choice”; transition into Explore India preview. | Current Better Choices page exists; content and claim evidence are incomplete. |
| 00:30–00:50 | “Explore India, beyond the map”; search across India; “Choose a region to begin” prompt. | Search/list journey is visible; no full India map interaction is clearly demonstrated in this video segment. Dedicated `/india-map` remains a separate required route. |
| 00:51–00:58 | Bihar state hero; “Discover Bihar, district by district”; district search/list; selection proceeds to Araria. | State/district route exists in code, but all-state district directory is incomplete; current verified food dataset is not populated. |
| 00:58–01:06 | Araria district page; “Traditional foods of Araria” with a pale generic/illustrative oval graphic and little visible verified dish detail. | This is a visual/data gap: district food collection needs exact verified foods and matching images; do not fill with unrelated generic imagery. |
| 01:06–01:28 | Producer/partner-style form screen: “Choose your starting point” and supporting sidebar; form states/loading/scroll are visible. | Producer application/facility/product review foundations exist, but full form completion, validation, evidence upload and runtime submission need browser testing. |
| 01:28–01:39 | “A considered collection” editorial food composition, then a later hero “Every flavour has a somewhere.” | Premium image composition and editorial spacing are useful inspiration; current visuals require live comparison and asset rights review. |
| 01:39–01:50 | Three editorial food cards and “Start with a place” regional discovery panel; “What we look closer at” content. | Current home/editorial modules cover some themes; need exact verified content and distinct card imagery, no generic image reuse for named dishes. |
| 01:50–02:06 | “Bring your food story to a wider table” with food still-life and CTA; publication/editorial form-like content below. | Story contribution/producer outreach needs clear purpose, validation, consent, moderation and actual backend workflow. |
| 02:06–02:14 | “Your Rasvani account” sign-in/account screen; later returns to editorial and Explore India. | Account route exists, but saved addresses, wishlist, support, complete orders and commerce journey are incomplete. |
| 02:14–02:26 | Returns to Explore India search and “Choose your starting point” interface. | Search/list and regional entry are recurring navigation patterns; test persistence, search variants and route continuity. |

**Animation interpretation:** The supplied recording shows scrolling and page/section changes, but because it is a handheld/filmed monitor capture and sampled frames, it does not provide reliable evidence of the exact easing curves, hover physics, frame rate, 3D transforms or micro-interactions. No exact animation should be claimed as recreated from this clip alone. The PDF p.20 specifies restrained, accessible component motion (typically 200–600 ms); the latest owner addendum requests broader component-specific 3D effects. Implement only where it remains performant, readable and reduced-motion-safe.

**Audio limitation:** An AAC audio track is present. No transcript is available in this environment. Any spoken design instructions in the video remain unverified and should not be inferred.

## C. Reference image review

### India political map (800×952 PNG)
- Useful visual information: north-to-south national composition; state/UT colour differentiation; labels and capital markers; north-east inset-like density; island territories; neighbouring country/sea context; legend.
- Not production-ready data: map says “Map not to Scale”; it carries a MapsofIndia copyright notice; boundary vintage/accuracy and district geometry are not established by the image. It does not contain district boundaries for the required drill-down.
- Required treatment: use only as a visual/geographic orientation reference. Obtain current licensed State/UT and district polygon data; bind each district polygon to an official administrative code; create original Rasvani styling. Do not trace, re-host or reproduce the copyrighted artwork without permission.

### Four-panel RASO design reference (1312×1199 JPEG)
- Visual inspiration: warm cream surfaces, dark maroon buttons, serif display headings, refined product cards, generous whitespace, regional imagery, festive editorial banner, product detail with a left image gallery and right purchase panel, compact icon-led trust strip, cohesive palette/typography strip.
- Non-transferable elements: RASO name/logo/tagline, exact screen composition, exact food/product names, unsupported claims, prices, ratings and product images.
- Rasvani adaptation: retain the PDF palette and editorial direction, use the Rasvani name/tagline, original layout, real approved product photography, truthful product/producer data, and functional controls only.

## D. Source-code inventory and verification snapshot

- Next.js App Router pages: 24 (home; shop/list and product; India map; Explore India; region/district; stories/editorial; Better Choices; producer/B2B; account; admin; warehouse and review workspaces).
- Shared TSX components: 8.
- Supabase migrations: 43.
- Public image assets in `apps/web/public/images`: 18. Visual contact-sheet review found legacy JPGs as small as 177×160, 197×160, 245×90, 260×90 and 360×170; several newer WebP files are high resolution, but there are near-duplicate pairs (`rasvani-editorial-vegetarian-feast` / `rasvani-feast-hero`, `rasvani-editorial-spice-pantry` / `rasvani-pantry-ingredients`, `rasvani-editorial-snack-feast` / `rasvani-savory-collection`, `rasvani-editorial-sweets-brass` / `rasvani-sweet-collection`). These are not all suitable as exact dish/product images.
- Existing QA scripts: 53 Python `*_checks.py` scripts passed in the latest recorded run.
- The existing implementation includes regional taxonomy and reviewed association patterns, approved product media gates, producer/facility/product review foundations, Better Choices claim review, and warehouse receiving/batch/expiry/FEFO-FIFO/recall/stock-count foundations.
- No live Supabase instance or owner credentials were provided in this audit package; database migrations and RLS cannot be claimed as executed.
- No configured payment, shipping, email or production analytics provider is evidenced.
- The 2024 map vector archive's 785 district polygons do not reconcile with the official LGD dashboard count of 790 districts observed on 3 November 2026. This remains a high-priority external data blocker.

## E. Consolidated gap list (priority order)

### P0 — blockers before the India discovery experience can be approved
1. **Current official district taxonomy:** acquire the dated official LGD district master; retain LGD codes, names, parent State/UT, effective date and provenance; reconcile totals and changes.
2. **Current licensed boundary geometry:** replace/reconcile 2024/785 geometry with current licensed polygons keyed to LGD codes; verify all 36 State/UTs and every active district.
3. **Map browser validation:** install dependencies, run the actual Next.js app, verify map tile/style/glyph loading, state selection, labels, touch/keyboard navigation, zoom, list fallback and responsive layouts.
4. **Verified district food content:** create a controlled evidence/review pipeline for exact vegetarian dishes, relationship type (origin / famous / commonly available), citations/sources, reviewer and approval; publish only approved records.
5. **Exact dish media:** for each named dish, require an image asset linked to that dish record with rights/provenance and reviewer approval. AI art may be decorative, never product/origin proof. Do not reuse unrelated generic visuals.
6. **State → district → food journey:** verify all state/UT directories and selected-district paths; Bihar's 38 entries are navigation records, not evidence that all food content exists.

### P1 — premium visual and motion quality
1. Compare the live app with the reference video and image board using repeatable desktop/tablet/mobile captures.
2. Add component-specific motion to map states, district cards, food imagery, product cards, homepage sections, menus, stories, producers and buttons; use distinct intentional patterns rather than one global animation.
3. Preserve PDF safeguards: reduced-motion mode, visible focus, keyboard/touch parity, no autoplay sound, no heavy mobile effects, readable text and measured performance.
4. Replace low-resolution legacy JPG/editorial placeholders where justified; maintain actual approved product media for purchasable SKUs.
5. Validate brand consistency, typography, contrast, image crops, spacing, empty/loading/error states and 320px mobile overflow in the current Next.js app.
6. Audit and deduplicate the 18-image public asset library; replace low-resolution legacy thumbnails where used above the fold, retain responsive source variants, and prevent collection-level decorative imagery from being mistaken for exact dish or SKU photography.

### P2 — remaining platform functionality
- Complete product data and real catalogue; product gallery, pack/variant, origin evidence, label/allergen/nutrition, live price and stock.
- Implement wishlist, persistent cart, stock validation/reservation, checkout, tax/shipping calculation, payment success/failure/pending/reconciliation, notifications, order tracking, cancellations, returns and refunds.
- Finish all 12 professionally reviewed languages across every page, content field, product, form, error, policy, checkout and transactional template.
- Complete producer application, document verification, facility inspections, samples/lab evidence, corrective action, scoped approval, suspension and monitoring.
- Complete B2B business verification, role-protected trade pricing, MOQ/case pack/tiers, quotes, invoices and lead management.
- Complete admin modules, import/export validation, audit trails, complaint/recall operations, promotions and reports.
- Complete Our Story, Food Heritage, Meet the Makers, recipes, actual vlogs, food memories, captions, moderation and rights/consent.
- Complete SEO/hreflang/schema/sitemaps, analytics consent, security review, backup/restore, legal/FSSAI/Legal Metrology/GST and accessibility audits.

## F. Additional recommendations (not silently substituted for PDF requirements)

1. **Geodata release pipeline:** store source URL, licence, date, checksum, import version, LGD codes and polygon-match report; make updates reviewable and reversible.
2. **Food evidence model:** separate food identity from regional association; store evidence URL/reference, source quality, relationship type, confidence/review status, language variants and last-reviewed date.
3. **Image governance:** require an explicit `image_subject_food_id` or `product_id` link; disallow a food-card image when its linked subject does not match the food record; keep editorial decorative images in a separate asset class.
4. **Motion budget:** define per-component motion tokens, max tilt/translation, duration/easing, GPU budget and reduced-motion equivalent; monitor mobile frame drops.
5. **Visual regression baseline:** add fixed browser screenshots for 1440px, 820px, 390px and 320px; compare home, map, state, district, product, producer and account routes.
6. **Operational readiness:** maintain receiving, quarantine, expiry, FEFO/FIFO, recall, returns, producer inspection and customer complaint SOPs aligned to the warehouse model.
7. **Truthful empty states:** where verified food/product data is unavailable, explain that curation is pending rather than fabricate dishes, images, ratings, stock, price or origin.

## G. Approval gates

**Gate A — Audit review (this document):** owner reviews and approves the gap register and any explicit change requests. No new major implementation starts before approval.

**Gate B — India data and map implementation:** official district master and licensed boundaries reconciled; map and searchable list work; State → District → verified vegetarian-food journey tested; matching image evidence enforced.

**Gate C — Visual/motion implementation:** owner reviews the actual running website and approves the component-specific motion and visual quality across desktop/tablet/mobile.

**Gate D — Remaining PDF phases:** proceed in the PDF's approved phase order, with actual implementation, tests, defect fixes, documentation and owner approval at each gate.

**Current overall decision:** Audit evidence is prepared; the current Next.js app remains runtime-unverified; the India-wide district/food experience is not complete; production release is not approved.
