from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
page=(root/'apps/web/app/warehouse/page.tsx').read_text()
lines=(root/'apps/web/app/warehouse/stock-count-lines.tsx').read_text()
actions=(root/'apps/web/app/warehouse/actions.ts').read_text()
migration=(root/'supabase/migrations/202611020034_stock_count_variance_investigation.sql').read_text()
checks={
 'stock_count_line_component_imports_investigation_action':'recordStockCountVarianceInvestigation' in lines,
 'variance_lines_offer_independent_investigation':'status === \'submitted\'' in lines and 'line.counted_quantity !== line.expected_quantity' in lines,
 'finding_options_cover_supported_review_methods':all(x in lines for x in ['physical_recount','receiving_records_checked','movement_history_checked','other']),
 'investigation_note_is_required_and_bounded':'name="note"' in lines and 'minLength={5}' in lines and 'maxLength={1000}' in lines,
 'existing_investigation_is_displayed':'line.review_finding' in lines and 'line.review_note' in lines,
 'server_action_checks_quality_role':'export async function recordStockCountVarianceInvestigation' in actions and 'await requireAnyRole(qualityRoles)' in actions,
 'server_action_validates_ids_finding_and_note':all(x in actions for x in ['stock-count-investigation-fields','uuidPattern.test(countId)','uuidPattern.test(batchId)','note.length < 5','note.length > 1000']),
 'server_action_calls_protected_rpc':"rpc('record_inventory_stock_count_variance_review'" in actions,
 'database_requires_independent_reviewer':'if v_count.created_by = v_user then raise exception' in migration,
 'database_only_allows_submitted_variance_lines':"v_count.status <> 'submitted'" in migration and 'v_line.counted_quantity = v_line.expected_quantity' in migration,
 'database_persists_review_audit_metadata':all(x in migration for x in ['review_finding','review_note','reviewed_by','reviewed_at','inventory.stock_count_variance_investigated']),
 'approval_blocks_uninvestigated_variances':'Every variance line needs an independent investigation finding' in migration,
 'critical_variance_still_requires_admin':"v_count.escalation_level='critical'" in migration and 'administrator-level review' in migration,
 'database_rpc_is_authenticated_only':'to authenticated' in migration and 'from public,anon' in migration,
 'success_feedback_is_wired':'stockCountInvestigationSaved' in page and 'stockCountInvestigationSaved ||' in page,
}
passed=sum(checks.values())
result={'suite':'phase10_stock_count_variance_investigation','passed':passed,'total':len(checks),'checks':checks}
(root/'qa/phase10_stock_count_variance_investigation_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed!=len(checks): raise SystemExit(1)
