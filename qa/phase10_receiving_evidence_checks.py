from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page = (root / 'apps/web/app/warehouse/page.tsx').read_text()
form = (root / 'apps/web/app/warehouse/receive-batch-form.tsx').read_text()
actions = (root / 'apps/web/app/warehouse/actions.ts').read_text()
migration = (root / 'supabase/migrations/202611020025_private_receiving_evidence.sql').read_text()
base = (root / 'supabase/migrations/202611020004_receiving_returns_expiry.sql').read_text()
checks = {
    'private receiving evidence migration exists': (root / 'supabase/migrations/202611020025_private_receiving_evidence.sql').exists(),
    'dedicated bucket is private': "'warehouse-receiving-evidence', 'warehouse-receiving-evidence', false" in migration,
    'bucket restricts uploads to JPEG PNG and WebP': "array['image/jpeg','image/png','image/webp']" in migration,
    'bucket caps each object at five megabytes': '5242880' in migration,
    'only warehouse operators and administrators can upload': "public.has_app_role('warehouse_operator')" in migration and "public.has_app_role('admin')" in migration and 'for insert to authenticated' in migration,
    'quality and warehouse staff have private read access': 'for select to authenticated' in migration and "public.has_app_role('quality_reviewer')" in migration,
    'uploader can clean up own failed batch uploads': 'for delete to authenticated' in migration and '(storage.foldername(name))[1] = auth.uid()::text' in migration,
    'receiving form accepts multiple evidence photos': 'name="evidence_photos"' in form and 'multiple' in form,
    'photo constraints are disclosed to staff': 'Up to 4 photos' in form and 'maximum 5 MB each' in form,
    'server action limits count and MIME types': 'evidenceFiles.length > 4' in actions and "['image/jpeg', 'image/png', 'image/webp'].includes(file.type)" in actions,
    'server action limits each photo size': 'file.size > 5 * 1024 * 1024' in actions,
    'upload path scopes evidence to user and receipt': '`${user.id}/${receiptId}/${crypto.randomUUID()}' in actions,
    'uploads use private bucket and no upsert': "from('warehouse-receiving-evidence').upload" in actions and 'upsert: false' in actions,
    'uploaded paths are passed to atomic receiving RPC': 'p_photo_paths: uploadedPaths' in actions,
    'failed upload cleans up earlier files': "remove(uploadedPaths)" in actions and "fail('receiving-evidence-upload')" in actions,
    'failed receiving RPC cleans up uploaded evidence': actions.index('if (error) {', actions.index("rpc('receive_warehouse_batch_checked'")) < actions.index("fail('batch-receive-failed')"),
    'receiving inspections persist photo paths': 'photo_paths,inspected_by' in base and "coalesce(p_photo_paths,'{}')" in base,
    'public catalogue media is not reused': "from('producer-product-media')" not in actions,
    'migration dependency is documented in workspace': 'migrations 001–013 and 025–042' in page,
}
passed = sum(checks.values())
result = {
    'suite': 'Phase 10 private warehouse receiving photo evidence',
    'passed': passed,
    'total': len(checks),
    'status': 'PASS' if passed == len(checks) else 'FAIL',
    'checks': checks,
    'scope': 'Static source checks only; no live Supabase Storage upload, signed URL, role-policy execution, database migration or browser test is implied.'
}
(root / 'qa/phase10_receiving_evidence_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks): raise SystemExit(1)
