from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
migration=(root/'supabase/migrations/202611020035_immutable_stock_count_investigation.sql').read_text()
page=(root/'apps/web/app/warehouse/stock-count-lines.tsx').read_text()
actions=(root/'apps/web/app/warehouse/actions.ts').read_text()
checks={
 'migration_replaces_existing_protected_investigation_rpc':'create or replace function public.record_inventory_stock_count_variance_review' in migration,
 'migration_locks_submitted_count':'where id=p_stock_count_id for update' in migration and "v_count.status <> 'submitted'" in migration,
 'migration_requires_independent_reviewer':'v_count.created_by = v_user' in migration,
 'migration_rejects_second_investigation':'if v_line.review_finding is not null then' in migration,
 'immutable_guard_has_clear_error':'existing review evidence is immutable' in migration,
 'finding_and_note_validation_preserved':"p_finding not in ('physical_recount','receiving_records_checked','movement_history_checked','other')" in migration and 'length(trim(p_note)) < 5' in migration,
 'first_investigation_still_audited':'inventory.stock_count_variance_investigated' in migration and 'insert into public.audit_logs' in migration,
 'authenticated_only_execute_grant':'from public,anon' in migration and 'to authenticated' in migration,
 'warehouse_ui_does_not_offer_edit_after_saved_finding':'line.review_finding ? <p className="notice">Investigation:' in page,
 'server_action_still_uses_protected_rpc':"rpc('record_inventory_stock_count_variance_review'" in actions,
}
passed=sum(checks.values())
result={'suite':'phase10_immutable_stock_count_investigation','passed':passed,'total':len(checks),'checks':checks}
(root/'qa/phase10_immutable_stock_count_investigation_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed!=len(checks): raise SystemExit(1)
