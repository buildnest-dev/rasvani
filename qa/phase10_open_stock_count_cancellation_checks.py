from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
migration=(root/'supabase/migrations/202611030036_cancel_open_inventory_stock_counts.sql').read_text()
page=(root/'apps/web/app/warehouse/page.tsx').read_text()
actions=(root/'apps/web/app/warehouse/actions.ts').read_text()
css=(root/'apps/web/app/globals.css').read_text()
docs=(root/'docs/PHASE_10_OPEN_STOCK_COUNT_CANCELLATION.md').read_text()
checks={
 'status_constraint_allows_cancelled_terminal_state':"check (status in ('counting','submitted','approved','rejected','cancelled'))" in migration,
 'cancellation_requires_reason':"length(trim(p_reason)) < 5" in migration and 'length(p_reason) > 500' in migration,
 'cancellation_locks_count_row':'where id = p_stock_count_id\n  for update' in migration,
 'only_counting_status_can_be_cancelled':"v_count.status <> 'counting'" in migration,
 'creator_or_admin_only': 'v_count.created_by <> v_user and not v_is_admin' in migration,
 'audit_records_reason_and_preserved_lines':"'inventory.stock_count_cancelled'" in migration and "'batch_lines_retained', v_total_lines" in migration and "'counted_lines_retained', v_counted_lines" in migration,
 'inventory_is_not_adjusted':'inventory_quantities_changed' in migration and 'false' in migration,
 'snapshot_and_count_lines_not_deleted':'delete from public.inventory_stock_count_lines' not in migration and 'delete from public.inventory_stock_counts' not in migration,
 'authenticated_execute_only':'from public,anon' in migration and 'to authenticated' in migration,
 'protected_count_history_exposes_cancel_metadata':'cancelled_by uuid,cancelled_at timestamptz,cancellation_reason text' in migration and 'c.cancelled_by,c.cancelled_at,c.cancellation_reason' in migration,
 'ui_displays_cancel_actor_timestamp_and_reason':"selectedStockCount.status === 'cancelled'" in page and 'selectedStockCount.cancelled_at' in page and 'selectedStockCount.cancellation_reason' in page,
 'server_action_uses_protected_rpc':"rpc('cancel_inventory_stock_count'" in actions and 'requireAnyRole(warehouseRoles)' in actions,
 'ui_limits_cancel_form_to_creator_or_admin':'(isAdmin || selectedStockCount.created_by === currentUserId)' in page and 'cancelPhysicalStockCount' in page,
 'ui_requires_a_reason_and_explains_retention':'name="reason" minLength={5} maxLength={500} required' in page and 'count evidence stays in the audit history' in page,
 'responsive_cancel_form_styles':'.warehouse-stock-count-cancel' in css and '@media(max-width:600px)' in css,
 'documentation_describes_terminal_cancel_and_scope':'Submitted, approved, rejected and already cancelled counts' in docs and 'This is not a reopening or correction workflow.' in docs and 'protected count-history read model displays these details' in docs,
}
passed=sum(checks.values())
result={'suite':'phase10_open_stock_count_cancellation','passed':passed,'total':len(checks),'checks':checks}
(root/'qa/phase10_open_stock_count_cancellation_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed!=len(checks): raise SystemExit(1)
