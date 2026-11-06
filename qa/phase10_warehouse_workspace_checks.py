from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page_path = root / 'apps/web/app/warehouse/page.tsx'
actions_path = root / 'apps/web/app/warehouse/actions.ts'
migration_path = root / 'supabase/migrations/202611020013_warehouse_workspace.sql'
page = page_path.read_text()
form = (root / 'apps/web/app/warehouse/receive-batch-form.tsx').read_text()
actions = actions_path.read_text()
migration = migration_path.read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'protected warehouse route exists': page_path.exists() and "requireAnyRole(workspaceRoles)" in page,
    'receipt queue uses role-gated RPC': "rpc('get_warehouse_workspace_receipts')" in page,
    'batch register uses role-gated RPC': "rpc('get_warehouse_workspace_batches')" in page,
    'return queue is loaded only for quality reviewers': "rpc('get_warehouse_workspace_returns')" in page and 'canInspectReturns ?' in page,
    'expiry queue uses role-gated RPC': "rpc('get_warehouse_expiry_watch')" in page,
    'receiving options use JSON RPC rather than direct table access': "rpc('get_warehouse_workspace_options')" in page and "from('warehouse-receiving-evidence')" in page and 'supabase.from(\"products\")' not in page,
    'receipt requires active warehouse and approved producer': 'Create a receipt' in page and 'Choose an approved producer' in migration,
    'receipt action validates warehouse and producer UUIDs': 'uuidPattern.test(warehouseId)' in actions and 'uuidPattern.test(producerId)' in actions,
    'receipt action calls protected receipt function': "rpc('create_warehouse_receipt'" in actions,
    'receipt function checks warehouse operator role': 'public.create_warehouse_receipt' in migration and "public.has_app_role('warehouse_operator')" in migration,
    'batch intake includes 8 mandatory common receiving checks': all(k in (root / 'supabase/migrations/202611020004_receiving_returns_expiry.sql').read_text() for k in ['identity_match','batch_code','quantity_match','packaging_integrity','damage_leakage','labels_documents','date_codes','storage_condition']) and 'applicableTemplates.map((item)' in form,
    'batch intake records observed pass or fail results': "['pass', 'fail'].includes(result)" in actions and 'value=\"pass\"' in form and 'value=\"fail\"' in form and 'setResults' in form,
    'failed checklist items require a reason': "result === 'fail' && itemNotes.length < 3" in actions and 'check_note_${item.checklist_key}' in form,
    'individual checklist findings are persisted': 'return { key, result, notes: itemNotes || null }' in actions and 'p_checklist: checklist' in actions,
    'batch action validates quantity, dates and identifiers': 'Number.isFinite(quantity)' in actions and 'validDateOrNull' in actions and '[receiptId, productId, binId].every((id) => uuidPattern.test(id))' in actions,
    'batch action invokes producer-matching wrapper': "rpc('receive_warehouse_batch_checked'" in actions,
    'database enforces receipt and product producer match': 'v_receipt_producer<>v_product_producer' in migration,
    'lower-level receiver direct authenticated grant is revoked': 'from authenticated;' in migration and 'revoke all on function public.receive_inventory_batch' in migration,
    'initial batch decision rejects non-quarantined and terminal items': "b.status='quarantined'" in migration and "b.inspection_status in ('pending','quarantined')" in migration,
    'failed receiving checks block batch acceptance': "i.result='fail'" in migration and 'A failed receiving checklist item blocks acceptance' in migration,
    'all mandatory receiving items must pass before acceptance': "i.result='pass'" in migration and 'All mandatory receiving checklist items must pass before acceptance' in migration,
    'receipt remains open for multiple lots until explicit closure': 'Keep the receipt open for additional lots' in migration and 'Close intake' in page,
    'receipt closure requires at least one fully inspected batch': 'create or replace function public.close_warehouse_receipt' in migration and 'v_total=0' in migration and 'if v_pending>0' in migration,
    'receipt closure is audited and role-gated': "public.has_app_role('warehouse_operator')" in migration and "'warehouse.receipt_closed'" in migration and "rpc('close_warehouse_receipt'" in actions,
    'return inspections are quality-role gated': 'Quality reviewer role required' in (root / 'supabase/migrations/202611020004_receiving_returns_expiry.sql').read_text() and "requireAnyRole(qualityRoles)" in actions,
    'return passed state does not silently restock inventory': 'does not automatically restore inventory to sellable stock' in page,
    'expiry block action is role-checked and audited': "rpc('mark_expired_inventory')" in actions and 'runExpirySweep' in page,
    'workspace reports missing data without fabricating rows': 'No receipts have been recorded yet' in page and 'No inventory batches have been recorded' in page,
    'responsive warehouse layout exists': '.warehouse-form' in css and '@media(max-width:700px)' in css and '@media(max-width:440px)' in css,
    'private receiving evidence is reviewed with short-lived server-signed URLs': "rpc('get_warehouse_batch_inspection_evidence'" in page and 'createSignedUrl(path, 600)' in page,
}
passed = sum(checks.values())
result = {
    'suite': 'Phase 10 protected warehouse workspace UI and RPC integration',
    'passed': passed,
    'total': len(checks),
    'status': 'PASS' if passed == len(checks) else 'FAIL',
    'checks': checks,
    'scope': 'Static source checks only; no live Supabase execution, authenticated browser testing, file upload, physical receiving validation or visual layout audit is implied.'
}
(root / 'qa/phase10_warehouse_workspace_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks): raise SystemExit(1)
