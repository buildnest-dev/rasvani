from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611030039_prevent_overlapping_warehouse_stock_counts.sql').read_text()
checks={
 'replaces_protected_creation_rpc':'create or replace function public.create_inventory_stock_count' in sql,
 'requires_warehouse_operator_or_admin':"public.has_app_role('warehouse_operator')" in sql and "public.has_app_role('admin')" in sql,
 'validates_active_warehouse':'where id=p_warehouse_id and active' in sql,
 'serializes_per_warehouse_creation':'pg_advisory_xact_lock(hashtextextended(p_warehouse_id::text,0))' in sql,
 'blocks_existing_open_or_submitted_count':"status in ('counting','submitted')" in sql,
 'uses_clear_conflict_message':'An open or awaiting-review stock count already exists for this warehouse' in sql,
 'retains_full_warehouse_snapshot':'where b.warehouse_id=p_warehouse_id and b.status<>' in sql,
 'retains_non_disposed_scope':"b.status<>'disposed'" in sql,
 'retains_batch_snapshot_quantity':'b.quantity_on_hand,b.stock_updated_at' in sql,
 'rejects_empty_snapshot':'if v_rows=0 then raise exception' in sql,
 'audits_full_warehouse_scope':"'scope','full_warehouse'" in sql,
 'does_not_mutate_inventory':'inventory is unchanged until independent approval' in sql.lower(),
 'revokes_public_execution':'revoke all on function public.create_inventory_stock_count(uuid,text) from public,anon' in sql,
 'grants_authenticated_execution':'grant execute on function public.create_inventory_stock_count(uuid,text) to authenticated' in sql,
}
passed=sum(checks.values()); out={'suite':'Prevent overlapping full-warehouse stock counts','passed':passed,'total':len(checks),'checks':checks}
(root/'qa/phase10_prevent_overlapping_stock_counts_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed!=len(checks): raise SystemExit(1)
