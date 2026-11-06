from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611020019_producer_facility_self_service.sql').read_text()
producer=(root/'apps/web/app/producer-portal/facilities/page.tsx').read_text()
producer_actions=(root/'apps/web/app/producer-portal/facilities/actions.ts').read_text()
review=(root/'apps/web/app/facility-review/page.tsx').read_text()
review_actions=(root/'apps/web/app/facility-review/actions.ts').read_text()
admin=(root/'apps/web/app/admin/page.tsx').read_text()
checks={
 'migration 019 exists': (root/'supabase/migrations/202611020019_producer_facility_self_service.sql').exists(),
 'submission function requires authenticated producer role': "not public.has_app_role('producer')" in sql and 'auth.uid()' in sql,
 'submission validates approved producer profile': "application_status = 'approved'" in sql,
 'submission validates known region': 'from public.regions where id = p_region_id' in sql,
 'submission validates six digit postal code': "!~ '^[1-9][0-9]{5}$'" in sql,
 'submission validates facility type and storage array': "facility_type'", # corrected below
 'submission audit event exists': "'producer.facility_submitted'" in sql,
 'producer status RPC scoped to own account': 'p.user_id = auth.uid()' in sql and "public.has_app_role('producer')" in sql,
 'staff queue requires reviewer role': "public.has_app_role('quality_reviewer')" in sql and "public.has_app_role('admin')" in sql,
 'staff queue is bounded': 'limit 100' in sql,
 'producer page is role protected': "requireAnyRole(['producer'])" in producer,
 'producer page renders review status': 'approval_status' in producer and 'get_my_producer_facilities' in producer,
 'form collects address and facility details': all(x in producer for x in ['address_line_1','postal_code','facility_type','storage_capabilities']),
 'server action validates PIN and region': "^[1-9][0-9]{5}$" in producer_actions and 'regions.has(regionId)' in producer_actions,
 'server action calls narrow facility RPC': "rpc('submit_producer_facility'" in producer_actions,
 'review page is role protected': "requireAnyRole(['quality_reviewer','admin','super_admin'])" in review,
 'review action calls existing audited transition': "rpc('review_producer_facility'" in review_actions,
 'review action validates date range': 'until < from' in review_actions,
 'admin links facility review queue': 'href="/facility-review"' in admin,
 'producer portal links facility management': 'href="/producer-portal/facilities"' in (root/'apps/web/app/producer-portal/page.tsx').read_text(),
}
checks['submission validates facility type and storage array'] = "not in ('processing','manufacturing','storage','farm','other')" in sql and "jsonb_array_elements_text" in sql
# Remove any accidentally non-bool value from the dictionary definition above.
checks={k: bool(v) for k,v in checks.items()}
passed=sum(checks.values()); total=len(checks)
out={'suite':'Producer facility self-service and staff review workspace','passed':passed,'total':total,'status':'PASS' if passed==total else 'FAIL','checks':{k:{'passed':v} for k,v in checks.items()}}
(root/'qa/phase6_facility_workspace_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed != total: raise SystemExit(1)
