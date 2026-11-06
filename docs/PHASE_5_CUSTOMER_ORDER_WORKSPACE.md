# Phase 5 — Customer order workspace

## Delivered in this increment

- Added `get_my_customer_orders()` as a `SECURITY DEFINER` RPC with a fixed `search_path`, authenticated-user requirement, and explicit `customer_id = auth.uid()` filter.
- Returns up to 100 of the signed-in customer's orders with line summaries, item prices, order totals, recorded payment state, and the customer's own shipping address.
- Granted the RPC only to `authenticated`; public and anonymous execution are revoked.
- Added `/account/orders`, which requires a signed-in user and renders order status, lines, total, and cancellation action only when the existing lifecycle allows cancellation.
- Cancellation reuses the existing `cancel_customer_order` transactional function, which locks the order, checks ownership/status, releases active reservations, records movements and audit metadata.
- Linked order history from the account page.
- Explicitly labels payment and delivery as unconfirmed until their external integrations exist.

## Important limitations

- There is no live checkout or payment capture integration. The shop still truthfully reports that live catalogue checkout is not enabled.
- This workspace displays orders only after they exist; it does not create test/sample orders.
- Database migration 014 must be applied before the RPC works.
- Live PostgreSQL/Supabase execution, authenticated browser testing, and framework build/typecheck remain outstanding in this environment.

## Files

- `supabase/migrations/202611020014_customer_order_workspace.sql`
- `apps/web/app/account/orders/page.tsx`
- `apps/web/app/account/orders/actions.ts`
- `qa/phase5_customer_order_ui_checks.py`
- `qa/phase5_customer_order_ui_static_results.json`
