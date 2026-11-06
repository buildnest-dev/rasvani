from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611030042_explain_stale_stock_count_lines.sql').read_text().lower()
page=(root/'apps/web/app/warehouse/page.tsx').read_text()
lines=(root/'apps/web/app/warehouse/stock-count-lines.tsx').read_text()
tests={
 'protected_detail_rpc_replaced':'drop function if exists public.get_warehouse_inventory_stock_count_lines(uuid)' in sql and 'create function public.get_warehouse_inventory_stock_count_lines' in sql,
 'warehouse_quality_role_gate':'public.has_app_role(\'warehouse_operator\')' in sql and 'public.has_app_role(\'quality_reviewer\')' in sql,
 'admin_role_gate':'public.has_app_role(\'admin\')' in sql and 'public.has_app_role(\'super_admin\')' in sql,
 'missing_batch_reason':'batch_unavailable' in sql,
 'quantity_change_reason':'quantity_changed' in sql,
 'disposed_batch_reason':'batch_disposed' in sql,
 'other_attribute_reason':'other_stock_attributes_changed' in sql,
 'only_active_counts_marked_stale':"c.status in ('counting','submitted')" in sql,
 'current_quantity_exposed':'current_quantity numeric' in sql,
 'current_stock_status_exposed':'current_stock_status text' in sql,
 'inspection_status_exposed':'current_inspection_status text' in sql,
 'stale_reasons_exposed':'stale_reasons text[]' in sql,
 'read_only_no_inventory_mutation':'update public.inventory_batches' not in sql and 'insert into public.inventory_movements' not in sql,
 'authenticated_execute_grant':'grant execute on function public.get_warehouse_inventory_stock_count_lines(uuid) to authenticated' in sql,
 'ui_declares_reason_fields':'stale_reasons: string[]' in page and 'current_quantity: number | null' in page,
 'ui_explains_line_level_reasons':'Snapshot changed:' in lines and 'other_stock_attributes_changed' in lines,
 'ui_displays_current_stock_state':'Current quantity:' in lines and 'current_stock_status' in lines and 'current_inspection_status' in lines,
 'deployment_lists_migration_042':'202611030042_explain_stale_stock_count_lines.sql' in (root/'docs/WINDOWS_DEPLOYMENT_GUIDE.md').read_text(),
}
passed=sum(tests.values()); out={'suite':'Line-level stale stock-count explanations','passed':passed,'total':len(tests),'checks':tests}
(root/'qa/phase10_stale_stock_count_line_explanations_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed != len(tests): raise SystemExit(1)
