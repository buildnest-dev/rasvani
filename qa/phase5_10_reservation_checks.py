from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611020005_reservation_lifecycle.sql').read_text()
checks={
 'reservation_capped_by_order_line_quantity': 'Reservations exceed ordered quantity' in sql and 'sum(l.quantity)' in sql,
 'order_row_locked_for_reservation_guard': 'for update' in sql,
 'order_owner_or_warehouse_release_authorized': 'Not permitted to release this order' in sql,
 'release_writes_ledger': "'release'" in sql and 'Reservation TTL elapsed' in sql,
 'expired_reservation_cleanup_exists': 'release_expired_stock_reservations' in sql,
 'expired_cleanup_not_browser_executable': 'revoke all on function public.release_expired_stock_reservations() from public,anon,authenticated' in sql,
 'dispatch_requires_warehouse_role': "public.has_app_role('warehouse_operator')" in sql,
 'dispatch_rechecks_batch_eligibility': "b.status<>'sellable'" in sql and "b.inspection_status<>'accepted'" in sql,
 'dispatch_decrements_physical_stock': 'quantity_on_hand=b.quantity_on_hand-t.quantity' in sql,
 'dispatch_consumes_reservations_atomically': "set status='consumed'" in sql and "set status='dispatched'" in sql,
 'functions_revoke_public_execution': sql.count('revoke all on function') >= 4,
}
result={'checks':checks,'passed':sum(checks.values()),'total':len(checks),'status':'PASS' if all(checks.values()) else 'FAIL','scope':'Static source checks only; no PostgreSQL execution.'}
(root/'qa/phase5_10_reservation_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if not all(checks.values()): raise SystemExit(1)
