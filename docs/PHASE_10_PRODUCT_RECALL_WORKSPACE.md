# Phase 10 — Quality-controlled product recall workspace

## Implemented

- Quality reviewers, administrators and super administrators see a product-level recall panel in the warehouse workspace.
- A narrow database function returns products with inventory batches that are not already recalled or disposed. The selector is capped at 300 products and does not expose unrelated producer or warehouse records.
- The server action checks the quality role again, validates the selected product identifier and requires a recall reason between 5 and 500 characters.
- The action calls the existing `recall_product_batches` transition. The existing database function marks all eligible batches for that product as recalled and writes inventory movement and audit records.
- The UI reports the number of batches returned by the database function.

## Boundaries

This is a product-wide inventory block, not a complete recall case-management system. It does not enumerate affected customer order lines, dispatches or recipients, create recall cases, send customer/producer/regulator notifications, or manage returns and refunds. A quality reviewer/admin must use the authorised recall procedure and record an accurate reason.

## Migration and verification

Apply `202611020027_warehouse_recall_workspace.sql` after migrations 001–026. Static checks are in `qa/phase10_recall_workspace_checks.py` and `qa/phase10_recall_workspace_static_results.json`. These checks do not exercise a live database or prove transactional behaviour.
