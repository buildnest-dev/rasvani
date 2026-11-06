# Rasvani — India, Served by Region

A continuous, phase-by-phase codebase for the Rasvani regional-food discovery, storytelling and commerce platform.

## Current status

- **Phase 0:** owner-approved requirements baseline; unresolved commercial/legal/operational decisions remain recorded in the Master Specification v3.0.
- **Phase 1:** design prototype completed and tested in Chromium at desktop (1440px), tablet (820px) and mobile (390px), plus overflow checks at 320/360/375/768/1024px. Core prototype interactions and all 10 local visual assets passed; no browser JavaScript errors were recorded.
- **Phase 2:** initial Next.js/React/TypeScript + Supabase foundation scaffold created. Package installation/build and live Supabase migration are pending because npm registry DNS resolution failed in this environment. See `docs/PHASE_2_ARCHITECTURE.md`.

### Latest visual increment — 6 November 2026

- The homepage hero now uses a cinematic, interactive 3D carousel of five existing Bihar food items, with layered lighting and responsive/reduced-motion styling.
- The shared locale provider now drives common interface copy across the main public routes, shared navigation, footer, regional map/directory and district food experiences. Food/place/producer names are preserved; regulated and long editorial copy still requires qualified translation review.
- The snack/research illustration set was cleaned of known preview UI overlays, sharpened/upscaled for responsive cards, and is served through Next Image optimisation where used.
- See `docs/HOMEPAGE_CINEMATIC_MOTION_SITEWIDE_LANGUAGE_AND_IMAGE_QUALITY_2026-11-06.md`, `qa/sitewide_locale_motion_image_quality_static_results.json`, and `qa/static_qa_summary.json`.
- Static QA: **1,016/1,016**. TypeScript/TSX syntax transpilation: **70 files, zero syntax diagnostics**. A full Next.js build and live browser review remain pending because dependency installation timed out in this environment.

## Project structure

```text
apps/web/                         Next.js App Router application
supabase/migrations/              Versioned database migrations
prototype-phase-1/                Retained Phase 1 prototype, assets and QA evidence
qa/                               QA source scripts and test evidence
docs/                             Governing source PDF, Master Spec v3.0 and architecture notes
```

## Local development

