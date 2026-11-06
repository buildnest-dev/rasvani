from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/"supabase/migrations/202611020006_producer_catalogue_governance.sql").read_text()
checks={
 "application_review_admin_only": "public.has_app_role('admin')" in sql and "review_producer_application" in sql,
 "producer_role_assigned_only_after_approval": "values(v_app.applicant_user_id,'producer',v_user)" in sql,
 "application_profile_linked": "producer_profile_id=v_profile_id" in sql,
 "facility_requires_approved_producer": "Producer must be approved before facility approval" in sql,
 "facility_approval_date_bounds": "Approval end date cannot precede start date" in sql,
 "claim_review_role_gated": "public.has_app_role('quality_reviewer')" in sql and "review_product_claim" in sql,
 "product_requires_approved_producer": "An approved producer is required" in sql,
 "product_requires_approved_facility": "currently approved producer facility is required" in sql,
 "product_requires_active_category": "An active category is required" in sql,
 "all_claims_must_be_approved": "All submitted product claims must be approved first" in sql,
 "publication_is_separate_from_approval": "publish_catalogue_product" in sql and "p.approval_status='approved'" in sql,
 "publication_role_gated": "public.has_app_role('content_editor')" in sql,
 "audit_events_written": sql.count("insert into public.audit_logs") >= 5,
 "all_rpc_public_execution_revoked": sql.count("revoke all on function") == 5,
}
result={"checks":checks,"passed":sum(checks.values()),"total":len(checks),"status":"PASS" if all(checks.values()) else "FAIL","scope":"Static source checks only; no PostgreSQL execution."}
(root/"qa/phase6_4_governance_static_results.json").write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps(result,indent=2))
if not all(checks.values()): raise SystemExit(1)
