# Phase 6 — Producer product submission workspace

## Delivered

- Protected producer route at `/producer-portal/products`.
- Active categories are loaded from the catalogue table; no sample categories are fabricated.
- Producer SKU, product name, category, description, ingredients, allergen statement and storage requirement capture.
- Optional product claim capture with a separate evidence reference field.
- Server action validates role, UUID/category shape, allowed storage values, paired claim fields and field lengths.
- Migration `202611020018_producer_product_submission.sql` provides a narrowly scoped authenticated RPC.
- Database function requires the signed-in user to hold the producer role and have an approved producer profile, and requires an active category.
- Submitted product and optional claim both enter `pending_review`; submission does not approve, price, certify or publish anything.
- Producer sees only their own product status through `get_my_producer_products()`.
- Audit event records submission without storing unsupported claims as verified facts.

## Deliberately not included

Product photo/document upload, verified prices, nutrition/health claims, origin certification, packaging evidence and regulatory document collection are not enabled. These need approved privacy, storage, review and legal processes. Product submission is not a food-safety approval or legal certification.

## Verification

`qa/phase6_producer_product_checks.py` runs static source checks. It does not execute the migration against PostgreSQL/Supabase, test authenticated browser workflows, or prove deployment readiness. Migration 018 must be applied after migrations 001–017.
