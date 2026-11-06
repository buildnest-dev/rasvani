from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page = (root / 'apps/web/app/admin/page.tsx').read_text()
checks = {
    'admin route exists': (root / 'apps/web/app/admin/page.tsx').exists(),
    'route enforces server-side admin role': "requireAnyRole(adminRoles)" in page,
    'summary uses approved aggregate RPC': "rpc('get_admin_operations_summary')" in page,
    'warehouse report uses role-gated RPC': "rpc('get_warehouse_stock_summary')" in page,
    'locale report uses role-gated RPC': "rpc('get_editorial_locale_coverage')" in page,
    'review queue renders all 13 aggregates': page.count("label: '") == 13,
    'warehouse table exposes aggregate counts only': all(x in page for x in ['sellable_batches','quarantined_batches','rejected_or_damaged_batches','expired_or_recalled_batches']),
    'locale table exposes review aggregates': all(x in page for x in ['approved_translations','pending_review','draft_or_rejected']),
    'unavailable backend is explained without fabricated data': 'latest Supabase migrations' in page and "return '—'" in page,
    'read-only aggregate disclaimer is visible': 'read-only aggregates' in page,
    'dashboard has responsive layout styles': 'admin-grid' in (root / 'apps/web/app/globals.css').read_text(),
}
passed = sum(checks.values())
result = {'suite':'Phase 11 protected admin UI','passed':passed,'total':len(checks),'status':'PASS' if passed == len(checks) else 'FAIL','checks':checks,'scope':'Static source checks only; not a runtime, database, authorization integration or visual browser test.'}
(root / 'qa/phase11_admin_ui_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks): raise SystemExit(1)
