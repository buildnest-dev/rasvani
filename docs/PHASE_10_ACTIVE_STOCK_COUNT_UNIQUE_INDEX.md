# Phase 10 — database-enforced single active stock count per warehouse

## Purpose

Migration `202611030039_prevent_overlapping_warehouse_stock_counts.sql` protects the supported creation RPC with a transaction-scoped advisory lock and a pre-insert conflict check. This increment adds a database constraint-level backstop so the same invariant is preserved if a future privileged function or workflow changes a count into an active state through a different path.

## Behaviour

- At most one stock count per warehouse may be in `counting` or `submitted` status.
- `approved`, `rejected` and `cancelled` historical records are retained and do not conflict with a new count.
- The unique index also protects status transitions into the active states.
- Migration preflight checks for existing duplicate active counts. If found, it stops and reports the conflicting warehouse IDs and counts. It does not choose a record to cancel, reject or delete.
- The original advisory lock and RPC-level conflict message remain unchanged.
- Count creation still snapshots all non-disposed batches in the selected warehouse. Targeted cycle counts are not part of this increment.
- No inventory quantities, reservations, receiving records or review decisions are changed by the migration.

## Migration

Apply `202611030040_enforce_one_active_stock_count_per_warehouse.sql` after migration 039, and after all earlier migrations in ascending filename order.

The migration creates `inventory_stock_counts_one_active_per_warehouse_uidx` on `inventory_stock_counts(warehouse_id)` for rows whose status is `counting` or `submitted`.

## Operational note

If the migration's preflight reports duplicate active counts, an authorised administrator must inspect the affected records and follow the approved count cancellation/review process. Do not delete or automatically finalise a count merely to make the index creation succeed. Re-run the migration only after the duplicate condition has been resolved and reviewed.

## Verification scope

Static source checks verify the preflight, partial unique index, indexed status predicate, explanatory comment and absence of inventory mutation or count-workflow rewrites. A live PostgreSQL/Supabase migration run and concurrent transaction test have not been performed in this environment.
