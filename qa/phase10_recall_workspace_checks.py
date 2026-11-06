from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
page=(root/'apps/web/app/warehouse/page.tsx').read_text()
actions=(root/'apps/web/app/warehouse/actions.ts').read_text()
sql=(root/'supabase/migrations/202611020027_warehouse_recall_workspace.sql').read_text()
base=(root/'supabase/migrations/202611020003_inventory_workflows.sql').read_text()
checks={
 'quality-only recall selector RPC exists': 'get_warehouse_recall_products' in sql and "public.has_app_role('quality_reviewer')" in sql,
 'recall selector returns products with eligible inventory only': "b.status not in ('recalled','disposed')" in sql and 'eligible_batch_count bigint' in sql and 'count(b.id)::bigint' in sql,
 'recall selector is bounded': 'limit 300' in sql,
 'RPC grants authenticated only': 'grant execute on function public.get_warehouse_recall_products() to authenticated' in sql and 'from public,anon' in sql,
 'recall form appears only for quality reviewers and admins': 'const canRecall = canInspectReturns' in page and '{canRecall && <section' in page,
 'recall form requires product and reason': 'name="product_id" required' in page and 'name="reason" required minLength={5}' in page,
 'server action checks quality role and input': 'await requireAnyRole(qualityRoles)' in actions and "reason.length < 5" in actions,
 'server action calls existing product recall transition': "rpc('recall_product_batches'" in actions,
 'recall result count is validated and reported': 'Number.isInteger(Number(data))' in actions and 'recalledCount=' in actions and 'params.recalledCount' in page,
 'existing database recall marks batches and records movement': "update public.inventory_batches set status='recalled'" in base and "'recall'" in base and "'inventory.product_recall'" in base,
 'recall is audited and restricted to quality or admin roles': "public.has_app_role('quality_reviewer')" in base and "'inventory.product_recall'" in base,
 'recall UI responsive': '.warehouse-recall-form' in (root/'apps/web/app/globals.css').read_text() and '@media(max-width:820px)' in (root/'apps/web/app/globals.css').read_text(),
}
passed=sum(checks.values()); total=len(checks)
out={'suite':'Phase 10 quality-controlled product recall workspace','passed':passed,'total':total,'status':'PASS' if passed==total else 'FAIL','checks':checks,'scope':'Static source checks only; no live database recall, order traceability or authenticated UI test is implied.'}
(root/'qa/phase10_recall_workspace_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed != total: raise SystemExit(1)
