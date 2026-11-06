# Phase 6 — Private producer product image uploads

## Delivered

- Private Supabase Storage bucket `producer-product-media` with 5 MB per-object limit and JPEG, PNG and WebP allow-list.
- Upload object path is bound to authenticated producer user ID and the product UUID.
- Upload policy requires the producer role and an approved producer profile.
- Producer can upload only images for products belonging to their approved profile and view their own upload status. A maximum of 12 images may be registered per product.
- Quality reviewers/admins can privately read the bounded image-review queue and approve/reject with a reason.
- Signed previews expire after five minutes; no public bucket or permanent public URL is used.
- Product publication is blocked while any submitted image remains pending review.
- Rejected/unattached media is not made public. Unregistered objects can be cleaned up by their uploader; registered media cannot be directly deleted from Storage.

## Migration

Apply `supabase/migrations/202611020020_private_product_media.sql` after migrations 001–019. The migration uses Supabase Storage schema (`storage.buckets`, `storage.objects`, `storage.foldername`) and therefore must be run in the configured Supabase project.

## Explicit exclusions

This is a product-image workflow, not a general document repository. It does not permit PDFs, SVGs, government IDs, FSSAI licences, bank information or identity documents. Those remain disabled until the data classification, legal basis, access review, retention, deletion, incident response and operator procedures are approved.

## Validation status

Static source checks cover private bucket constraints, owner-scoped upload/read paths, reviewer gates, product ownership checks, upload MIME/size checks, private signed previews and publication gating. Live Storage execution and image-content malware/visual review are not claimed.
