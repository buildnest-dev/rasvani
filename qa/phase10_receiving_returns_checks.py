from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611020004_receiving_returns_expiry.sql').read_text()
checks={
 'common_receiving_checklist_seeded': all(k in sql for k in ['identity_match','batch_code','quantity_match','packaging_integrity','damage_leakage','labels_documents','date_codes','storage_condition']),
 'receiving_requires_warehouse_role': "public.has_app_role('warehouse_operator')" in sql and 'Warehouse role required' in sql,
 'received_batches_start_quarantined': "'quarantined','pending'" in sql,
 'mandatory_checklist_enforced': 'All mandatory receiving checklist items must be completed' in sql,
 'receiving_records_inspection_evidence': 'receiving_inspections' in sql and 'photo_paths' in sql,
 'returns_start_quarantined': "default 'quarantined'" in sql and 'Returned goods quarantined pending inspection' in sql,
 'return_inspection_separate_from_stock_reinstatement': 'separate controlled stock adjustment' in sql,
 'expiry_monitoring_view_present': 'inventory_expiry_watch' in sql and 'approaching_expiry' in sql,
 'expired_stock_block_function_present': 'mark_expired_inventory' in sql and "set status='expired'" in sql,
 'sensitive_functions_revoke_public': sql.count('revoke all on function') >= 4,
 'no_direct_return_table_writes': 'revoke all on public.receiving_checklist_templates, public.receipt_return_cases from anon, authenticated' in sql,
}
result={'checks':checks,'passed':sum(checks.values()),'total':len(checks),'status':'PASS' if all(checks.values()) else 'FAIL','scope':'Static source checks only; no PostgreSQL execution.'}
(root/'qa/phase10_receiving_returns_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if not all(checks.values()): raise SystemExit(1)
