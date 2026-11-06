from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page_path = root / 'apps/web/app/warehouse/page.tsx'
migration_path = root / 'supabase/migrations/202611020026_private_receiving_evidence_review.sql'
policy_path = root / 'supabase/migrations/202611020025_private_receiving_evidence.sql'
page = page_path.read_text()
migration = migration_path.read_text()
policy = policy_path.read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'evidence review is loaded only for pending quarantined batches': "rpc('get_warehouse_batch_inspection_evidence'" in page and 'pendingBatches.map((item) => item.batch_id)' in page,
    'evidence RPC is protected by warehouse or quality roles': "public.has_app_role('warehouse_operator')" in migration and "public.has_app_role('quality_reviewer')" in migration and 'Warehouse or quality role required' in migration,
    'evidence RPC bounds batch request size': 'cardinality(p_batch_ids)>150' in migration,
    'evidence RPC returns checklist outcome and notes': 'ri.result,ri.notes' in migration and 'checklist_title text' in migration,
    'evidence RPC returns private photo paths only': 'ri.photo_paths' in migration and 'server-side signing' in migration,
    'evidence storage bucket remains private': "'warehouse-receiving-evidence', 'warehouse-receiving-evidence', false" in policy,
    'private object reads remain role-gated': 'warehouse_receiving_evidence_private_read' in policy and "public.has_app_role('quality_reviewer')" in policy,
    'signed URLs are created server-side with short expiry': "from('warehouse-receiving-evidence').createSignedUrl(path, 600)" in page,
    'raw private object paths are not rendered in markup': 'photo_paths' not in page.split('return <section',1)[-1],
    'evidence photos have descriptive alt text': 'Private receiving evidence for ${item.batch_code}' in page,
    'checklist pass and fail states are displayed distinctly': 'evidence-pass' in page and 'evidence-fail' in page,
    'evidence UI has responsive thumbnail styling': '.warehouse-evidence-photos' in css and '@media(max-width:700px)' in css,
    'workspace documents evidence migration dependency': 'migrations 001–013 and 025–042' in page,
}
passed = sum(checks.values())
result = {
    'suite': 'Phase 10 private receiving evidence review',
    'passed': passed,
    'total': len(checks),
    'status': 'PASS' if passed == len(checks) else 'FAIL',
    'checks': checks,
    'scope': 'Static source checks only; signed URL generation and storage RLS were not exercised against a live Supabase project.'
}
(root / 'qa/phase10_private_receiving_evidence_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks): raise SystemExit(1)
