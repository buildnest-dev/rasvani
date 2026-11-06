# Phase 4 — Public product photography delivery

## Implemented

Migration `202611020021_public_approved_product_media.sql` adds a narrow public-read path for quality-approved product photographs. The `producer-product-media` Storage bucket remains private. Storage read permission is evaluated against the exact object path and is granted only when the associated media record is approved and the owning product is approved and published.

The bounded `get_public_catalogue_product_media` RPC returns media references only for approved, published products. It accepts at most 100 product IDs and limits results to 12 images per product. Public shop pages use those references server-side to mint 15-minute signed URLs. The shop grid requests one image per product; the product detail page requests up to 12. When migration 021 is not applied or no approved image exists, the product listing/detail remains usable with a neutral placeholder.

Producer uploads remain private. Pending and rejected media remain unavailable to public reads. Existing authenticated producer and reviewer preview paths are unchanged. No images are auto-approved by upload or product publication.

## Public content boundaries

This increment does not enable public prices, stock, warehouse locations, producer private details, checkout, payments, shipping commitments or delivery coverage. A published product with no approved photograph continues to display without a product image.

## Verification

- Public media static checks: 22/22 passed (`qa/phase4_public_media_static_results.json`).
- Consolidated static QA: see `qa/static_qa_summary.json`.
- Live Supabase migration/RLS/Storage signed-URL verification: NOT RUN.
- Browser rendering with real Supabase media: NOT RUN.
- Full Next.js build/typecheck/lint: NOT RUN because dependency installation is unavailable in the current sandbox network environment.

Before production, apply the migration to a non-production Supabase project and test anonymous, authenticated, producer-owner, quality-reviewer, rejected-media, pending-media, unpublished-product, and published-product access cases. Confirm signed URL expiry behaviour and review revocation/withdrawal handling. A media approval may be withdrawn in a subsequent controlled workflow; any already minted signed URL can remain valid until its expiry.
