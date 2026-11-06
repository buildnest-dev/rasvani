# Phase 10 — Independent stock-count variance investigation

## Purpose

Physical stock-count discrepancies now require a documented investigation by an independent quality reviewer or administrator before an approval can adjust inventory quantities. This adds an investigation layer to the existing count snapshot and approval workflow; it does not change historical count quantities or invent operating thresholds.

## Workflow

1. Warehouse staff record a physical quantity for every batch in the count snapshot and submit the completed count.
2. A quality reviewer or administrator other than the count creator records a finding for each variance line.
3. Supported findings are physical recount completed, receiving records checked, movement history checked, or other investigation.
4. Each finding requires a 5–1,000 character note. The database stores the reviewer and timestamp and writes an audit event.
5. Approval is blocked while any variance line lacks an investigation finding. Existing stale-snapshot checks, active-reservation protection, escalation rules and critical-count administrator requirement remain in force.
6. Rejection remains available to an independent quality reviewer or administrator and does not apply stock adjustments.

## Security and data handling

- The investigation RPC is executable only by authenticated users with the quality-reviewer, admin or super-admin role.
- The count creator cannot investigate their own count; the database independently enforces this even if a server action is bypassed.
- Only submitted counts and actual variance lines can receive findings.
- Investigation fields are returned through the protected stock-count-lines read RPC; direct table access remains restricted.
- Findings are additive audit metadata. Existing physical quantities and count snapshots are not rewritten.

## Migration and verification

Apply migration `202611020034_stock_count_variance_investigation.sql` after migrations 001–033. Static source checks are in `qa/phase10_stock_count_variance_investigation_checks.py`.

Static checks do not establish successful execution against a live Supabase database. Apply the migration in a non-production environment and test role separation, independent review, approval blocking, rejection, audit history, stale snapshots and critical escalation before production use.
