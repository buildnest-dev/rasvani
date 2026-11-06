from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
sql = (root / 'supabase/migrations/202611030040_enforce_one_active_stock_count_per_warehouse.sql').read_text()
checks = {
    'preflight_checks_existing_active_duplicates': "where status in ('counting', 'submitted')" in sql and 'having count(*) > 1' in sql,
    'preflight_fails_with_actionable_conflict_message': 'resolve existing duplicate active counts first' in sql,
    'does_not_silently_cancel_or_delete_historical_counts': 'never silently cancelled/deleted' in sql and 'delete from public.inventory_stock_counts' not in sql.lower(),
    'creates_partial_unique_index': 'create unique index if not exists inventory_stock_counts_one_active_per_warehouse_uidx' in sql,
    'unique_key_is_warehouse': 'on public.inventory_stock_counts (warehouse_id)' in sql,
    'only_counting_and_submitted_rows_are_indexed': "where status in ('counting', 'submitted')" in sql,
    'finalised_and_cancelled_history_remains_outside_index': 'Finalised and cancelled count history is retained' in sql,
    'index_has_explanatory_comment': 'comment on index public.inventory_stock_counts_one_active_per_warehouse_uidx' in sql,
    'does_not_change_count_snapshots': 'insert into public.inventory_stock_count_lines' not in sql,
    'does_not_change_inventory_quantities': 'update public.inventory_batches' not in sql,
    'does_not_change_review_logic': 'review_inventory_stock_count' not in sql,
    'does_not_change_cancellation_logic': 'cancel_inventory_stock_count' not in sql,
}
passed = sum(checks.values())
out = {'suite': 'Database unique-index enforcement for active stock counts', 'passed': passed, 'total': len(checks), 'checks': checks}
(root / 'qa/phase10_stock_count_unique_index_static_results.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps(out, indent=2))
if passed != len(checks):
    raise SystemExit(1)
