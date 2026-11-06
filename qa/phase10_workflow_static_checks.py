from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
sql = (root / 'supabase/migrations/202611020003_inventory_workflows.sql').read_text()
checks = {
    '36 regions seeded': sql.count("'state'") >= 28 and sql.count("'union_territory'") >= 8,
    'FEFO ordering present': 'order by b.expiry_date nulls last, b.received_at, b.id' in sql,
    'row locks used': 'for update skip locked' in sql.lower(),
    'allocation rollback on shortfall': 'Insufficient eligible stock; allocation rolled back' in sql,
    'expiry blocked at allocation': 'b.expiry_date >= current_date' in sql,
    'inspection role gate': "has_app_role('quality_reviewer')" in sql,
    'recall workflow present': 'recall_product_batches' in sql and "set status='recalled'" in sql,
    'audit records written': 'insert into public.audit_logs' in sql,
    'direct writes revoked': 'revoke all on table public.inventory_movements, public.receiving_inspections, public.stock_reservations from anon, authenticated' in sql,
}
result = {'suite':'phase10_inventory_workflow_static','checks':checks,'passed':sum(checks.values()),'total':len(checks),'execution':'static source inspection only; no database execution'}
out = root / 'qa/phase10_workflow_static_results.json'
out.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if not all(checks.values()): raise SystemExit(1)
