from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
page=(root/'apps/web/app/editorial/page.tsx').read_text()
actions=(root/'apps/web/app/editorial/actions.ts').read_text()
sql=(root/'supabase/migrations/202611020011_translation_workspace_queue.sql').read_text()
checks={
 'translation queue RPC is loaded': "rpc('get_translation_work_queue')" in page,
 '12 locales are selectable': all(f'value="{x}"' in page for x in ['en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as']),
 'translation draft uses database save RPC': "rpc('save_translation_draft'" in actions,
 'translation submit uses existing audited transition': "rpc('submit_translation_for_review'" in actions,
 'translation review uses quality reviewer/admin role': "requireAnyRole(['quality_reviewer', 'admin', 'super_admin'])" in actions,
 'translation review records a mandatory reason': 'translation-review-reason-required' in actions and 'p_reason: reason' in actions,
 'queue RPC checks translation workspace role': 'Translation workspace role required' in sql,
 'queue RPC does not return reviewer or author identities': 'reviewer_id' not in sql and 'author_id' not in sql,
 'translation approval remains distinct from source publication': 'source publication still required' in page,
 'translation work queue is visibly rendered': 'Translation work queue' in page,
}
passed=sum(checks.values())
result={'suite':'Phase 9 translation workspace UI','passed':passed,'total':len(checks),'status':'PASS' if passed==len(checks) else 'FAIL','checks':checks,'scope':'Static source checks only; no live Supabase execution, professional linguistic review or browser test.'}
(root/'qa/phase9_translation_ui_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if passed!=len(checks): raise SystemExit(1)
