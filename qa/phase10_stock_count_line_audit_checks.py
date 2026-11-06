from pathlib import Path
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611030037_audit_stock_count_line_edits.sql').read_text()
checks={
 'replaces_protected_count_line_rpc':'create or replace function public.record_inventory_stock_count_line' in sql,
 'requires_warehouse_or_admin_role':"public.has_app_role('warehouse_operator')" in sql and "public.has_app_role('admin')" in sql,
 'locks_count_header':'where id=p_stock_count_id for update' in sql,
 'locks_existing_count_line':'where stock_count_id=p_stock_count_id and batch_id=p_batch_id\n  for update' in sql,
 'rejects_non_open_count':"v_count.status<>'counting'" in sql,
 'rejects_unscoped_batch':'if not found then raise exception \'Batch is not part of this stock count\'' in sql,
 'records_first_entry_event':"'inventory.stock_count_line_recorded'" in sql,
 'records_correction_event':"'inventory.stock_count_line_corrected'" in sql,
 'captures_previous_quantity':"'previous_quantity',v_line.counted_quantity" in sql,
 'captures_new_quantity':"'new_quantity',p_counted_quantity" in sql,
 'captures_previous_notes':"'previous_notes',v_line.count_notes" in sql,
 'captures_new_notes':"'new_notes',nullif(trim(p_notes), '')" in sql or "'new_notes',nullif(trim(p_notes),'')" in sql,
 'captures_previous_counter_and_time':"'previous_counted_by',v_line.counted_by" in sql and "'previous_counted_at',v_line.counted_at" in sql,
 'states_no_inventory_change':"'inventory_quantity_changed',false" in sql,
 'revokes_public_execution':'revoke all on function public.record_inventory_stock_count_line(uuid,uuid,numeric,text) from public,anon' in sql,
 'grants_authenticated_execution':'grant execute on function public.record_inventory_stock_count_line(uuid,uuid,numeric,text) to authenticated' in sql,
}
passed=sum(checks.values()); out={'suite':'Physical stock-count line audit','passed':passed,'total':len(checks),'checks':checks}
import json
(root/'qa/phase10_stock_count_line_audit_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed!=len(checks): raise SystemExit(1)
