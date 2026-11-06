# Rasvani QA evidence

| Suite | Result | Scope |
|---|---:|---|
| Phase 1 browser regression | Passed (prior run) | Prototype UI, assets, tested interactions at desktop/tablet/mobile |
| Phase 2 static foundation | 15/15 | Route/source/security structure checks |
| Phase 3–10 structural checks | 8/8 | New route/schema/migration structure |
| Next.js production build | Not run | npm dependencies unavailable in sandbox |
| Full TypeScript typecheck / ESLint | Not run | npm dependencies unavailable in sandbox |
| Supabase migration / RLS integration | Not run | No connected development project |
| Payment / carrier / warehouse concurrency integration | Not run | Payment/carrier integrations and live Postgres concurrency tests are not configured |

Do not interpret structural checks as integration, security certification or production acceptance. Re-run all relevant suites on a network-enabled local machine and a disposable Supabase project before launch.

## Latest static suites

- Editorial / translations / consent: 12/12 static checks.
- Admin / warehouse / locale reporting: 13/13 static checks.
- Combined current snapshot: 154/154 across 12 suites (`static_qa_summary.json`).
- Rebuild with `python qa/build_static_qa_summary.py` after running the individual suite scripts.
- These results do not substitute for PostgreSQL/Supabase migration execution, RLS tests, app build, end-to-end, penetration, accessibility or performance testing.


### Protected admin dashboard UI
- Static route, role-guard, RPC usage, aggregate-only presentation and responsive-style checks: 11/11.
- The page has not been runtime-tested because dependencies and a connected Supabase project are unavailable in this sandbox.
- Rebuild the current aggregate with `python qa/build_static_qa_summary.py`; the latest summary includes nine static suites.


### Protected producer self-service portal
- 18/18 static source checks: form fields, role guard, region allowlist, narrow RPC use, no role self-assignment, own-application status and responsive layout.
- No producer identity documents are collected in this increment; secure document workflow and legal/privacy review are still required before document upload is enabled.
- Live Supabase execution, application flow/browser tests and reviewer queue UI: NOT RUN.


### Phase 3 regional discovery and search
- Directory: 12/12 checks; district discovery: 22/22; cross-region food search: 31/31.
- Search checks cover reviewed aliases across the 12 planned locales, approved/published product and regional filters, bounded input/results, safe empty states, and Shop alias search.
- The current consolidated snapshot is **376/376 static checks across 24 suites** (`static_qa_summary.json`).
- A TypeScript parser pass also parsed 48 `.ts`/`.tsx` files with zero syntax diagnostics. This is syntax parsing only, not typechecking.
- No framework build, semantic TypeScript check, ESLint, live Supabase/PostgreSQL/RLS run, authenticated browser test, penetration test, formal accessibility audit or performance test is claimed.

### Accurate warehouse receiving checklist outcomes (2 November 2026)
- Warehouse intake can now record Pass or Fail for each mandatory common checklist item instead of requiring all checks to be falsely marked as passed.
- A failed check requires a finding/corrective-action note and is sent to the existing database receiving function. Batches remain quarantined; the database blocks acceptance where any recorded common check failed.
- Protected warehouse workspace static source checks: 30/30. Consolidated static verification: 516/516 across 30 suites.
- Receiving photo upload, storage/product-specific checklist template rendering, live database verification and authenticated browser tests remain NOT RUN / NOT ENABLED, as applicable.

### Receiving checklist template editing (2 November 2026)
- Administrators can edit active custom template titles, category scope, storage scope and mandatory/optional status.
- Built-in common receiving controls cannot be edited. Each change records before/after values in the audit log; historical inspection rows are preserved.
- Focused static suite: 16/16. Consolidated snapshot: **613/613 across 36 suites** (`static_qa_summary.json`).
- TypeScript syntax parsing: 51 `.ts`/`.tsx` files, zero syntax errors. This is not semantic typechecking.
- Apply migration `202611020033_receiving_checklist_template_editing.sql` after migrations 001–032. Live migration execution, framework build, typecheck, lint and authenticated browser testing remain NOT RUN.

### Immutable stock-count investigation evidence (3 November 2026)
- Focused static suite: 10/10. A submitted variance line's first independent investigation finding cannot be overwritten through the protected RPC.
- Consolidated static snapshot: **689/689 across 41 suites** (`static_qa_summary.json`).
- This is static source verification only. Live PostgreSQL/Supabase execution, authenticated browser workflows, full typecheck/build and formal security/accessibility/performance testing remain NOT RUN.
- Apply migration `202611020035_immutable_stock_count_investigation.sql` after migration 034 in a reviewed development sequence.


### Open stock-count cancellation (3 November 2026)
- Focused static checks: 14/14. Only the creator or an administrator can cancel a `counting`-status count, with a required reason. Snapshot lines and entered quantities remain preserved; no inventory quantity is changed. Submitted/finalised counts cannot be cancelled.
- Consolidated summary includes the migration, server action and responsive workspace wiring. This is static source verification only; a live Supabase migration, role/session tests and authenticated browser workflow remain unrun.


- `phase10_stock_count_line_audit_checks.py` — validates before/after audit coverage for each physical stock-count line save/correction.

- Stock-count decision audit read model/register: 19/19 static checks. The register now shows final review or cancellation reasons without requiring the count detail page.


- Visible stale stock-count snapshot read model and UI: 16/16 focused static checks. Rebuild the consolidated report with `python qa/build_static_qa_summary.py`.


- `phase10_stock_count_line_search_filters_checks.py` verifies the stock-count detail search dimensions, five exception filters and counts, accessible state/result announcements, retained server actions, stale diagnostics and responsive focus styling. It is a static source check and does not simulate a browser interaction.

### Homepage Bihar ODOP gallery and India map continuation

Run `python qa/homepage_bihar_exact_dry_snacks_and_full_map_checks.py` to verify the currently approved original-ZIP plus supplied-PDF food scope, image-path coverage, homepage search/filter/link wiring, Bihar district selection, dynamic district-index wiring and map-date disclosure. They do not verify live map tiles or a production Next.js build.


### Exact Bihar dry-snack atlas and map integration

Run `python qa/homepage_bihar_exact_dry_snacks_and_full_map_checks.py` to compare all 38 district rows and 103 snack entries against the row-by-row expected list transcribed from the supplied `DOC-20261105-WA0005.pdf`, validate artwork paths and caveats, and check homepage/map wiring. The source dataset deliberately separates district-linked candidates from Bihar-wide fallbacks. These are static checks only; they do not verify producer origin, exact recipe, sealed-pack shelf life, live tiles, live Supabase, or browser rendering.

### India map label-overlap repair (5 November 2026)

The supplied map screenshot exposed state-name collisions caused by the state symbol layer explicitly allowing text overlap and ignoring existing placements. The state label source now contains one point per State/UT, with collision-safe adaptive placement. The focused route suite checks the 36 label anchors against the region directory. Run `python qa/phase1_homepage_live_map_checks.py`; this remains a source-level check until the Next.js app is installed and rendered in a browser. See `docs/INDIA_MAP_LABEL_OVERLAP_REPAIR_2026-11-05.md`.
