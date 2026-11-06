# Phase 4 — Public catalogue and product detail

## Delivered
- Public `/shop` catalogue reads only product rows whose `approval_status` is `approved` and whose `published_at` is non-null. This is consistent with the public RLS policy in migration 002.
- Bounded product-name search and active-category filter.
- Public `/shop/[slug]` detail route with ingredients, allergen statement and storage condition where supplied.
- Responsive catalogue cards and detail layout.
- Graceful messaging when Supabase is not configured or the catalogue cannot be loaded.

## Deliberate limits
- Product prices are not displayed because `product_prices` has no public read policy in the current schema.
- Inventory quantities and availability are not displayed because inventory is private.
- Checkout is not enabled from these pages.
- Private producer media is not displayed; media must pass the separate moderation/publication process before a public media-delivery workflow is introduced.
- Producer identity, SKU, internal approval notes and private records are not exposed.
- No placeholder product records, prices, stock or delivery promises are created.

## Validation
`qa/phase4_public_catalogue_checks.py` performs static source assertions. It is not a substitute for a Next.js build, live Supabase/RLS test, browser test, accessibility audit or penetration test.
