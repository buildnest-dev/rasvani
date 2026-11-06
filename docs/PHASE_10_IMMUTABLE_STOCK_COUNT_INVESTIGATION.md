# Phase 10 — Immutable stock-count investigation evidence

Migration `202611020035_immutable_stock_count_investigation.sql` hardens the independent variance-investigation workflow introduced in migration 034.

## Behaviour

- A submitted count variance can receive one investigation finding from a quality reviewer or administrator who did not create the count.
- The first finding, note, reviewer and timestamp remain the line's investigation record.
- A second attempt to overwrite that finding is rejected by the database. This matches the current workspace, which displays a saved finding instead of offering an edit form.
- The initial investigation is still recorded in the audit log.
- Existing independent count approval, stale-snapshot checks, active-reservation protection and critical-variance administrator gate remain in place.
- The RPC remains executable by authenticated users only and retains role checks inside the security-definer function.

This is an immutability safeguard, not a correction workflow. If an investigation was entered incorrectly, an authorised correction/reopen process must be designed separately with explicit reason, dual control and retained prior evidence. No such correction workflow is currently provided.

## Verification boundary

`qa/phase10_immutable_stock_count_investigation_checks.py` performs static source checks. It does not execute PostgreSQL, validate Supabase grants/RLS in a live project, or test authenticated browser workflows. Apply migration 035 only after reviewing migrations 001–035 and testing the sequence in a disposable development project.
