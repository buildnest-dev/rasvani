from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611020007_customer_commerce_b2b.sql').read_text()
checks={
 'order_requires_authenticated_customer': "if v_user is null then raise exception 'Authentication required'" in sql,
 'order_requires_nonempty_bounded_lines': "jsonb_array_length(p_lines)=0" in sql and "jsonb_array_length(p_lines)>50" in sql,
 'order_requires_shipping_address': "Shipping address is required" in sql,
 'order_uses_published_catalogue': "p.approval_status='approved' and p.published_at is not null" in sql,
 'order_uses_current_price': 'pp.valid_from<=now()' in sql and 'pp.valid_until>now()' in sql,
 'order_does_not_claim_payment_capture': "'not_configured'" in sql and 'payment capture' in sql.lower(),
 'cancellation_releases_active_reservations': "set status='released' where order_id=p_order_id and status='active'" in sql,
 'cancellation_is_pre_dispatch_only': "v_status not in ('draft','placed','confirmed','allocated')" in sql,
 'business_review_admin_gated': "review_business_account" in sql and "public.has_app_role('admin')" in sql,
 'trade_enquiry_requires_verified_owner': "owner_user_id=v_user and verification_status='approved'" in sql,
 'trade_enquiry_product_must_be_published': "Product is not available for trade enquiry" in sql,
 'trade_quote_role_gated': "issue_trade_quote" in sql and "public.has_app_role('super_admin')" in sql,
 'trade_quote_requires_terms_and_future_validity': 'Commercial terms are required' in sql and 'Quote expiry must be in the future' in sql,
 'quote_response_checks_business_ownership': 'b.owner_user_id=v_user' in sql,
 'audit_events_for_commerce_and_b2b': sql.count('insert into public.audit_logs') >= 5,
 'rpc_execution_revoked_from_public_anon': sql.count('revoke all on function') == 6,
 'no_b2b_manager_undefined_role': "has_app_role('b2b_manager')" not in sql,
}
result={'checks':checks,'passed':sum(checks.values()),'total':len(checks),'status':'PASS' if all(checks.values()) else 'FAIL','scope':'Static source checks only; no PostgreSQL execution.'}
(root/'qa/phase5_7_commerce_b2b_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if not all(checks.values()): raise SystemExit(1)
