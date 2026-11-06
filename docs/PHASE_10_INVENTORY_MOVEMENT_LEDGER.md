# Phase 10 — Inventory movement ledger

## Purpose
Provide warehouse and quality teams with a read-only operational history of stock movements. The ledger supports investigation and audit context without granting direct write access to inventory history.

## Access and data scope
- Available to authenticated `warehouse_operator`, `quality_reviewer`, `admin`, and `super_admin` roles.
- Anonymous and public execution is revoked; the RPC is granted to authenticated users and checks the application role internally.
- Returns at most the 200 latest movement records.
- Displays movement timestamp/type, quantity delta, product/SKU, batch, warehouse, source/destination bin, operational reference type/id, and recorded reason.
- Excludes customer names, addresses, email addresses, telephone numbers, and other customer contact details.
- The page is read-only. Viewing the ledger never changes inventory.

## Important limitations
- This is a movement ledger, not a physical count or stock reconciliation workflow.
- It does not prove that an order was delivered to a customer; order/batch reservation traceability remains a separate investigation view.
- The SQL migration and UI have static source checks only in this environment. Apply the migration and test with real role accounts before production use.
