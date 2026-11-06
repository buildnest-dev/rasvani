from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
p=(R/'apps/web/app/catalogue-review/page.tsx').read_text()
a=(R/'apps/web/app/catalogue-review/actions.ts').read_text()
m=(R/'supabase/migrations/202611020017_catalogue_review_workspace.sql').read_text()
admin=(R/'apps/web/app/admin/page.tsx').read_text()
checks={
 'catalogue review route exists':(R/'apps/web/app/catalogue-review/page.tsx').exists(),
 'claim queue is role-gated':"public.has_app_role('quality_reviewer')" in m,
 'product queue role-gated':"public.has_app_role('content_editor')" in m,
 'queue execution revoked from public and anon':'from public,anon' in m,
 'queue execution granted to authenticated':'to authenticated' in m,
 'product queue bounded':'limit 100' in m,
 'claim queue bounded':'limit 150' in m,
 'claim queue returns only pending claims':"cr.review_status='pending_review'" in m,
 'claim review uses audited existing RPC':'review_product_claim' in a,
 'product approval uses existing audited RPC':'review_product_for_catalogue' in a,
 'publication uses existing eligibility-checked RPC':'publish_catalogue_product' in a,
 'server actions require staff roles':"requireAnyRole(['quality_reviewer','admin','super_admin'])" in a and "requireAnyRole(['content_editor','admin','super_admin'])" in a,
 'review reasons are length-validated':'reason.length < 3' in a,
 'publication is separate from product approval':"p.approval_status==='approved'" in p and 'Publish catalogue product' in p,
 'admin dashboard links to workspace':'href="/catalogue-review"' in admin,
}
out={'suite':'phase4_catalogue_review','passed':sum(checks.values()),'total':len(checks),'checks':[{'check':k,'passed':bool(v)} for k,v in checks.items()]}
(R/'qa/phase4_catalogue_review_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if out['passed']!=out['total']: raise SystemExit(1)
