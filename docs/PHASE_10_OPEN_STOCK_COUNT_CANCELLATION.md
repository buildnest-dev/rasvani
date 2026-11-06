# Phase 10 — Open stock-count cancellation

Migration `202611030036_cancel_open_inventory_stock_counts.sql` adds a controlled cancellation path for physical stock counts that were started accidentally or can no longer be completed.

## Behaviour and controls

- Only a count in `counting` status can be cancelled. Submitted, approved, rejected and already cancelled counts cannot be cancelled through this action.
- The count creator or an administrator/super administrator may cancel. A warehouse operator who did not create the count cannot cancel another operator's count.
- A cancellation reason of 5–500 characters is required and checked again by the database function.
- Cancellation marks the count `cancelled`; it does not delete the count, its batch snapshot, or any quantities already entered.
- The cancellation actor, timestamp and reason are stored on the count. The protected count-history read model displays these details to authorised warehouse/quality staff. An audit event records the warehouse, reason, retained line counts and the fact that inventory quantities were not changed.
- The warehouse UI offers the action only to the creator or administrator. Submitted counts continue through the independent review path and cannot be cancelled.

This is not a reopening or correction workflow. A cancelled count is terminal; a new count must be created for another physical verification. No automatic expiry or timed cancellation is assumed.

## Verification boundary

`qa/phase10_open_stock_count_cancellation_checks.py` checks the migration, server action and UI wiring as static source. It does not run PostgreSQL or Supabase, prove RLS/security-definer behaviour in a live project, or exercise the authenticated browser workflow. Apply migration 036 after migration 035 in a reviewed disposable development project before any production rollout.
