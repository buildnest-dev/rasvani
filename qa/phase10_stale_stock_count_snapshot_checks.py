from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
sql = (root / 'supabase/migrations/202611030041_expose_stale_stock_count_snapshots.sql').read_text().lower()
page = (root / 'apps/web/app/warehouse/page.tsx').read_text()
checks = {
    'replaces_protected_stock_count_register': 'drop function if exists public.get_warehouse_inventory_stock_counts()' in sql and 'create function public.get_warehouse_inventory_stock_counts()' in sql,
    'retains_warehouse_and_quality_role_gate': "public.has_app_role('warehouse_operator')" in sql and "public.has_app_role('quality_reviewer')" in sql,
    'retains_admin_role_gate': "public.has_app_role('admin')" in sql and "public.has_app_role('super_admin')" in sql,
    'exposes_stale_line_count': 'stale_line_count bigint' in sql,
    'exposes_boolean_stale_flag': 'is_stale boolean' in sql,
    'detects_stock_version_change': 'b.stock_updated_at <> l.expected_stock_updated_at' in sql,
    'detects_quantity_change': 'b.quantity_on_hand <> l.expected_quantity' in sql,
    'detects_disposed_batches': "b.status = 'disposed'" in sql,
    'handles_missing_batch_reference_safely': 'b.id is null' in sql,
    'zero_line_count_is_not_null_stale_flag': 'coalesce(bool_or(' in sql and '), false)' in sql,
    'remains_read_only': 'update public.inventory_batches' not in sql and 'insert into public.inventory_movements' not in sql,
    'retains_authenticated_grant': 'grant execute on function public.get_warehouse_inventory_stock_counts() to authenticated' in sql,
    'ui_declares_new_read_model_fields': 'stale_line_count: number; is_stale: boolean' in page,
    'ui_shows_stale_status_in_register': '<th>Snapshot</th>' in page and 'item.is_stale' in page,
    'ui_warns_on_selected_stale_count': 'STALE SNAPSHOT' in page and 'Approval is blocked by the database' in page,
    'existing_approval_guard_remains_in_prior_migration': "Stock changed after count started; create a fresh count before approval" in (root / 'supabase/migrations/202611020030_inventory_stock_count_reconciliation.sql').read_text(),
}
passed = sum(checks.values())
out = {'suite': 'Visible stale stock-count snapshot read model and UI', 'passed': passed, 'total': len(checks), 'checks': checks}
(root / 'qa/phase10_stale_stock_count_snapshot_static_results.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps(out, indent=2))
if passed != len(checks):
    raise SystemExit(1)
