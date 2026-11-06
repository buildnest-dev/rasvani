from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611020033_receiving_checklist_template_editing.sql').read_text()
actions=(root/'apps/web/app/warehouse/actions.ts').read_text()
page=(root/'apps/web/app/warehouse/page.tsx').read_text()
css=(root/'apps/web/app/globals.css').read_text()
doc=(root/'docs/PHASE_10_RECEIVING_CHECKLIST_TEMPLATE_EDITING.md').read_text()
checks={
 'database edit RPC exists': 'create or replace function public.update_receiving_checklist_template(' in sql,
 'edit RPC is admin-only': "public.has_app_role('admin')" in sql and "public.has_app_role('super_admin')" in sql,
 'edit RPC rejects invalid key and title': "p_checklist_key !~ '^[a-z][a-z0-9_]{2,59}$'" in sql and 'length(trim(p_title)) < 3' in sql,
 'edit RPC requires category or storage scope': 'p_category_id is null and p_storage_condition is null' in sql,
 'edit RPC validates active category': 'where id=p_category_id and active' in sql,
 'built-in checks are immutable': "'identity_match','batch_code','quantity_match','packaging_integrity'" in sql and 'Built-in receiving controls cannot be edited' in sql,
 'template row is locked before update': 'where checklist_key=p_checklist_key and active for update' in sql,
 'before and after values are audited': "'warehouse.receiving_checklist_template_updated'" in sql and "'before'" in sql and "'after'" in sql,
 'RPC privileges are revoked from public and anon': 'from public,anon' in sql and 'to authenticated' in sql,
 'server action rechecks admin role and validates values': 'updateReceivingChecklistTemplate' in actions and "await requireAnyRole(['admin', 'super_admin'] as const)" in actions,
 'server action invokes protected RPC': "rpc('update_receiving_checklist_template'" in actions,
 'warehouse page exposes edit controls only for custom active templates': 'const editable = item.active' in page and 'Edit template' in page,
 'edit form supports title category storage and requiredness': all(x in page for x in ['name="title"','name="category_id"','name="storage_condition"','name="required"']),
 'success state and actionable error are surfaced': 'checklistTemplateUpdated' in page and 'checklist-template-update-failed' in page,
 'responsive edit form styles exist': '.warehouse-template-edit-form' in css and '@media(max-width:700px)' in css,
 'documentation explains historical evidence and migration': 'Existing receiving inspection rows are not rewritten' in doc and '202611020033_receiving_checklist_template_editing.sql' in doc,
}
passed=sum(checks.values()); total=len(checks)
out={'suite':'Phase 10 receiving checklist template editing','passed':passed,'total':total,'status':'PASS' if passed==total else 'FAIL','checks':checks,'scope':'Static source checks only; no live Supabase migration execution or authenticated browser test is implied.'}
(root/'qa/phase10_checklist_template_editing_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed!=total: raise SystemExit(1)
