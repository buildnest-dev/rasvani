# Phase 7 — Business buyer workspace increment

## Delivered
- `/business-portal` for authenticated business buyers.
- Business application submission with legal name and optional GSTIN/registration metadata.
- Pending applications can be updated by the owner; the workflow does not grant a retailer role or mark the business verified.
- Private owner-scoped workspace response for business accounts, enquiries and quotations.
- Trade enquiry creation uses the existing ownership- and approval-checked RPC.
- Quote acceptance/decline uses the existing owner-checked, expiry-aware response RPC.
- Admin `/admin` queue for pending business verification with approve/reject and mandatory review reason.
- Admin queue returns only business name and submission timestamp; tax details and contact details are excluded.
- All business review decisions use the existing audited `review_business_account` transition.

## Database changes
- `202611020015_business_self_service_portal.sql`
- `202611020016_business_verification_queue.sql`

Apply after migrations 001–014 in lexical order.

## Safety and business boundaries
- Verification remains a manual staff decision.
- Submission is not proof of GST, legal status or eligibility.
- Quote acceptance is not an order, payment, settlement or delivery promise.
- Tax evidence must be reviewed through an approved secure process; it is not exposed in the admin queue.
- Commercial terms, fulfilment geography, pricing, tax and seller-of-record remain open business decisions.

## Validation
- Business portal static checks: 14/14.
- Admin business-review queue static checks: 10/10.
- Combined static suite: see `qa/static_qa_summary.json`.
- No live Supabase/PostgreSQL execution or end-to-end test is claimed.
