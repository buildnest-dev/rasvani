from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611020009_admin_reporting_operations.sql').read_text()
checks={
 'admin_summary_exists': 'get_admin_operations_summary()' in sql,
 'admin_summary_requires_admin_role': "public.has_app_role('admin')" in sql and "public.has_app_role('super_admin')" in sql,
 'admin_summary_contains_core_review_queues': all(x in sql for x in ['producer_applications_pending','facilities_pending','products_pending','claims_pending','business_accounts_pending','editorial_pending','translations_pending']),
 'admin_summary_contains_warehouse_and_commerce_queues': all(x in sql for x in ['receipts_pending','batches_quarantined','batches_expiring_30d','returns_quarantined','trade_enquiries_open','orders_open']),
 'summary_excludes_personal_details': 'contact_email' not in sql and 'shipping_address' not in sql and 'customer_id' not in sql,
 'warehouse_summary_role_gated': 'get_warehouse_stock_summary()' in sql and "public.has_app_role('warehouse_operator')" in sql,
 'warehouse_summary_separates_stock_risks': all(x in sql for x in ['sellable_batches','quarantined_batches','rejected_or_damaged_batches','expired_or_recalled_batches']),
 'locale_coverage_has_all_12_locales': all("'"+x+"'" in sql for x in ['en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as']),
 'locale_coverage_requires_editorial_or_quality_role': "public.has_app_role('content_editor')" in sql and "public.has_app_role('quality_reviewer')" in sql,
 'all_rpcs_revoke_public_anon': sql.count('revoke all on function') == 3,
 'all_rpcs_grant_authenticated': sql.count('grant execute on function') == 3,
 'no_mutation_endpoints': 'insert into public.' not in sql and 'update public.' not in sql and 'delete from public.' not in sql,
 'queue_indexes_added': all(x in sql for x in ['producer_applications_review_idx','product_claim_reviews_queue_idx','trade_enquiries_status_idx','receipt_return_cases_status_idx']),
}
result={'checks':checks,'passed':sum(checks.values()),'total':len(checks),'status':'PASS' if all(checks.values()) else 'FAIL','scope':'Static source checks only; no PostgreSQL/Supabase execution.'}
(root/'qa/phase11_reporting_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if not all(checks.values()): raise SystemExit(1)
