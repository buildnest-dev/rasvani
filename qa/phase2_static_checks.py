from pathlib import Path
import re, json, sys
ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'apps/web'
checks = []
def check(name, ok, detail=''):
    checks.append({'check': name, 'passed': bool(ok), 'detail': detail})

regions_src = (WEB/'lib/regions.ts').read_text()
regions = re.findall(r"'([^']+)'", regions_src.split('as const')[0])
check('36 unique state/UT taxonomy entries', len(regions)==36 and len(set(regions))==36, f'{len(regions)} entries; {len(set(regions))} unique')
check('28 states + 8 UT ordering', len(regions[:28])==28 and len(regions[28:])==8, 'first 28 records states; final 8 records UTs')
roles_src = (WEB/'lib/auth/authorization.ts').read_text()
check('server-only role authorization helper', "import 'server-only'" in roles_src and 'auth.getUser()' in roles_src and "from('user_roles')" in roles_src)
check('no client-metadata role escalation', 'raw_user_meta_data' not in roles_src and 'user_metadata' not in roles_src)
check('all required public route files exist', all((WEB/'app'/p/'page.tsx').exists() for p in ['explore-india','shop','food-stories','for-producers','for-retailers','account']))
check('route resilience components exist', all((WEB/'app'/p).exists() for p in ['not-found.tsx','loading.tsx','error.tsx']))
check('Supabase server helper uses request cookies', 'cookies()' in (WEB/'lib/supabase/server.ts').read_text())
check('no committed service-role secret', not any('SERVICE_ROLE' in p.read_text(errors='ignore') and not p.name.endswith('.example') for p in WEB.rglob('*') if p.is_file() and 'node_modules' not in p.parts))
sql = (ROOT/'supabase/migrations/202611020001_phase2_identity_access_audit.sql').read_text()
check('RLS enabled on all Phase 2 identity tables', all(f'alter table public.{t} enable row level security' in sql for t in ['profiles','user_roles','role_permissions','audit_logs']))
check('new signup gets customer role only', "values (new.id, 'customer')" in sql and "new.raw_user_meta_data ->> 'role'" not in sql[sql.index('create or replace function public.handle_new_user'):sql.index('revoke all on function public.handle_new_user')])
check('role assignment is not client writable', 'do not add client INSERT/UPDATE/DELETE policies to user_roles' in sql)
check('decorative image use is documented internally without customer-facing AI labels', 'decorative/editorial visuals' in (ROOT/'docs/PHASE_1_IMAGE_ASSET_REGISTER.md').read_text() and 'AI-generated' not in (WEB/'components/home-experience.tsx').read_text())
auth_actions = (WEB/'app/account/actions.ts').read_text()
auth_form = (WEB/'app/account/auth-form.tsx').read_text()
check('account actions validate credentials server-side', "safeParse" in auth_actions and "min(10)" in auth_actions and "signInWithPassword" in auth_actions and "auth.signUp" in auth_actions)
check('account forms use server actions and accessible feedback', 'useActionState' in auth_form and 'role="alert"' in auth_form and 'role="status"' in auth_form)
check('account sign-out is server-side', 'auth.signOut()' in auth_actions)
result={'suite':'Phase 2 static foundation checks','checks':checks,'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks)}
out=ROOT/'qa/phase2_static_results.json'; out.write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
sys.exit(1 if result['failed'] else 0)
