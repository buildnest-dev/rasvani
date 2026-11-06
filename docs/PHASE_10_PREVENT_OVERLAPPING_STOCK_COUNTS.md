# Phase 10 — Prevent overlapping full-warehouse stock counts

## Change

Migration `202611030039_prevent_overlapping_warehouse_stock_counts.sql` hardens the existing full-warehouse physical stock-count creation workflow.

The current count snapshot includes every non-disposed batch in the selected warehouse. Creating another count for that same warehouse while an earlier count is still `counting` or `submitted` would create overlapping snapshots and competing review work. The protected creation RPC now rejects that situation.

## Concurrency control

The RPC obtains a transaction-scoped advisory lock derived from the warehouse UUID before checking for an active count and creating the new snapshot. Concurrent creation requests for the same warehouse are therefore serialized. Different warehouses use different lock keys and remain independent.

A count in `approved`, `rejected` or `cancelled` state does not block a new count. `counting` and `submitted` states do block it. A submitted count remains blocking until independent review is completed; this avoids opening a second full-warehouse snapshot while the earlier snapshot is awaiting a decision.

## Preserved controls

- Existing warehouse operator/admin role gate and active-warehouse check.
- Full-warehouse snapshot of non-disposed batches; no targeted/bin cycle-count scope is introduced.
- Batch expected quantity and stock-version snapshot.
- Empty warehouse count rejection.
- Creation audit event, now explicitly labelled `full_warehouse` scope.
- No inventory mutation during count creation. Physical adjustments remain restricted to the existing independent approval flow.

## Operational note

If a warehouse has an open or submitted count, staff must finish or cancel/reject it through the existing authorised workflow before starting another. This migration does not auto-cancel, merge, or delete previous count evidence.

## Verification boundary

`qa/phase10_prevent_overlapping_stock_counts_checks.py` contains static source assertions. It does not replace execution against a disposable Supabase/PostgreSQL environment or concurrent authenticated integration tests. Those remain required before production use.
