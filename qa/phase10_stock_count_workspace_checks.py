from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page = (root / 'apps/web/app/warehouse/page.tsx').read_text()
lines = (root / 'apps/web/app/warehouse/stock-count-lines.tsx').read_text()
actions = (root / 'apps/web/app/warehouse/actions.ts').read_text()
migration = (root / 'supabase/migrations/202611020030_inventory_stock_count_reconciliation.sql').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'workspace_imports_stock_count_actions': all(name in page for name in ['createPhysicalStockCount','submitPhysicalStockCount','reviewPhysicalStockCount']) and 'recordPhysicalStockCountLine' in lines,
    'workspace_loads_count_register': "rpc('get_warehouse_inventory_stock_counts')" in page,
    'selected_count_loads_batch_lines': "rpc('get_warehouse_inventory_stock_count_lines'" in page,
    'warehouse_role_can_start_count': "canReceive && warehouses.length > 0" in page and 'action={createPhysicalStockCount}' in page,
    'every_batch_line_has_physical_quantity_entry': 'name="counted_quantity"' in lines and 'step="0.001"' in lines,
    'count_notes_are_captured': 'name="count_notes"' in lines,
    'submit_is_disabled_until_all_lines_counted': 'disabled={selectedStockCount.counted_line_count !== selectedStockCount.batch_line_count}' in page,
    'quality_review_roles_are_separate': "roleSet.has('quality_reviewer')" in page and 'action={reviewPhysicalStockCount}' in page,
    'review_has_approve_and_reject': 'value="approve"' in page and 'value="reject"' in page,
    'server_actions_recheck_warehouse_role': 'export async function createPhysicalStockCount' in actions and 'await requireAnyRole(warehouseRoles)' in actions,
    'server_actions_validate_nonnegative_precision': '/^\\d+(?:\\.\\d{1,3})?$/' in actions and 'quantity < 0' in actions,
    'server_actions_call_database_rpc': all(name in actions for name in ['create_inventory_stock_count','record_inventory_stock_count_line','submit_inventory_stock_count','review_inventory_stock_count']),
    'count_creator_cannot_review_in_database': 'if v_count.created_by=v_user then raise exception' in migration,
    'database_snapshot_detects_stock_movement': 'b.stock_updated_at<>l.expected_stock_updated_at' in migration,
    'database_blocks_count_below_reserved_quantity': 'v_line.counted_quantity<v_reserved' in migration,
    'database_adjustments_write_movement_ledger': "'adjustment',v_line.counted_quantity-v_line.expected_quantity,'stock_count'" in migration,
    'database_audit_logs_count_lifecycle': all(x in migration for x in ['inventory.stock_count_created','inventory.stock_count_submitted','inventory.stock_count_approved','inventory.stock_count_rejected']),
    'tables_are_not_directly_accessible': 'revoke all on public.inventory_stock_counts,public.inventory_stock_count_lines from anon,authenticated' in migration,
    'responsive_stock_count_layout_exists': '.warehouse-stock-count-create' in css and '@media(max-width:850px)' in css and '@media(max-width:520px)' in css,
    'movement_ledger_explains_approved_adjustments': 'Physical count variances appear here only after independent approval.' in page,
}
passed = sum(checks.values())
result = {'suite':'phase10_stock_count_workspace','passed':passed,'total':len(checks),'checks':checks}
(root/'qa/phase10_stock_count_workspace_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed != len(checks): raise SystemExit(1)
