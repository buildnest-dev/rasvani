from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page_path = root / 'apps/web/app/producer-portal/page.tsx'
actions_path = root / 'apps/web/app/producer-portal/actions.ts'
migration_path = root / 'supabase/migrations/202611020012_producer_self_service_application.sql'
page = page_path.read_text()
actions = actions_path.read_text()
migration = migration_path.read_text()
producer_info = (root / 'apps/web/app/for-producers/page.tsx').read_text()
checks = {
    'protected producer portal route exists': page_path.exists() and "requireAnyRole(applicantRoles)" in page,
    'application summary uses own-user RPC': "rpc('get_my_producer_application')" in page,
    'status is displayed without claiming approval from submission': 'pending_review' in page and 'does not verify a producer' in page,
    'all 36 regions are selectable': len([x for x in ['andhra-pradesh','bihar','west-bengal','puducherry'] if x in page]) == 4 and sum(1 for line in page.split('const regionIds = [',1)[1].split('];',1)[0].splitlines() for item in line.split(',') if item.strip()) == 36,
    'form captures legal name, region and contact': all(x in page for x in ['name="legal_name"','name="region_id"','name="contact_email"']),
    'form collects business introduction without sensitive ID numbers': 'name="introduction"' in page and 'does not request government ID numbers' in page,
    'server action role-checks signed-in applicants': "requireAnyRole(applicantRoles)" in actions,
    'server action validates region allowlist': 'validRegions.has(regionId)' in actions,
    'server action validates email format': 'contactEmail' in actions and 'test(contactEmail)' in actions,
    'server action invokes narrowly scoped submission RPC': "rpc('submit_producer_application'" in actions,
    'migration requires authenticated session': 'if v_user is null then raise exception' in migration,
    'submission serializes concurrent requests per account': 'pg_advisory_xact_lock(hashtextextended(v_user::text, 0))' in migration,
    'migration validates legal name and region': 'p_legal_name' in migration and 'Choose a valid Indian state or Union Territory' in migration,
    'migration does not assign producer role on submission': 'insert into public.user_roles' not in migration,
    'migration restricts own application status': 'where a.applicant_user_id = auth.uid()' in migration,
    'RPC execute grants are authenticated-only': migration.count('to authenticated;') >= 2 and 'from public, anon' in migration,
    'producer landing page links to portal': 'href="/producer-portal"' in producer_info,
    'responsive producer form styles exist': 'producer-form' in (root / 'apps/web/app/globals.css').read_text() and '@media(max-width:640px)' in (root / 'apps/web/app/globals.css').read_text(),
}
passed = sum(checks.values())
result = {'suite':'Phase 6 producer self-service portal','passed':passed,'total':len(checks),'status':'PASS' if passed == len(checks) else 'FAIL','checks':checks,'scope':'Static source checks only; no Supabase migration execution, authenticated browser session, document verification or operational onboarding is implied.'}
(root / 'qa/phase6_producer_portal_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks): raise SystemExit(1)
