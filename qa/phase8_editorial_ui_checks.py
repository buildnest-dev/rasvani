from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page = (root / 'apps/web/app/editorial/page.tsx').read_text()
actions = (root / 'apps/web/app/editorial/actions.ts').read_text()
sql = (root / 'supabase/migrations/202611020010_editorial_workspace_queue.sql').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'editorial workspace route exists': (root / 'apps/web/app/editorial/page.tsx').exists(),
    'route has server-side editor role guard': 'requireAnyRole(editorRoles)' in page,
    'queue uses scoped database RPC': "rpc('get_editorial_work_queue')" in page,
    'draft action validates slug and content type': "test(slug)" in actions and "includes(contentType)" in actions,
    'draft body is structured JSON': 'blocks: [{ type:' in actions,
    'review actions call database transition RPCs': all(x in actions for x in ['submit_editorial_for_review','review_editorial_content','publish_editorial_content']),
    'review requires a reason': 'review-reason-required' in actions and "if (!reason)" in actions,
    'publishing requires editor/admin role': 'requireAnyRole(publisherRoles)' in actions,
    'queue function checks roles and omits personal details': 'Editorial workspace role required' in sql and 'author_id' not in sql,
    'queue function has bounded result set': 'limit 200' in sql,
    'translation status is shown separately': 'translation_status' in page and 'Translation:' in page,
    'unpublished approved content has explicit publish action': "row.status === 'approved' && !row.published_at" in page,
    'responsive editor styles exist': '.editorial-form' in css and '@media(max-width:700px)' in css,
}
passed = sum(checks.values())
result = {'suite':'Phase 8 protected editorial workspace UI','passed':passed,'total':len(checks),'status':'PASS' if passed == len(checks) else 'FAIL','checks':checks,'scope':'Static source checks only; not runtime, Supabase authorization integration, visual QA or framework build.'}
(root / 'qa/phase8_editorial_ui_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks): raise SystemExit(1)
