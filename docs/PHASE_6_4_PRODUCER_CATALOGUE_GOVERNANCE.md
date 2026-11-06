# Producer verification and catalogue governance

## Purpose

Implement controlled, auditable transitions for producer applications, producer facilities, product claims, catalogue approval and catalogue publication. No producer, licence, product, claim, price or certification is fabricated by these workflows.

## Workflow

1. A producer application enters `pending_review`.
2. An admin/super-admin reviews it with a reason. Approval creates or updates a producer profile, links it to the application and assigns the `producer` role. Rejection does not grant the role.
3. Facility approval is a distinct review by an admin, super-admin or quality reviewer. The producer must already be approved. Optional approval dates bound the valid period.
4. Submitted product claims are reviewed separately by a quality reviewer/admin. A product with any submitted claim not in `approved` state cannot be approved.
5. Catalogue approval requires an approved producer, at least one currently approved facility, an active category and all submitted claims approved.
6. Publication is separate from approval and requires a content-editor/admin role. Eligibility is checked again at publication time.
7. Each state transition writes an audit log.

## Database functions

- `review_producer_application(uuid,text,text)`
- `review_producer_facility(uuid,text,text,date,date)`
- `review_product_claim(uuid,text,text)`
- `review_product_for_catalogue(uuid,text,text)`
- `publish_catalogue_product(uuid)`

## Important limits

- These functions do not validate FSSAI, GST, Legal Metrology or other documents against government registries.
- They do not determine legal seller identity, contract terms, product safety, nutritional truth, origin or health claims.
- They do not set or approve prices, stock, delivery promises or commercial availability.
- PostgreSQL/Supabase execution and end-to-end tests have not been run in this sandbox.
- Admin role provisioning and secure server-side document storage/review UI remain operational setup tasks.