Requires Node.js 20.9+ and npm. From repository root:

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
# Add approved Supabase project URL and public anon/publishable key
npm run dev
```

The Supabase migration must be reviewed and applied to a development project before auth is considered connected. Never put a Supabase service-role key in browser code or a `NEXT_PUBLIC_` variable.

## Important trust boundaries

- No verified producer, product, price, stock, certification, shipping coverage, warehouse premises or legal seller information has been supplied; do not invent any.
- AI food images are illustrative design visuals only, not evidence of products, food origins, producers or certifications.
- Commerce, payments, producer applications, B2B enquiries, CMS publishing and warehouse operations are not live in this scaffold.
- Analytics is disabled by default and no tracking provider is selected.
- Do not enable public sales or privileged staff workflows before the open owner decisions, qualified compliance review, RLS tests and operational acceptance gates are closed.

## Latest Phase 2 increment

The server-only role lookup/guard helper and App Router loading, error and not-found boundaries have been added. Phase 1 browser QA was rerun successfully and Phase 2 static checks now pass 12/12. See `docs/PHASE_2_PROGRESS.md` and `qa/phase2_static_results.json`. A full Next.js build and live database integration remain blocked pending dependency installation and an owner-controlled Supabase development project.

### Account authentication increment
The account route now contains server-action sign-in, registration and sign-out flows, with server-side Zod validation and generic authentication errors. Supabase must be configured locally and its email/password policies reviewed before these flows can be considered launch-ready. Password recovery, email resend, MFA, and live integration tests remain pending.


## Phase 3–10 domain foundation increment

- Searchable 36-region directory and generated region detail routes.
- New Supabase migration `202611020002_phases3_10_domain_foundation.sql` covering catalogue, producer applications/facilities, B2C order records, B2B enquiries/quotes, editorial translations, consent, multi-warehouse receiving, batch inventory, inspections, movements and reservations.
- Review `docs/PHASES_3_TO_12_IMPLEMENTATION_PLAN.md` for what is implemented versus still pending.

Apply migrations only to a disposable/development Supabase project after review. The domain migration intentionally grants no direct client access to sensitive commerce, producer, B2B or inventory tables. No real products, producers, prices, warehouse sites or payment configuration are seeded.

## Phase 10 inventory workflow increment

Historical foundation note: migration `202611020003_inventory_workflows.sql` seeds the 36 regions and adds FEFO reservation, batch inspection and recall RPCs. The current ordered migration sequence extends through `202611020027_warehouse_recall_workspace.sql`; apply every migration in numeric order only to a disposable/staging Supabase project after review. See `docs/WINDOWS_DEPLOYMENT_GUIDE.md` and `docs/PHASE_10_INVENTORY_WORKFLOWS.md`. SQL execution remains unverified.

### Latest Phase 10 increment
Migration `202611020004_receiving_returns_expiry.sql` adds quarantine-first receiving with a mandatory common checklist, return quarantine and separate quality inspection, and expiry-monitoring/blocking primitives. Static checks: 11/11. PostgreSQL/Supabase execution and scheduled alert delivery are not yet run/configured. See `docs/PHASE_10_INVENTORY_WORKFLOWS.md`.

Migration `202611020005_reservation_lifecycle.sql` adds reservation quantity controls, release/expiry cleanup and controlled dispatch stock consumption. Static checks passed 11/11; database/concurrency tests are not run.


### Latest governance increment

Migration `202611020006_producer_catalogue_governance.sql` adds audited producer application review, facility approval, product-claim review, catalogue approval and separate publication gates. Static checks: 14/14 passed; database execution remains unverified. See `docs/PHASE_6_4_PRODUCER_CATALOGUE_GOVERNANCE.md`.


### Latest increment: customer commerce and B2B
Migration `202611020007_customer_commerce_b2b.sql` adds guarded customer order initiation, pre-dispatch cancellation/reservation release, business-account review, verified B2B enquiries and controlled trade quotes. Payment capture, tax, shipping, seller-of-record and trade settlement remain unconfigured pending business decisions. Static checks: 18/18 passed; no live database execution is claimed. See `docs/PHASE_5_7_COMMERCE_B2B.md`.


### Phase 8/9/11 editorial and privacy increment

Migration `202611020008_editorial_translation_consent.sql` adds audited editorial draft/review/publish/archive transitions, the 12-locale translation review lifecycle, and append-only consent history. Public translation reads require both an approved translation and an approved, published source item. Static checks: 12/12 passed; database execution remains NOT RUN. See `docs/PHASE_8_9_11_EDITORIAL_PRIVACY.md`.

## Windows setup

See `docs/WINDOWS_DEPLOYMENT_GUIDE.md` for one-time Windows instructions to extract the ZIP, install Node.js dependencies, configure a development Supabase project, apply migrations in order, run the site locally and understand production deployment gates.

## Latest development increment — editorial governance and operations reporting

Migrations `202611020008_editorial_translation_consent.sql` and `202611020009_admin_reporting_operations.sql` add audited CMS/translation/consent workflows and role-gated aggregate reporting. The reporting functions expose aggregate counts only and do not return customer or producer personal data. Static source QA currently reports 154/154 checks passed across 12 suites. Live Supabase execution, framework build, end-to-end, security, accessibility and performance validation remain outstanding; see `qa/static_qa_summary.json` and `docs/PHASES_3_TO_12_IMPLEMENTATION_PLAN.md`.


### Protected operations dashboard (latest increment)
An internal `/admin` route now renders aggregate review queues, warehouse stock summaries and editorial locale coverage using the role-gated reporting RPCs from migration 009. Access is guarded server-side for admin/super-admin roles. The page is read-only and does not expose customer or producer personal details. Static UI checks: 11/11; runtime/database authorization and browser rendering tests remain NOT RUN.


### Protected editorial workspace (latest increment)
The `/editorial` route provides a role-guarded draft form and editorial queue. It uses the existing database RPCs for saving, submitting, reviewing and publishing content, and a new scoped queue RPC in migration `202611020010_editorial_workspace_queue.sql`. Review reasons are required; publishing remains separate from approval. Translation review remains a distinct workflow. Static UI checks: 13/13; live database and browser tests remain NOT RUN.

### Translation workspace increment
The protected editorial workspace now includes a 12-locale translation draft and quality-review queue. Drafts are saved via the existing audited translation RPCs; submission and quality-review decisions remain separate, and translation approval does not publish the source content. Migration `202611020011_translation_workspace_queue.sql` adds a bounded role-gated queue RPC. Static translation UI checks: 10/10; professional linguistic review and live integration are not performed by static checks.


### Producer self-service portal (latest increment)
Migration `202611020012_producer_self_service_application.sql` adds authenticated submit/update and own-status RPCs. The protected `/producer-portal` lets customers/producers submit basic business details for staff review. Submission does not grant the producer role, verify credentials/facilities, approve products or publish a catalogue item. Sensitive document collection is deferred pending approved privacy and secure-storage processes. Static checks: 18/18; live Supabase execution and browser tests remain NOT RUN.


## Latest increment — protected warehouse workspace (migration 013)

Migration `202611020013_warehouse_workspace.sql` adds role-gated receipt, batch, return and expiry queue RPCs; approved-producer receipt creation; producer-match validation during receiving; and stricter batch inspection that blocks acceptance if any receiving checklist item failed or any mandatory item is not passed. The protected `/warehouse` workspace connects these workflows to server actions and role checks. Receipt, receiving, batch inspection, return inspection and expiry block actions are available to the matching staff roles. Return inspection marked usable does not restore stock; that remains a separate operational process. Photo upload is not configured. Static checks: 26/26 for the warehouse workspace; live Supabase execution and authenticated UI tests remain NOT RUN.


## Latest development increment — customer order workspace

- Added the protected customer order history route at `/account/orders`.
- Added a private authenticated RPC for each customer's own order summaries and line items.
- Reused the existing cancellation lifecycle; cancellation remains unavailable after the permitted pre-dispatch states.
- Payment and delivery remain explicitly unconfirmed until their external providers and business decisions are configured.
- See `docs/PHASE_5_CUSTOMER_ORDER_WORKSPACE.md`.
- Latest consolidated static checks: 194/194 across 14 suites. Live database/build/E2E tests are still not run.


## Latest continuation — business buyer workspace
- Authenticated `/business-portal` supports business registration, owner-scoped enquiry/quote visibility and quote responses.
- Admin `/admin` now includes a restricted business verification queue.
- Apply migrations `202611020015_business_self_service_portal.sql` and `202611020016_business_verification_queue.sql` after 001–014.
- Details: `docs/PHASE_7_BUSINESS_BUYER_WORKSPACE.md`.
- Latest static QA: `qa/static_qa_summary.json` (static checks only; not a live database or production-build claim).


## Catalogue review workspace (migration 017)
The protected `/catalogue-review` workspace provides bounded pending-claim and unpublished-product queues. It keeps quality claim review, product eligibility approval and final publication separate and uses the existing audited database transition functions. The admin dashboard links to this workspace. Static QA only; apply migration 017 after 001–016 and validate against a development Supabase project. See `docs/PHASE_4_CATALOGUE_REVIEW_WORKSPACE.md`.


### Catalogue review workspace (latest increment — migration 017)
A protected `/catalogue-review` workspace now connects staff to pending claim and unpublished-product queues. Claim review, product eligibility approval and catalogue publication remain separate audited transitions. Queue RPCs are role-gated and bounded; publication rechecks producer, facility, category and claim eligibility. Apply migration 017 after migrations 001–016. Static QA is 234/234 across the registered suites; this does not imply live database, build or end-to-end success. See `docs/PHASE_4_CATALOGUE_REVIEW_WORKSPACE.md`.

## Latest development update — 2 November 2026

Producer product self-service is available at `/producer-portal/products` for approved producer accounts. Migration `202611020018_producer_product_submission.sql` creates the authenticated submission/status functions. Product and optional claim submissions remain pending independent review; there is no automatic approval or publication. See `docs/PHASE_6_PRODUCER_PRODUCT_SUBMISSION.md`.

Static QA currently records 262/262 checks across 19 suites. These checks do not substitute for applying migrations to Supabase, installing dependencies, running the Next.js production build, or authenticated end-to-end tests.


## Public catalogue update (2 November 2026)
The public shop now lists only approved, published catalogue products and supports bounded name search and active-category filtering. Product detail pages show submitted description, ingredients, allergen statement and storage condition where available. Prices, stock and checkout remain hidden until commercial and fulfilment controls are enabled. See `docs/PHASE_4_PUBLIC_CATALOGUE.md`. Static QA summary at that increment: 289/289 across 20 suites; subsequent coverage is recorded in the current QA summary below.


### Public catalogue photography (latest increment — migration 021)
The public `/shop` and product-detail pages now display only quality-approved images attached to approved, published products. The Storage bucket remains private; the server mints 15-minute signed URLs only after a bounded public-media RPC confirms eligibility. Pending/rejected images stay private, and prices, stock, checkout and delivery promises remain hidden. See `docs/PHASE_4_PUBLIC_PRODUCT_MEDIA.md`. Static media checks: 22/22; consolidated QA is recorded in `qa/static_qa_summary.json`. Live Supabase/Storage verification and a full application build remain NOT RUN.


### Regional discovery directory increment (2 November 2026)
The `/explore-india` directory now supports text search and All / States / Union Territories filters across the canonical 36-region taxonomy. Bihar is marked as the first launch focus without fabricated regional content or availability claims. This supplies the map-independent browse route; the interactive map remains deferred until map/boundary licensing and cost are decided. Static checks: 12/12. Framework build and live browser tests remain NOT RUN.


### Current consolidated verification (2 November 2026)
All registered static source-check suites were rerun after the regional directory increment: **323/323 checks across 22 suites passed** (`qa/static_qa_summary.json`). This is static source verification only. It does not claim a Next.js build, live PostgreSQL/Supabase execution, end-to-end browser run, penetration test, formal accessibility audit or performance test.


### District-level regional discovery (2 November 2026)
State/UT pages now show only approved district guides from the regional taxonomy. District detail pages show product associations only after both the district and association have been approved and the associated product is approved and published. Relationship labels distinguish origin claims, production location, traditional association and popularity; no exclusive-origin claim is inferred. Migration `202611020022_regional_district_associations_search.sql` provides evidence-referenced district, association and locale-aware search-term records with role-gated review and audit history. No district/food examples are seeded. See `docs/PHASE_3_DISTRICT_DISCOVERY.md`.

Current consolidated static QA: **345/345 checks across 23 suites** (`qa/static_qa_summary.json`). This remains static source verification only; database execution, framework build and authenticated browser tests are NOT RUN.


### Regional food search update (2 November 2026)
`/explore-india` now searches published product names, evidence-reviewed regional spellings, transliterations and synonyms across all 12 planned locales. It also matches approved districts, the 36 canonical regions, and active categories; approved region/district associations can surface related published foods. `/shop` also includes reviewed search terms. Search does not invent aliases or perform machine translation/fuzzy correction; a term must be evidence-referenced and quality-approved before it is searchable. See `docs/PHASE_3_REGIONAL_SEARCH.md`. Static search checks: 31/31. Live database/RLS, Next build and authenticated browser testing remain NOT RUN.


### Current consolidated QA snapshot (2 November 2026)
**376/376 static source checks passed across 24 suites.** The TypeScript parser also parsed 48 application source files with zero syntax diagnostics. This parser pass is not semantic typechecking. Next.js build, full typecheck/ESLint, Supabase migration and RLS execution, authenticated browser/E2E, security, accessibility and performance tests remain NOT RUN. The search increment details are in `docs/PHASE_3_REGIONAL_SEARCH.md`.

### District guide editorial content (latest increment — migration 023)
The protected regional workspace now captures an optional district introduction and food-heritage note. Both remain draft-only until the district's quality review; the reviewer queue displays the proposed copy with its evidence reference. Public district pages render the copy only for approved district records. No district facts or food examples are seeded. See `docs/PHASE_3_DISTRICT_GUIDE_CONTENT.md`.

Current consolidated static QA: **432/432 checks across 26 suites** (`qa/static_qa_summary.json`). This is static source verification only. Live Supabase migration/RPC execution, full typecheck/build, authenticated browser/E2E, security, accessibility and performance testing remain NOT RUN.

- Phase 3: evidence-reviewed state and Union Territory overview copy is supported through the protected regional review workspace; only approved copy and approved regional food associations appear publicly. See `docs/PHASE_3_REGION_OVERVIEW.md`.


### State / Union Territory category discovery (2 November 2026)
State and UT overviews now provide category browsing derived from approved region-level product associations. Only active categories linked to those published products are offered. Counts represent distinct associated products, while category links open the wider Shop category filter and do not imply that every product in that category belongs to the region. Product cards preserve the reviewed relationship type. See `docs/PHASE_3_REGION_CATEGORY_DISCOVERY.md`. Static QA is recorded in `qa/static_qa_summary.json`; live database, build, browser, security, accessibility and performance checks remain not run.

## Latest increment — regional catalogue filters (2 November 2026)

The public Shop page supports combined product-name/reviewed-alias, state or Union Territory, approved district, and active-category filters. Region and district results are constrained by approved `product_regional_associations`; alias matches are scoped again after merging so search cannot bypass the selected region. Invalid regional filters return no products. Public prices, inventory availability, delivery estimates and checkout remain disabled pending the relevant owner decisions and integrations. See `docs/PHASE_4_REGIONAL_CATALOGUE_FILTERS.md`.

Latest consolidated static QA: `qa/static_qa_summary.json`. This is source-level verification only; it does not claim live database execution, a framework build, end-to-end browser tests, penetration testing, formal accessibility or performance audits.

## Latest increment — product detail regional story (2 November 2026)

Public product detail pages now pair approved product information and approved product photographs with evidence-reviewed regional relationships. Relationship labels retain the controlled taxonomy (origin claim, produced in, traditionally associated with, popular in). Canonical state/UT links are provided, and a district link appears only when that district record is approved and matches the association's region. Internal evidence and review notes, producer-private details, SKU, price, inventory and delivery claims are not exposed. No regional association is rewritten as an exclusivity claim. See `docs/PHASE_4_PRODUCT_DETAIL_REGIONAL_STORY.md`.

### Current verification snapshot — 2 November 2026
The project now contains **30 ordered Supabase migrations**. The complete Windows deployment guide lists the sequence. The latest static QA report is generated from the registered suite result files; TypeScript syntax transpilation is not semantic typechecking. Dependency installation, Next.js build, full TypeScript typecheck, ESLint, live Supabase/PostgreSQL execution, authenticated end-to-end tests, formal accessibility/performance audits and penetration testing remain NOT RUN.

## Latest Phase 10 increment — receiving checklist outcomes and private evidence (2 November 2026)

Warehouse intake records an observed Pass or Fail for each of the eight mandatory common checks; failed items require findings and keep the batch quarantined. Receiving photos are uploaded to a private storage bucket, and authorised warehouse/quality staff can review checklist results and photos from the quarantine queue using short-lived server-signed links. Migration 025 configures private storage, and migration 026 provides the bounded evidence query. Configurable product/storage-specific checklist templates are still not connected to the form. See `docs/PHASE_10_RECEIVING_CHECKLIST_RESULTS.md` and `docs/PHASE_10_INVENTORY_WORKFLOWS.md`.


## Latest Phase 10 increments — private evidence review and product recall (2 November 2026)

The warehouse quarantine queue now shows checklist outcomes, findings and receiving photos to authorised warehouse/quality staff. Photo objects remain in a private bucket; the page requests role-gated evidence rows and creates short-lived signed URLs server-side. Raw object paths are not rendered. Migration 026 provides the bounded role-gated evidence query.

The warehouse workspace also exposes the existing product-level recall transition to quality reviewers and admins. A narrow selector lists products with batches eligible for recall; the action requires a reason, reports the affected batch count, and uses the existing audited inventory recall function. Migration 027 provides the selector RPC. Recall remains product-wide, not a customer/order notification case-management workflow.

Approved producers now have direct links from their portal to facility submissions and product submissions. This does not bypass separate facility approval, product review or publication gates.

All 34 registered phase QA scripts passed. The consolidated report records **541/541 static source checks across 32 suites** in `qa/static_qa_summary.json`. TypeScript syntax transpilation covered 50 application files with zero syntax diagnostics; this is not semantic typechecking. Static QA does not establish live storage signing, database execution, recall transaction behaviour or authenticated browser functionality.


## Latest Phase 10 increment — inventory movement ledger (2 November 2026)

Migration `202611020029_inventory_movement_ledger.sql` adds a read-only, bounded ledger RPC for warehouse operators, quality reviewers and administrators. The warehouse workspace now displays up to 200 recent movement records with movement date, product/SKU, batch, warehouse, source/destination bins, movement type, quantity delta, operational reference and reason. The query deliberately excludes customer identity and contact fields and does not mutate stock.

Static QA: `qa/phase10_inventory_movement_ledger_checks.py` (13 checks). Consolidated static QA is recorded in `qa/static_qa_summary.json`. This is not a physical stock-count reconciliation and does not replace a live operational audit.

## Phase 1 navigation motion

The shared header navigation, mobile menu entries, account/shop actions and footer links now use restrained 3D depth and smooth hover/press feedback. Desktop mouse movement adds a small pointer-position tilt; touch input is not tracked. The mobile menu items enter with a subtle stagger. Keyboard focus styling remains, and `prefers-reduced-motion` disables decorative motion. Implementation details and QA scope are documented in `docs/PHASE_1_NAVIGATION_MOTION.md`. Source-level checks are in `qa/phase1_navigation_motion_checks.py`; they do not replace browser, screen-reader or physical-device testing.


### Latest continuation — navigation motion and physical stock counts
- Header navigation items, header actions, mobile menu links and footer links use restrained 3D perspective, mouse-only pointer tilt, layered hover feedback and staggered entrance animation. `prefers-reduced-motion` disables these effects. See `docs/PHASE_1_NAVIGATION_MOTION.md`.
- Physical stock-count reconciliation is now connected to the warehouse workspace: snapshot, batch-level quantity entry, submission, independent quality review, stale-snapshot protection and audited adjustment movements. See `docs/PHASE_10_PHYSICAL_STOCK_COUNT_WORKSPACE.md`.
- Static QA suites: `qa/phase1_navigation_motion_checks.py` and `qa/phase10_stock_count_workspace_checks.py`.


## Latest update — 3D navigation and physical stock counts (2 November 2026)

The shared navigation now includes a desktop staggered 3D entrance as well as mouse-only local tilt, lift, soft highlight, press feedback and mobile stagger. Footer links receive a smaller matching depth response. Reduced-motion preferences disable the decorative effects.

The warehouse page now connects migration 030's physical count workflow. Operators create a warehouse snapshot, record quantities and submit it; a different quality reviewer/admin approves or rejects. Approval is blocked if inventory moved after the snapshot or counted stock would fall below active reservations. Approved variances create audited inventory movement adjustments. See `docs/PHASE_10_PHYSICAL_STOCK_COUNT_WORKSPACE.md`.

Historical static QA at the time of the earlier warehouse increment: **597/597 checks across 35 suites**. TypeScript syntax transpilation: 50 files, zero syntax errors. This is not a full typecheck or production build. Live database, authenticated end-to-end, formal accessibility, performance and penetration testing remain NOT RUN.


### Latest warehouse increment — configurable checklist editing

Administrators can now edit active custom receiving checklist titles, category/storage scopes and requiredness. Built-in receiving controls remain immutable; every edit is audited and historical inspection records are preserved. Apply migration `202611020033_receiving_checklist_template_editing.sql` after migrations 001–032. See `docs/PHASE_10_RECEIVING_CHECKLIST_TEMPLATE_EDITING.md`.

Current QA snapshot: 613/613 static checks across 36 consolidated suites. A TypeScript syntax-only pass parsed 51 application files with zero syntax errors. This does not imply a successful Next.js build, semantic typecheck, lint, live Supabase execution, or production readiness.

### Latest Phase 10 increment — independent stock-count variance investigation

Variance lines now require an independent quality/admin investigation finding and note before approval can apply audited quantity adjustments. The database enforces reviewer separation, records reviewer/time and audit history, and preserves existing stale-snapshot, reservation and critical-escalation protections. See `docs/PHASE_10_STOCK_COUNT_VARIANCE_INVESTIGATION.md` and migration `202611020034_stock_count_variance_investigation.sql`.


### Latest Phase 10 increment — immutable variance investigation evidence

Migration `202611020035_immutable_stock_count_investigation.sql` prevents a submitted stock-count variance's first independent investigation finding from being overwritten. This aligns database enforcement with the workspace, which displays a saved finding rather than an edit control. A correction/reopen workflow is deliberately not assumed and would require separately authorised, retained evidence. Static QA is recorded in `qa/phase10_immutable_stock_count_investigation_static_results.json` and the consolidated summary; live database execution remains unverified. See `docs/PHASE_10_IMMUTABLE_STOCK_COUNT_INVESTIGATION.md`.

Latest consolidated static QA after open stock-count cancellation: see `qa/static_qa_summary.json`; the summary is rebuilt from all registered suites. Static checks do not establish a successful live database migration, Next.js build, semantic typecheck, lint, authenticated end-to-end tests, or production readiness.


### Latest Phase 10 increment — open stock-count cancellation

Warehouse operators can cancel an open, unsubmitted count only when they created it; administrators can cancel any open count. Cancellation requires a reason, records the actor/time and audit event, retains the original count snapshot and entered quantities, and never changes inventory. Submitted and finalised counts cannot be cancelled. Apply migration `202611030036_cancel_open_inventory_stock_counts.sql` after migrations 001–035. See `docs/PHASE_10_OPEN_STOCK_COUNT_CANCELLATION.md`.


### Latest Phase 10 increment — physical stock-count line audit

Recording a physical count quantity now writes a before/after audit event; later corrections to a still-open count line are separately identified. The event preserves the prior quantity, notes, counter and timestamp alongside the new values. The protected RPC locks the count and line while updating, and explicitly records that line entry does not change inventory. Only independent approval can reconcile stock. Apply migration `202611030037_audit_stock_count_line_edits.sql` after migrations 001–036. See `docs/PHASE_10_STOCK_COUNT_LINE_AUDIT.md`. Static checks are in `qa/phase10_stock_count_line_audit_checks.py`; live database execution remains unverified.


### Latest warehouse update (3 November 2026)

The stock-count decision register now displays the recorded approval/rejection reason or cancellation reason alongside the submitter/reviewer identity and timestamps. This is a read-only visibility improvement; it does not change inventory or review decisions. See `docs/PHASE_10_STOCK_COUNT_DECISION_AUDIT_REGISTER.md` and migration `202611030038_stock_count_decision_audit_read_model.sql`. Static QA snapshot: 689/689 checks across 41 suites; this does not imply live database or production verification.

### Latest Phase 10 increment — prevent overlapping full-warehouse stock counts (3 November 2026)

The protected stock-count creation RPC now serializes creation per warehouse with a transaction-scoped advisory lock and rejects a new count while another count for that warehouse is still `counting` or `submitted`. This avoids duplicate full-warehouse snapshots and competing review queues. Approved, rejected or cancelled counts do not block a subsequent count. The snapshot remains full-warehouse and includes non-disposed batches; targeted cycle-count scope has not been introduced. No stock quantity changes occur at creation. See `docs/PHASE_10_PREVENT_OVERLAPPING_STOCK_COUNTS.md` and migration `202611030039_prevent_overlapping_warehouse_stock_counts.sql`. Static QA snapshot: 703/703 checks across 42 suites; this does not imply live database or production verification.


### Latest warehouse increment — database-enforced single active stock count (3 November 2026)

Migration `202611030040_enforce_one_active_stock_count_per_warehouse.sql` adds a partial unique index allowing at most one `counting` or `submitted` physical stock count per warehouse. Migration 039's advisory lock and friendly RPC conflict check remain in place; the unique index is a final database integrity backstop for future privileged write paths and status transitions. The migration first checks for historical duplicate active counts and stops with an actionable error rather than cancelling or deleting records. Approved, rejected and cancelled history remains retained and outside the index. The existing count remains full-warehouse; targeted cycle-count functionality is not introduced. See `docs/PHASE_10_ACTIVE_STOCK_COUNT_UNIQUE_INDEX.md`. Static QA is recorded in `qa/static_qa_summary.json`; it does not imply live Supabase execution or production readiness.


## Latest Phase 10 update — visible stale stock-count snapshots

Migration `202611030041_expose_stale_stock_count_snapshots.sql` extends the protected stock-count register with a live stale-line count and boolean stale flag. A snapshot is stale when a batch is missing, its stock version or quantity differs from the captured snapshot, or it has been disposed. The warehouse register and selected-count detail now display this condition before review; the existing database approval guard still blocks stale approvals. This read model is read-only and does not adjust stock.

Static checks for this increment: 16/16. The aggregate QA report is maintained in `qa/static_qa_summary.json`. Live PostgreSQL/Supabase execution, full framework build, authenticated end-to-end tests and deployment are not implied.


### Warehouse stock-count stale-line diagnostics

Active stock-count details now explain each stale batch line using read-only reasons: unavailable batch, changed quantity, disposed batch, or other stock-attribute change. The workspace also shows the latest quantity, stock status and inspection status for investigation. These diagnostics do not refresh count snapshots or modify inventory. Completed counts remain historical records and are not retroactively labelled stale. Apply migration `202611030042_explain_stale_stock_count_lines.sql` after migration 041.


### Latest warehouse increment — stock-count search and exception filters (3 November 2026)

The selected physical stock-count detail now supports in-page search across product name, SKU, batch/lot code and bin, plus quick filters for all lines, uncounted lines, variance lines, stale snapshot lines and matched lines. Each filter displays its current count, and the UI announces the visible result count. “Matched” excludes stale lines. Filtering runs over the batch-line snapshot already returned by the protected read RPC; it does not query or mutate inventory, refresh a snapshot, alter physical counts or bypass server-side count and variance-investigation actions. The filters are keyboard-operable and adapt to narrow screens. No database migration is required. See `docs/PHASE_10_STOCK_COUNT_LINE_SEARCH_FILTERS.md`.

Static QA for this increment: 24/24 source checks. The consolidated report is generated by `qa/build_static_qa_summary.py`. This is static verification only, not a live browser, database, full build or semantic typecheck result.

### Latest Phase 10 increment — physical stock-count CSV export (3 November 2026)

The selected stock-count view can export the currently visible batch lines to CSV, respecting the active search and exception filter. The report captures the original system snapshot, physical quantity, signed variance, stale reasons and current diagnostics, escalation, count notes, investigation evidence and timestamp. CSV cells are quoted and formula-like values are neutralised. This is a browser-side, read-only export of the protected data already displayed; it does not change stock, refresh snapshots or approve counts. No migration is required. See `docs/PHASE_10_STOCK_COUNT_CSV_EXPORT.md`. Static checks are recorded in `qa/phase10_stock_count_csv_export_static_results.json`; browser download and production behaviour remain unverified.


## Latest Phase 1 increment — Rasvani visual redesign (3 November 2026)

The public experience now uses the new **Living Pantry of India** visual direction. The homepage has a top-level regional search, editorial hero, map preview, story pillars, producer partnership section, Better Choices section and a distinct Explore India destination. New dedicated `/india-map` and `/better-choices` routes have been added; `/explore-india` remains separate and retains the existing reviewed regional search and 36-region directory. Food Stories and For Producers pages have been redesigned, and the new premium design system also styles existing catalogue/product pages without bypassing their approval controls.

The India Map experience keeps the entire India → State/UT → District → Vegetarian Food journey within `/india-map`. All 36 canonical regions are selectable. The map now loads 2024 Local Government Directory state/UT and district vector polygons through MapLibre + PMTiles, with hover highlight, visible region labels, State_LGD-based district filtering, selected-state zoom and a complete region index fallback. Bihar includes 38 district shortcuts. This is a 2024 snapshot and must be revalidated against the latest LGD release and formally approved for ongoing use before production; source attribution and the dataset licence are shown on the map.

Vegetarian discovery now has a separate quality gate. Product records default to `unverified` / `pending_review`; only explicitly approved `vegetarian` or `vegan` classifications are eligible for State/District collections and regional catalogue filters. Approval requires a supporting evidence reference and is audit logged through migration 043. Existing product regional associations alone are not sufficient to publish a food in the vegetarian discovery journey. Actual district food imagery is shown only from approved media linked to that exact product; where no approved product or matching media exists, the district page displays an editorial curation-pending state rather than an unrelated AI image.

The global language selector exposes English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Odia and Assamese; its current selection persists across navigation. Initial dictionary translations cover the shared navigation and primary homepage, map and Explore India UI. This does not yet complete full professional localisation of every product/story/account/portal/checkout field. The translation workspace and reviewed locale-aware search remain in place; machine-generated dish names and regional claims are not automatically published.

Commerce is not faked: current Shop and product detail routes continue to show only approved published data. Prices, live inventory, pack-size selection, Add to Cart, customer cart, checkout and payment gateway remain incomplete/disabled pending required owner decisions, product and stock records, fulfilment configuration and payment integration. The confirmed producer → Rasvani warehouse/collection centre → customer model and all original 29-page PDF / Master Specification v3.0 requirements remain governing.

Design details: `docs/PHASE_1_VISUAL_REDESIGN_2026-11-03.md`. Static source checks: `qa/phase1_visual_redesign_checks.py`. The redesign suite validates boundary-map wiring, vegetarian review gates, 36-region and Bihar district records, locale codes, responsive/reduced-motion visual system and preservation of baseline files. Current static QA is 833/833 across 48 suites. This is source-level verification only—not a browser, visual, semantic typecheck or production test. TypeScript syntax transpilation covers 60 implementation files with zero syntax diagnostics. The full Next.js build and browser preview are not run in this sandbox. The user must install the updated MapLibre/PMTiles dependencies locally before starting the dev server; full local verification is still required.

## 3 November 2026 — full screen-recording review update

The 4:12 user screen recording was reviewed across its full timeline. The update addresses the observed indefinite blank map, the protected producer-application route failure when local Supabase settings are absent, Bihar's empty district index in an unconfigured local run, empty editorial image tiles on Food Stories, and customer-facing technical setup copy. Public-facing AI/image-creation labels and the producer-art notice were removed. See `docs/VIDEO_REVIEW_AND_REMEDIATION_2026-11-03.md` for the time-coded findings and remaining dependencies.

Static QA now includes the video-review regression suite. The consolidated result is **854/854 checks across 49 suites**; it is a static source result, not a live browser, database, map-network or checkout test.

## Homepage interactive India map update — 3 November 2026

- The homepage now embeds the same `IndiaMapExperience` component as the dedicated `/india-map` route. Customers can begin the State/UT → District → Vegetarian Food journey directly on Home without replacing or merging the separate Explore India page.
- The homepage order is search band, circular food-image hero, full-width interactive map and region index, featured collections, stories, producer partnerships, Better Choices and a separate Explore India preview near the end.
- The map lists all 28 States and 8 Union Territories; map shapes/labels use the dated 2024 LGD boundary snapshot via Bharatlas PMTiles. Bihar's 38 district names remain available as navigation records. District food content is not invented and remains pending until associations and matching catalogue records are reviewed.
- Static checks for this update: 22/22 homepage/map checks, 29/29 video-review regressions, 884/884 consolidated static checks across 50 suites, and syntax transpilation of 60 TS/TSX files with zero syntax diagnostics.
- See `docs/HOMEPAGE_INTERACTIVE_INDIA_MAP_2026-11-03.md` for scope, design hierarchy, data limitations and testing boundaries. Static checks do not imply live browser, map-network, Supabase or checkout verification.


## Owner correction — separate homepage, India Map and Explore India (3 November 2026)

The homepage must not embed the full interactive India Map. The homepage remains a premium food-led landing page with search, featured regional food themes, stories, producer partnership, Better Choices and a lower-page Explore India preview. The complete State/UT → District → Vegetarian Food map journey is exclusively on `/india-map`. `/explore-india` remains a separate regional directory and reviewed food-discovery experience. The homepage map embedding introduced in the previous increment has been removed; the dedicated map component and route are preserved.

## India district taxonomy audit — 3 November 2026

The existing 2024 Bharatlas PMTiles archive is a historical 785-district geometry snapshot. The Ministry of Panchayati Raj LGD portal reported 790 districts across 36 States/UTs on 3 November 2026. The district-name index and geometry therefore require a dated official LGD refresh and code-level reconciliation before the India-wide district requirement can be called complete. No district food examples are seeded; food-to-district associations remain evidence- and approval-gated. See `docs/INDIA_DISTRICT_DATA_AUDIT_2026-11-03.md`.

## Current continuation verification — 3 November 2026

- Homepage map separation: 23/23 focused static checks passed. The full map is exclusively on `/india-map`; the homepage retains a lower Explore India preview.
- Navigation motion: 23/23 focused static checks passed after bounded pointer tilt, pointer-follow glow, account action and mobile menu motion updates.
- Premium editorial assets: 15/15 focused asset/source checks passed for four new WebP assets. These are decorative editorial images, not actual product or producer evidence.
- State/UT category discovery is now wired to active categories linked to approved regional vegetarian/vegan products, with distinct-product counts and clear Shop-filter scope.
- TypeScript/TSX syntax transpilation: 60 application files, zero syntax diagnostics; this is not semantic typechecking.
- Fresh full static script rerun: all 53/53 registered Python source-check scripts passed. The rebuilt consolidated report is 885/885 across 50 suites (PASS). These remain static source checks only, not a framework build, live database, browser, security, accessibility or performance sign-off. The earlier 884/884 figure is a historical snapshot.
- Legacy Phase 1 prototype browser QA passed desktop/tablet/mobile, but this does not test the current Next.js application.
- Dependency installation timed out because npm registry access was unavailable. The current Next.js build, semantic typecheck, ESLint and live application browser tests remain NOT RUN. Supabase migrations/RLS and payment/shipping integrations remain unverified.

See `docs/PROJECT_AUDIT_2026-11-03.md`, `docs/INDIA_DISTRICT_DATA_AUDIT_2026-11-03.md` and `docs/PHASE_1_IMAGE_ASSET_REGISTER.md` for the complete audit and current limitations.

## Current creative direction and P0 map work

- Final creative direction and P0 India map remediation: `docs/FINAL_CREATIVE_DIRECTION_AND_P0_REMEDIATION_2026-11-03.md`

## Siwan sweets visual update (4 November 2026)
- Added Khoya Barfi, Peda and Doodh ke Laddoo to the Siwan Festival Sweets collection with separate image assets and individual CSS 3D motion treatments.
- These are labelled as local sweet-shop coverage, not as Siwan-exclusive inventions. The cited local coverage names these mawa sweets; the official district page describes Siwan's local sweet-shop/desi-ghee sweets tradition without naming individual varieties.
- Removed visible AI-generation disclosure labels from the Siwan experience and the generic district editorial copy. Image filenames retain legacy suffixes for path compatibility; those suffixes are not displayed.
- The visual motion is CSS-based 3D depth/camera movement on image cards, not a rendered video animation.
- Static source checks were run for the three entries, image paths, visible label removal, and exclusion of Thekua/Khirmohan/Tikri from this Siwan sweets increment. A full build was not run because dependencies are not installed in this snapshot.


## Siwan district visual correction — 4 November 2026

- The dedicated `/explore-india/bihar/district/siwan` route now uses a cinematic Mehandar hero with layered orbit, glow and camera movement.
- The Siwan food category selector is an icon-only logo strip: All Foods, Meals, Snacks, Meals & Drinks, and Festival Sweets. Category cards contain custom SVG marks and no food photographs.
- The ten food cards retain one matching editorial image asset per dish and use layered cinematic image movement. The hero now adds a touch-draggable, keyboard-accessible 3D carousel containing all ten food illustrations. Reduced-motion preferences are respected.
- Customer-facing food names are English; `Doodh ke Laddoo` is displayed as `Milk Laddoo`.
- Siwan's existing dedicated route, producer/story/About sections, source notes and product-approval boundaries are preserved.
- Focused static QA: 14/14 Siwan checks passed; TSX syntax transpilation: 0 diagnostics. The full Next.js build, live browser rendering, Supabase and end-to-end checks remain unverified because dependencies are not installed in this environment.

### Siwan district visual refresh — 4 November 2026
The Siwan district landing page now places its own editorial experience ahead of the generic district template. The Mehandar hero uses a cinematic image treatment, followed by a real-time WebGL architectural interpretation with mouse/touch drag rotation, wheel zoom and reset controls. The model is an artistic 3D interpretation, not a photogrammetric scan or a claim of exact architectural survey. Siwan's food collections use five dedicated illustrated category emblems (All Foods, Meals, Snacks, Meals & Drinks and Festival Sweets), English dish names, individual food artwork and interactive filtering. The district-specific food list remains separate from every other Bihar district. The local editorial images are not producer product photographs; product publication still requires approved producer and product records. Static Siwan experience checks: 19/19. Full dependency installation, Next.js build and live browser/device testing were not completed in this environment and must be run locally before approval.

## Siwan food-led page update — 5 November 2026
- Removed the Mehandar three-dimensional temple stage and the Mehandar hero artwork from the Siwan page layout.
- Added the requested seven food names: Khaja, Balushahi, Kala Jamun, Mawa Barfi, Peda, Doodh Laddoo and Sattu; the page search and category filters operate on these names and descriptions.
- Reworked the Siwan hero to a food-led visual, retained the Local Producers and Food Stories & Vlogs sections, and kept visible interface copy in English.
- Added product-specific CSS depth/floating visual treatments. These are stylised CSS illustrations, not true rotatable 3D food meshes and not individually generated product photographs. The existing image files are not misrepresented as photos of the wrong food.
- Evidence caveat: local sweet-shop coverage is not proof of Siwan-exclusive origin. The official Siwan district culture page names Sattu among foods popular in Siwan; the other sweet names remain locally covered items requiring producer/community confirmation before being promoted as district-origin specialities.
- Seven-day shipping shelf life is not certified. Each maker's recipe, water activity/moisture, packaging and storage conditions require validation before listing a product as safe for a seven-day journey.
- This archive is an updated development source package, not a production-ready or QA-certified final release. Full framework build, semantic typecheck, live browser tests, database/RLS, inventory, payment and shipping integration verification have not been performed in this environment.


## 5 November 2026 — Siwan food imagery, 3D carousel and map handoff

- Expanded the Siwan food collection to ten entries by including all four foods named by the official district culture page (Litti Chokha, Kadhi, Jhal Muri and Sattu) alongside six locally covered sweet-shop items. The sweet-shop entries remain clearly distinguished from official district references and are not described as exclusive Siwan-origin foods.
- Added a matching local image asset to every Siwan food card. These visuals are illustrative editorial artwork, not verified photographs of Rasvani producer products or retail packaging. The page continues to require producer, label, recipe, stock and shelf-life checks before sale.
- Added a CSS 3D image carousel to the Siwan hero, with automatic slow rotation, pointer/touch drag, keyboard arrow controls, previous/next controls, pause/resume and reduced-motion support. It uses existing local images and adds no 3D runtime dependency.
- Added a direct hero link to the dedicated `/india-map` experience; the existing interactive 36-region MapLibre/PMTiles map and district-list fallback are retained. Its 2024 boundary snapshot is still historical and is not presented as the current official district master.
- Added six distinct illustrative images to the currently recorded Bihar official-source research leads: Maner Laddoo, Khoye-ki-Lai, Silao Khaja, Gaya Tilkut, Kheer-Makhana and Belgrami. Their pages continue to mark each record as editorial-review-pending; the illustrations do not change their approval status.
- Focused static QA: see `qa/siwan_reel_3d_category_static_results.json`. Static checks do not certify a live browser interaction, Next.js build, database, map-network response, or production readiness.

## Homepage Bihar ODOP district atlas and India map continuation — 5 November 2026

> Historical implementation note: this first homepage ODOP crop gallery was superseded later on 5 November 2026 by the exact vegetarian dry-snack atlas based on the attached Rasvani research PDF. ODOP reference data remains separate and is not the homepage snack catalogue.

- Added a complete 38-card Bihar district pantry section to the homepage, sourced from the Ministry of Food Processing Industries PIB ODOP annexure published on 19 December 2023. The cards support district/item search and category filters, display one image for every district entry, and link to their corresponding district guide.
- Added 26 distinct AI-generated illustrative food/agro-product images used across the 38 district entries. Repeated ODOP focus categories reuse the same matching visual. These images are not actual product/packaging photographs and do not establish food origin, producer approval, ingredients, licences, live stock or a sellable SKU.
- Added the ODOP spotlight to all Bihar district guide routes, including the dedicated Siwan route, and connected the selected Bihar district step in the India map to its ODOP entry.
- Improved `/india-map`: retained all 36 region selection options, added camera presets when a State/UT is selected through the index, and added a searchable district index populated from loaded district vector-tile features. Bihar retains its static 38-district index.
- Updated the visible boundary disclosure to say LGD 2024 snapshot via Bharatlas (785 mapped district polygons). This remains historical geometry and must not be described as the current 2026 LGD district master; the latest official register/geometry still needs code-level reconciliation.
- Focused static QA: ODOP/map 22/22; homepage map regression 23/23; district discovery 22/22; district guide content 17/17; Siwan food and 3D regression 22/22. Consolidated source-level QA: 929/929 across 52 suites. This is static verification, not live browser/build validation.
- Six changed TypeScript/TSX files passed TypeScript transpile-only syntax diagnostics. `npm run typecheck` was attempted but is blocked by missing dependencies: the project snapshot has no `node_modules` and no package lockfile. Next.js build, live map-network behavior and browser/device visual tests therefore remain pending local dependency installation.

Implementation record: `docs/HOMEPAGE_BIHAR_ODOP_DISTRICT_ATLAS_2026-11-05.md`. Focused QA: `qa/homepage_bihar_exact_dry_snacks_and_full_map_checks.py`.


## 5 November 2026 — Exact Bihar vegetarian dry-snack research atlas

- Replaced the homepage's prior ODOP crop gallery with the exact 38-district vegetarian dry-snack list from the user-supplied `DOC-20261105-WA0005.pdf`: 38 district rows, 103 named snack entries and 32 distinct displayed snack-name variants. Food names follow the supplied table, including its wording and spelling variants.
- Each district card shows all listed snacks with an illustrative thumbnail, exact district/speciality context, a district-linked-candidate or Bihar-wide-fallback label, and a link to the existing district guide. Search and relationship filters are included.
- The Bihar district-selection step on `/india-map` now presents the same research-list snacks and status labels for the selected district. The 36-region map navigation remains in place.
- The Kaimur label remains `Kaimur` as written in the supplied food list and is routed to the canonical `Kaimur (Bhabua)` district URL.
- Retained the document's exclusions (including fresh fruit, wet dishes and Litti with chokha, pittha, dahi-chura, makhana kheer and fresh malpua) and the rule that a Bihar-wide fallback must not be described as district-origin food. Shelf-life is a candidate claim only; “7 days or more” requires exact batch and sealed-pack validation. Belgrami, Batisa and Papdi retain recipe-specific cautions.
- Each snack has an illustrative AI artwork reference. These thumbnails do not represent actual producer products, packaging, stock, origin proof or inspection. No item becomes purchasable through this gallery.
- Focused QA: 26/26 checks, including exact row-by-row comparison of 103 snack names and image-path coverage. This is static verification only. Next.js build/live browser/map-tile tests remain pending because dependencies are not installed in this environment.

Implementation record: `docs/HOMEPAGE_BIHAR_EXACT_DRY_SNACK_ATLAS_2026-11-05.md`. Focused QA: `qa/homepage_bihar_exact_dry_snacks_and_full_map_checks.py`.


## 2026-11-05 — Food scope cleanup (current)
- Removed the separately added 38-district ODOP programme dataset and its district-page spotlight. ODOP produce entries are not part of the active food catalogue.
- Kept the exact 38-district / 103-entry vegetarian dry-snack list transcribed from `DOC-20261105-WA0005.pdf` on the homepage and Bihar district selection panel.
- Kept existing food content and research leads from the user's original `Rasvani_Project_With_Three_Food_Images` ZIP, including the existing Siwan entries and six pending Bihar research leads.
- Retained only the generated snack illustrations referenced by the supplied PDF snack list; renamed those assets so they no longer carry ODOP programme naming.
- Kept the India map label-collision repair and all existing map interactions.
- Focused source QA: `qa/homepage_bihar_exact_dry_snacks_and_full_map_checks.py`.
