from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
sql = (root / 'supabase/migrations/202611030038_stock_count_decision_audit_read_model.sql').read_text()
page = (root / 'apps/web/app/warehouse/page.tsx').read_text()
checks = {
    'replaces_protected_count_register': 'drop function if exists public.get_warehouse_inventory_stock_counts()' in sql and 'create function public.get_warehouse_inventory_stock_counts()' in sql,
    'returns_submitter_identity': 'submitted_by uuid' in sql and 'c.submitted_by' in sql,
    'returns_final_reviewer_identity': 'reviewed_by uuid' in sql and 'c.reviewed_by' in sql,
    'returns_final_review_reason': 'review_reason text' in sql and 'c.review_reason' in sql,
    'returns_count_creation_notes': 'count_notes text' in sql and 'c.notes' in sql,
    'preserves_cancel_actor_and_reason': all(x in sql for x in ['cancelled_by uuid','cancelled_at timestamptz','cancellation_reason text','c.cancelled_by','c.cancellation_reason']),
    'preserves_variance_and_escalation_totals': all(x in sql for x in ['count(l.id) filter (where l.counted_quantity is not null and l.counted_quantity <> l.expected_quantity)','c.escalation_level','l.escalation_level = \'warning\'','l.escalation_level = \'critical\'','l.escalation_level = \'review_required\'']),
    'retains_warehouse_quality_role_gate': all(x in sql for x in ["public.has_app_role('warehouse_operator')", "public.has_app_role('quality_reviewer')", "public.has_app_role('admin')", "public.has_app_role('super_admin')"]),
    'read_model_is_stable_security_definer': 'language plpgsql stable security definer set search_path=public,auth' in sql,
    'revoke_public_anon_and_grant_authenticated': 'revoke all on function public.get_warehouse_inventory_stock_counts() from public,anon' in sql and 'grant execute on function public.get_warehouse_inventory_stock_counts() to authenticated' in sql,
    'page_type_accepts_decision_audit_fields': all(x in page for x in ['submitted_by: string | null','reviewed_by: string | null','review_reason: string | null','count_notes: string | null']),
    'register_displays_submission_actor_and_time': 'Submitted {dateTime(item.submitted_at)}' in page and 'item.submitted_by?.slice(0, 8)' in page,
    'register_displays_review_actor_and_time': 'Reviewed {dateTime(item.reviewed_at)}' in page and 'item.reviewed_by?.slice(0, 8)' in page,
    'detail_displays_original_count_notes': 'Count notes: {selectedStockCount.count_notes}' in page,
    'approved_decision_displays_reviewer_and_reason': "selectedStockCount.status === 'approved'" in page and 'Review decision: {selectedStockCount.review_reason' in page,
    'rejected_decision_explains_no_inventory_change': "selectedStockCount.status === 'rejected'" in page and 'Rejected count did not change inventory quantities.' in page,
    'register_displays_review_decision_reason': 'Decision reason: {item.review_reason}' in page,
    'register_displays_cancellation_reason': 'Cancellation reason: {item.cancellation_reason}' in page,
    'does_not_change_adjustment_rpc_or_inventory': 'review_inventory_stock_count' not in sql and 'update public.inventory_batches' not in sql and 'insert into public.inventory_movements' not in sql,
}
passed = sum(checks.values())
result = {'suite': 'Stock-count decision audit read model', 'passed': passed, 'total': len(checks), 'checks': checks}
(root / 'qa/phase10_stock_count_decision_audit_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': passed, 'total': len(checks), 'failed': [k for k, v in checks.items() if not v]}, indent=2))
if passed != len(checks):
    raise SystemExit(1)
