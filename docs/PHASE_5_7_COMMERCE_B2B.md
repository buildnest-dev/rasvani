# Phase 5 & 7 — Customer commerce and B2B workflow increment

## Implemented in migration 007

- Authenticated customer order initiation from 1–50 published catalogue products.
- Server-side price lookup against the current validity window; duplicate product lines are rejected.
- Shipping address is required, while shipping/tax are not calculated because delivery and tax rules remain undecided.
- Order payment state explicitly remains `not_configured`; no payment is captured or implied.
- Customer/admin/warehouse cancellation is limited to pre-dispatch states and releases active reservations with movement/audit records.
- Admin review of business-account verification.
- Trade enquiry creation restricted to the verified business account owner and published catalogue products.
- Admin/super-admin quote issuance with required terms and optional future expiry.
- Quote response restricted to the verified business account owner; acceptance records commercial intent only and does not create an order or collect funds.
- Sensitive tables remain without direct browser policies; access is through narrowly scoped security-definer RPCs with role/ownership checks.

## Explicitly not implemented / blocked by decisions

- Payment provider, capture/refund, seller-of-record, fund custody and settlement.
- Shipping charges, serviceability, carriers, tracking and delivery promises.
- Tax calculation, invoice generation, GST treatment and legal review.
- Producer procurement/consignment rules and B2B price lists, credit, MOQ, negotiated terms and trade fulfilment.
- A business manager role is not added to the current role enum; quote issuance is admin/super-admin only until the role model is formally approved.

## Verification

`qa/phase5_7_commerce_b2b_checks.py` — 17/17 static source checks passed. This does not execute PostgreSQL or verify Supabase runtime permissions. Migration 007 must be reviewed and applied in a disposable/local Supabase environment before production use.
