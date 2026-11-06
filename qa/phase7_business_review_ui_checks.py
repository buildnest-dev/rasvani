from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
p=(R/'apps/web/app/admin/page.tsx').read_text(); a=(R/'apps/web/app/admin/actions.ts').read_text(); s=(R/'supabase/migrations/202611020016_business_verification_queue.sql').read_text()
checks={
'admin queue calls protected RPC':'get_pending_business_accounts' in p,
'queue omits tax details':"'legal_name',legal_name,'created_at'" in s and 'tax_details' not in s,
'queue limited to 100':'limit 100' in s,
'admin role enforced in SQL':"public.has_app_role('admin')" in s,
'public execution revoked':'from public,anon' in s,
'authenticated execution granted':'to authenticated' in s,
'review server action requires admin':"requireAnyRole(['admin','super_admin'])" in a,
'review action calls existing audited transition':'review_business_account' in a,
'review reason mandatory':'!reason' in a,
'approve and reject controls visible':'name="decision" value="approved"' in p and 'name="decision" value="rejected"' in p,
}
out={'suite':'phase7_business_review_ui','passed':sum(checks.values()),'total':len(checks),'checks':[{'check':k,'passed':v} for k,v in checks.items()]}
(R/'qa/phase7_business_review_ui_static_results.json').write_text(json.dumps(out,indent=2)+'\n'); print(json.dumps(out,indent=2));
if out['passed']!=out['total']: raise SystemExit(1)
