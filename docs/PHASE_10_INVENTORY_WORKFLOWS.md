# Rasvani Phase 10 — Inventory workflow implementation

## Added in migration 003

- Seeds all 28 states and 8 Union Territories as unpublished regional records.
- Adds active-reservation lookup indexes.
- Adds `reserve_order_stock`: authenticated order owner or warehouse/admin staff can allocate eligible stock; allocation traverses batches in FEFO order, uses row locks, excludes expired/non-sellable/non-accepted stock, writes reservations and movement/audit records, and rolls back the complete allocation if quantity is insufficient.
- Adds `set_batch_inspection`: quality/warehouse/admin roles can accept, quarantine or reject a batch with a mandatory reason. Expired, recalled, disposed and damaged batches cannot be reclassified by this function.
- Adds `recall_product_batches`: quality/admin roles can block all affected product batches and create movement/audit records.
- Restricts direct client writes to movement, inspection and reservation records.

## Important limitations / required next work

- This migration has not been applied to a live Supabase project. Review and test it in a disposable project first.
- The reservation function is a transactional allocation primitive, not a complete checkout/payment workflow. Order creation, idempotency keys, payment authorization/capture, reservation expiry worker, and cancellation/release RPCs remain required.
- Receiving still needs an end-to-end receipt workflow, checklist templates by category/storage type, photo storage policies, quantity reconciliation and supplier discrepancy handling.
- Recall currently blocks batches for a product. A production recall workflow must also identify affected order lines, dispatches and customers, create notifications/case records, and support regulator/producer communications.
- Movement `quantity_delta` semantics and stock ledger reconciliation need a formally approved unit-of-measure policy and independent accounting review.
- FEFO treats a null expiry date as last. Products for which expiry is mandatory must be prevented from receiving without a date through category-specific validation.
- Expiry status is excluded at allocation time by date predicate; scheduled expiry sweeps and alert delivery are still needed.
- Run SQL linting, migration tests, concurrency tests and RLS/security review against a real Supabase staging project before production use.

## Additional increment — receiving, returns and expiry
Migration `202611020004_receiving_returns_expiry.sql` adds:
- A seeded common receiving checklist covering identity, lot code, quantity, packaging, damage/contamination, labels/documents, date codes and storage condition.
- A transactional batch-receiving function that validates warehouse/bin association and mandatory checklist completion, records inspection evidence, and creates the received batch in quarantine.
- Return cases that always enter quarantine, followed by a separate quality-review decision. A return marked usable is **not** automatically returned to sellable stock; a separately controlled stock adjustment is still required.
- An expiry-monitoring view for expiry/best-before dates and an explicit function to block batches whose controlling date has passed.

The expiry view provides data for a scheduler, but no scheduler, email/SMS delivery or alert acknowledgement UI is configured. The return workflow intentionally does not decide refund/replacement policy. These SQL functions have only passed static source checks; PostgreSQL/Supabase execution remains unrun.

## Reservation lifecycle increment — migration 005
- Reservation totals are guarded against exceeding the ordered quantity for that product, with the order row locked while the guard evaluates concurrent changes.
- Customer/authorised warehouse staff can release active reservations with a reason; release is ledgered.
- A restricted server-side cleanup function releases expired reservations; it is not executable by browser roles.
- Warehouse staff can consume active reservations for dispatch in one transaction, rechecking batch eligibility and physical quantity, decrementing on-hand stock, writing movement records and advancing the order to dispatched.
- Payment capture, carrier booking/tracking, refunds and fulfilment notifications remain unintegrated. PostgreSQL concurrency and transaction tests have not run.
