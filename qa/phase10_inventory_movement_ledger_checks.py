from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611020029_inventory_movement_ledger.sql').read_text()
page=(root/'apps/web/app/warehouse/page.tsx').read_text()
checks={
 'ledger RPC is stable and read-only': 'language plpgsql\nstable\nsecurity definer' in sql and 'create or replace function public.get_warehouse_inventory_movement_ledger()' in sql,
 'ledger is restricted to warehouse, quality and admin roles': all(f"public.has_app_role('{r}')" in sql for r in ['warehouse_operator','quality_reviewer','admin','super_admin']),
 'anonymous and public execution revoked': 'from public, anon' in sql and 'to authenticated' in sql,
 'ledger joins movement to batch product and warehouse': all(x in sql for x in ['public.inventory_movements m','public.inventory_batches b','public.products p','public.warehouses w']),
 'ledger includes source and destination bins': 'm.from_bin_id' in sql and 'm.to_bin_id' in sql and 'from_bin_code text' in sql and 'to_bin_code text' in sql,
 'ledger includes movement reason and operational reference': 'm.reason' in sql and 'm.reference_type' in sql and 'm.reference_id' in sql,
 'ledger is bounded to 200 recent rows': 'order by m.created_at desc, m.id desc' in sql and 'limit 200' in sql,
 'ledger excludes customer identity and contact fields': 'customer_id' not in sql and 'shipping_address' not in sql and 'email' not in sql,
 'warehouse page calls the protected ledger RPC': "rpc('get_warehouse_inventory_movement_ledger')" in page,
 'warehouse page renders movement date product batch warehouse bins and quantity': all(x in page for x in ['Recent stock movements','item.moved_at','item.product_name','item.batch_code','item.warehouse_name','item.quantity_delta']),
 'movement reason and reference are rendered': 'item.reason' in page and 'item.reference_type' in page and 'item.reference_id' in page,
 'page states ledger cap and no stock mutation': 'at most 200 latest movement records' in page and 'Physical count variances appear here only after independent approval.' in page,
 'warehouse migration dependency is updated': 'migrations 001–013 and 025–042' in page,
}
passed=sum(checks.values()); total=len(checks)
out={'suite':'Phase 10 read-only inventory movement ledger','passed':passed,'total':total,'status':'PASS' if passed==total else 'FAIL','checks':checks,'scope':'Static source checks only; no live database, authenticated UI, stock reconciliation or deployment test is implied.'}
(root/'qa/phase10_inventory_movement_ledger_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed != total: raise SystemExit(1)
