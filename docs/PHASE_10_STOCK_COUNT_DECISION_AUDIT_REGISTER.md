# Phase 10 — stock-count decision audit register

Migration: `202611030038_stock_count_decision_audit_read_model.sql` (apply after migrations 001–037).

## Behaviour

- The protected read-only stock-count register returns the count submitter, final reviewer, final review reason, original count notes and cancellation metadata alongside the existing status and variance totals.
- The warehouse register displays submission and review actors/timestamps, and now also displays the recorded approval/rejection reason or cancellation reason directly in the row when present.
- Full count details continue to show the decision reason and whether inventory was changed. The read model does not expose customer identity/contact details.
- The SQL function remains restricted to authenticated warehouse and quality roles, uses a stable security-definer read model with a fixed search path, and grants execution only to authenticated users.

## Boundaries

This is a read-only visibility improvement. It does not change count decisions, investigation evidence, inventory quantities, adjustment behaviour or audit history. Live PostgreSQL execution and authenticated browser tests remain pending.
