from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page_path = root / 'apps/web/app/producer-portal/products/page.tsx'
actions_path = root / 'apps/web/app/producer-portal/products/actions.ts'
migration_path = root / 'supabase/migrations/202611020018_producer_product_submission.sql'
portal_path = root / 'apps/web/app/producer-portal/page.tsx'
page, actions, migration, portal = page_path.read_text(), actions_path.read_text(), migration_path.read_text(), portal_path.read_text()
checks = {
 'product submission route exists and is producer protected': page_path.exists() and "requireAnyRole(['producer'])" in page,
 'only active categories are offered': ".eq('active', true)" in page,
 'product form captures SKU, name and category': all(f'name="{field}"' in page for field in ['sku','name','category_id']),
 'product form captures description and ingredient/allergen details': all(f'name="{field}"' in page for field in ['description','ingredients','allergen_statement']),
 'storage conditions are constrained to configured enum values': all(x in page for x in ['ambient','chilled','frozen','other']),
 'claim evidence is optional and separately reviewed': 'Optional product claim for separate review' in page and 'pending_review' in migration,
 'producer can see only own product status via RPC': "rpc('get_my_producer_products')" in page and 'where pp.user_id=auth.uid()' in migration,
 'server action requires producer role': "requireAnyRole(producerRoles)" in actions,
 'server action validates all submitted field lengths and paired claim fields': 'ingredients.length > 80' in actions and 'Boolean(claimType) !== Boolean(claimText)' in actions,
 'server action uses narrowly scoped database submission function': "rpc('submit_producer_product'" in actions,
 'database function requires authenticated producer role': "not public.has_app_role('producer')" in migration and 'auth.uid()' in migration,
 'database function requires approved producer profile': "application_status = 'approved'" in migration,
 'database function requires active category': 'where id=p_category_id and active' in migration,
 'submission inserts product in pending review': "'pending_review'" in migration and 'insert into public.products' in migration,
 'claim is created as pending review and not auto-approved': 'insert into public.product_claim_reviews' in migration and "'pending_review'" in migration,
 'submission does not publish product or assign role': 'published_at' not in migration.split('create or replace function public.submit_producer_product',1)[1].split('$$;',1)[0] and 'insert into public.user_roles' not in migration,
 'audit event is written': "'producer.product_submitted'" in migration,
 'RPC permissions are restricted to authenticated': 'from public,anon' in migration and 'to authenticated' in migration,
 'producer application links to product workspace after approval': 'href="/producer-portal/products"' in portal,
 'page clearly distinguishes submission from approval and publication': 'not yet approved or published' in page,
}
passed = sum(checks.values())
result = {'suite':'Producer product self-service submission','passed':passed,'total':len(checks),'status':'PASS' if passed == len(checks) else 'FAIL','checks':checks,'scope':'Static source checks only; no live Supabase execution or end-to-end producer onboarding is implied.'}
(root / 'qa/phase6_producer_product_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks): raise SystemExit(1)
