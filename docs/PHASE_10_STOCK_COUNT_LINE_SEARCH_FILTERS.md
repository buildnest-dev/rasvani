# Phase 10 — Stock-count line search and exception filters

**Date:** 3 November 2026  
**Status:** Implemented in the continuous web application codebase. No migration added.

## Purpose

Help warehouse and quality staff find a particular product or investigate exceptions within a selected physical stock count, especially when the count includes many batches.

## Behaviour

The selected stock-count detail provides:

- Case-insensitive search across product name, SKU, batch/lot code and bin code.
- **All lines** — every batch line returned for the selected count.
- **Not counted** — lines without a physical quantity.
- **Variance** — counted lines where physical quantity differs from the immutable system snapshot quantity.
- **Stale snapshot** — lines identified by the protected read model as stale.
- **Matched** — counted lines whose physical quantity equals the snapshot and which are not stale.
- A count beside each filter and a live result-count announcement.
- An explanatory empty state when no rows match.

The filters are keyboard-operable, expose their selected state using `aria-pressed`, and use a responsive layout on narrow screens.

## Data and security boundary

This is client-side filtering over the complete selected-count line set returned by the existing role-gated `get_warehouse_inventory_stock_count_lines(uuid)` RPC. It does not introduce a new data-access path or expose additional fields. The existing protected server actions remain responsible for recording physical quantities and variance-investigation evidence. Existing database checks still govern submission, independent review, stale-snapshot blocking and approval.

The filter UI does not refresh or rewrite the snapshot, edit physical quantities, alter inventory, or approve/reject a count. The “Matched” filter deliberately excludes a stale line even when its displayed quantity equals the original snapshot, because stale stock attributes may have changed.

## Files

- `apps/web/app/warehouse/stock-count-lines.tsx` — interactive search/filter component and retained line-level forms.
- `apps/web/app/warehouse/page.tsx` — mounts the component inside the protected stock-count detail.
- `apps/web/app/globals.css` — responsive styling and visible keyboard focus.
- `qa/phase10_stock_count_line_search_filters_checks.py` — 24 static source checks.

No database migration or change to warehouse fulfilment policy is introduced.

## Verification limits

The focused static suite passes 24/24 checks. The aggregate QA script consolidates this suite with the other registered source checks. No browser interaction, live Supabase/PostgreSQL execution, semantic TypeScript typecheck, ESLint run, Next.js production build, formal accessibility audit or performance test is implied.
