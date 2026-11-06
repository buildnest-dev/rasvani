# Phase 10 — Stale stock-count snapshot visibility

## Purpose

A physical stock count captures expected quantities and stock-version timestamps. Existing approval logic rejects a count if a batch changed after the snapshot, but staff previously learned about the stale state only when approval was attempted.

## Delivered

Migration `202611030041_expose_stale_stock_count_snapshots.sql` replaces the protected read-only stock-count register and adds:

- `stale_line_count`: number of count lines whose batch is missing, whose stock version differs from the snapshot, whose current quantity differs from the expected quantity, or whose batch is disposed.
- `is_stale`: whether at least one line meets those conditions; safely false for an empty line set.

The warehouse register shows whether each snapshot is current or stale and the number of affected lines. The selected count displays a warning explaining that approval is blocked and that the operator should cancel the count with a reason and start a fresh count after resolving warehouse activity.

## Safety boundaries

- This is a read-only visibility improvement; it does not change stock, count lines, statuses or movement history.
- The existing database approval guard remains authoritative and continues to reject stale counts.
- No automatic cancellation, refresh of expected quantities, or mutation of historical count evidence is performed.
- Existing role gating and authenticated execution grants are retained.

## Verification limits

The focused static source suite is 16/16. This does not establish that the migration has been executed against a live Supabase/PostgreSQL database, nor does it replace authenticated browser testing, a full Next.js build, semantic TypeScript checking or deployment validation.
