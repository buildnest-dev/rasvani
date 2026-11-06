# Phase 10 — Receiving checklist template editing

## Scope

Administrators and super administrators can edit active custom receiving checklist templates from the warehouse workspace. They can revise the display title, category scope, storage-condition scope, and whether the check is mandatory for matching products.

## Controls

- Built-in common receiving checks remain immutable.
- A custom template must retain at least one scope: an active product category, a storage condition, or both.
- The database revalidates the role, active category and scope; browser validation is not trusted as the security boundary.
- Every update writes an audit-log entry containing before/after values.
- Existing receiving inspection rows are not rewritten. Historical evidence remains as recorded at intake.
- Deactivation remains a separate audited action and is not available for built-in controls.

## Deployment

Apply migration `202611020033_receiving_checklist_template_editing.sql` after migrations 001–032. No default category, storage rule, or requiredness is invented.

## Verification boundary

The registered QA suite checks source-level wiring and policy declarations. It does not execute the migration against a live Supabase database or prove authenticated browser behaviour.
