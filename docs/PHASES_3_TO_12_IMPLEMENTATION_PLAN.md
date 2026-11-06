# Rasvani Phases 3–12 implementation register

This register records the domain foundation added in the current increment. It does not claim live integrations or production launch.

## Phase 3 — Regional discovery
- Searchable accessible directory for all 28 states and 8 Union Territories.
- Region detail routes generated from canonical region taxonomy.
- Regional content is explicitly marked as pending verification; no unverified food/product claims.
- Interactive geographic map and licensed boundary/map provider remain a follow-on item within Phase 3; do not substitute an inaccurate hand-drawn map.

## Phase 4 — Catalogue
- Product/category/claim-review/price schema.
- Approval status and publication timestamp gate public product visibility.
- Producer identity, ingredients, allergens and storage conditions represented.
- No sample commercial products, claims, prices or certifications inserted.

## Phase 5 — B2C commerce
- Customer order and order-line schema with integer paise amounts, address snapshot and explicit status lifecycle.
- Batch reservations are modelled separately. Atomic reservation and payment provider integration remain unimplemented pending backend RPC and owner decisions on seller, payment and fulfilment.

## Phase 6 — Producer onboarding
- Producer profile, facility and application schema with independent review states.
- Producer approval is distinct from facility and product approval.

## Phase 7 — B2B
- Business accounts, trade enquiries and quote lifecycle schema. Tax and legal verification data are not asserted as validated.

## Phase 8 — CMS
- Editorial content types and review/publish lifecycle. Public reads require approved status and publication timestamp.

## Phase 9 — Multilingual
- Translation records for the 12 approved architecture locales: en, hi, bn, ta, te, mr, gu, pa, kn, ml, or, as.
- Translation review state is explicit. No machine-generated translation is marked professionally reviewed.

## Phase 10 — Warehouse and inventory
- Multi-warehouse/bin model, receipt, inspection checklist, unique product batch, batch dates, status, stock movement and reservation tables.
- FEFO index supports expiry-priority queries. FIFO can be used for products without expiry.
- Quarantined/rejected/damaged/expired/recalled/disposed stock is not sellable by status design.
- This migration is a data foundation, not a complete warehouse execution system. Atomic stock ledger/RPC, alert scheduler, FEFO allocation, recall propagation, returns quarantine and role-scoped screens still require implementation and database integration tests.

## Phase 11 — QA and launch readiness
- Maintain separate results for static checks, browser checks, database integration, security review, accessibility and performance.
- Network-dependent framework build and live Supabase tests are marked BLOCKED/NOT RUN where unavailable, never passed by assumption.

## Phase 12 — controlled expansion
- Expansion gates require verified regional content, producer/facility/product approvals, operational capacity, legal review, support readiness and measured fulfilment performance.
- No automatic launch or geographic availability claims.

## Open owner decisions
Legal seller, title/risk transfer, warehouse premises, purchase/consignment, inbound logistics, category storage capabilities, shelf-life thresholds, shipping geography/carriers, returns/refunds, payment/funds flow, producer settlement, tax/pricing, support, map provider/licence, launch languages, brand assets, domain/hosting budget, staff role assignments, retention/legal review, analytics consent, B2B commercial terms, reviews policy, delivery timeline/resources.

### Phase 10 — additional workflow increment (migration 004)
- Mandatory common receiving checklist seeded; storage-specific checklist rows can be configured.
- Receipt function validates an active bin in the receipt warehouse, enforces mandatory checklist completion, stores inspection evidence and places newly received stock in quarantine.
- Return case and separate quality inspection lifecycle added; returned food is quarantined and never automatically reinstated as sellable stock.
- Expiry/best-before watch view and explicit expired-stock blocking function added. A scheduled runner and notification delivery remain unconfigured.
- Static source checks: 11/11 passed. PostgreSQL execution, concurrency tests and role/RLS integration tests: NOT RUN.

### Phase 5/10 — reservation lifecycle increment (migration 005)
- Added order-line quantity guard for reservations and order-row serialization.
- Added auditable release, restricted expiry cleanup and transactional stock consumption for dispatch.
- Dispatch rechecks sellable/accepted status, expiry/best-before and physical on-hand quantity before decrementing stock.
- Static source checks: 11/11 passed. PostgreSQL execution, concurrency, payment and carrier integration: NOT RUN.


## Latest increment — Phases 5 and 7 (migration 007)
- Added authenticated customer order initiation from published products and current catalogue prices. Payment remains explicitly unconfigured; no payment capture, tax, shipping or delivery promise is implied.
- Added controlled pre-dispatch cancellation with reservation release and inventory movement/audit entries.
- Added admin business-account verification, verified-account trade enquiries, admin quote issuance and owner-only quote response. Quote acceptance does not create an order or settle funds.
- Verification: 17/17 static checks passed (`qa/phase5_7_commerce_b2b_static_results.json`). Live PostgreSQL/Supabase execution remains not run.


### Latest increment — Phases 8, 9 and 11 (migration 008)
- Added audited CMS draft, submit, review, publish and archive transitions with author/admin/editor gates.
- Added translation draft/submission/review lifecycle for the 12 configured locales; approved translations are public only when the source editorial item is also approved and published.
- Added append-only consent decision history with policy-version capture; withdrawal is represented as a new `granted=false` record. Legal wording, lawful basis and retention remain owner/legal decisions.
- Static checks: 12/12 passed. PostgreSQL/Supabase execution and RLS integration remain NOT RUN.

### Phase 8/9 — editorial, translation and consent workflows (migration 008)
- Editorial draft, submission, review, publication and archive transitions are explicit and audited; publication is separate from approval.
- Translation drafts support the 12 architecture locales and require a separate quality-review decision before public translation eligibility.
- Consent decisions are append-only and withdrawal is recorded as a new negative decision; legal wording, lawful basis and retention remain owner/legal decisions.
- Static checks: 12/12 passed. PostgreSQL/RLS integration: NOT RUN.

### Phase 11 — operational reporting (migration 009)
- Added role-gated aggregate admin review-queue counts without customer/producer personal details.
- Added warehouse stock-status summary for warehouse/quality/admin roles.
- Added 12-locale editorial translation coverage summary for editorial/quality/admin roles.
- Reporting RPCs are read-only, revoke public/anonymous execution and expose no arbitrary customer/order export.
- Static checks: 13/13 passed. Live role/RLS execution and query-plan/performance validation: NOT RUN.

### Latest static QA snapshot
- 102/102 static source checks passed across eight suites (`qa/static_qa_summary.json`).
- This is not a live database, framework build, end-to-end, security certification, accessibility audit or production acceptance result.
