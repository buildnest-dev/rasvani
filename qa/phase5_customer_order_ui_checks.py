from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
page = (root/'apps/web/app/account/orders/page.tsx').read_text()
actions = (root/'apps/web/app/account/orders/actions.ts').read_text()
sql = (root/'supabase/migrations/202611020014_customer_order_workspace.sql').read_text()
account = (root/'apps/web/app/account/page.tsx').read_text()
checks = {
 'customer order page exists': 'Your orders' in page,
 'requires authenticated user': 'supabase.auth.getUser()' in page and "redirect('/account')" in page,
 'uses private own-orders RPC': "rpc('get_my_customer_orders')" in page,
 'displays line item and order totals': 'customer-order-lines' in page and 'customer-order-total' in page,
 'payment status is not overstated': 'does not confirm payment collection or delivery' in page,
 'cancellation action uses existing server RPC': "rpc('cancel_customer_order'" in actions,
 'cancellation reason is validated': 'reason.length < 3' in actions and 'reason.length > 500' in actions,
 'page is linked from account': '/account/orders' in account,
 'RPC scopes query to authenticated user': 'where o.customer_id = v_user' in sql,
 'RPC limits returned order history': 'limit 100' in sql,
 'RPC grants authenticated only': 'grant execute on function public.get_my_customer_orders() to authenticated' in sql and 'from public, anon' in sql,
 'order lines are aggregated for own order': 'where l.order_id = o.id' in sql,
}
result = {'suite':'phase5_customer_order_ui','passed':sum(checks.values()),'total':len(checks),'checks':checks}
out=root/'qa/phase5_customer_order_ui_static_results.json'
out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if not all(checks.values()): raise SystemExit(1)
