# Phase 3 — State and Union Territory category discovery

## Delivered

- State / UT overview pages now derive a category browse section from the region's approved, region-level product associations.
- Only products already visible through the public association query contribute category identifiers; only active categories attached to those products are queried.
- Each category link opens the existing Shop category filter. The displayed count is the number of distinct published products associated with that state / UT and category, not the number of association records.
- Regional food cards identify their active category while preserving the reviewed relationship label (origin claim, produced in, traditionally associated with, or popular in).
- The category section is omitted when no eligible regional categories exist. No category or product examples are seeded.

## Publication and interpretation rules

- The underlying association must be approved and the related product must remain approved and published under existing database row-level security policies.
- Categories must be active. An inactive category is not shown.
- The category link filters the wider public catalogue; it does not promise that all products in that category are associated with the selected region.
- A product association does not imply exclusive origin, current stock, seller readiness or delivery coverage.

## Verification boundary

Static checks validate source structure and link wiring only. Live Supabase RLS/query execution, framework build, browser flow, accessibility audit and performance audit remain not run in this sandbox.
