# Phase 10 — physical stock-count line audit

Migration: `202611030037_audit_stock_count_line_edits.sql` (apply after migrations 001–036).

## Behaviour

- Recording a batch's physical quantity creates an `inventory.stock_count_line_recorded` audit event.
- Correcting an already-entered quantity or note creates `inventory.stock_count_line_corrected`.
- The event captures the previous and new quantity/note, previous counter and timestamp, count ID and batch ID.
- The count header is locked while the line is validated and updated; the target line is also locked before its prior values are captured.
- Only the count creator or an administrator can enter/correct a line while the count remains open, matching the existing workflow.
- Audit metadata explicitly records that the operation did not change inventory. Inventory is adjusted only by the independent approval workflow.
- Existing immutable investigation evidence and open-count cancellation behaviour are unchanged.

## Boundaries

This records the immediately preceding state for every successful line save. It does not add a separate correction approval, count reopening, cycle-count scheduling, or automatic count frequency. Those require separately approved operational rules. Live PostgreSQL execution and authenticated tests remain pending.
