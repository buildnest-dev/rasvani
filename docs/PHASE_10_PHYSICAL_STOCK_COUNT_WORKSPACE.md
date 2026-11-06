# Phase 10 — Physical stock-count reconciliation workspace

## Delivered

- Warehouse operators, admins and super admins can start a physical count for an active warehouse.
- The database snapshots every non-disposed batch quantity and stock-version timestamp at count creation.
- Staff record each batch's physical quantity (0 or greater, up to three decimal places) and an optional count note.
- Submission is blocked until every snapshot line has a counted quantity.
- Quality reviewers, admins and super admins can review submitted counts. The database prevents the count creator from reviewing their own count.
- Approval rechecks that no stock quantity, location or status changed after the snapshot. Stale counts must be repeated.
- Approval also prevents counted quantities from falling below active reserved stock. Approved variances update batch quantity and append an `adjustment` movement linked to the count.
- Rejection leaves inventory quantities unchanged. Count creation, submission, approval and rejection are audit logged.
- The workspace lists the 30 most recent counts and opens individual batch lines. Direct table access remains revoked; server actions and database functions enforce roles.

## Operational boundary

This is a batch-level snapshot and reconciliation workflow. It does not yet provide blind counting, barcode scanning, zone/cycle-count scheduling, two-person physical recount for high-value variances, or exportable signed count sheets. Those are separate future capabilities. Live PostgreSQL/Supabase execution and multi-user concurrency tests remain required before production use.

## Validation

`qa/phase10_stock_count_workspace_checks.py` validates UI wiring, server-side input validation, role-separated actions, migration safeguards, audit trail and responsive layout. Static checks do not prove runtime behavior.
