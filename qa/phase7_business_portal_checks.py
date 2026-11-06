from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,ok): checks.append({'check':name,'passed':bool(ok)})
page=(ROOT/'apps/web/app/business-portal/page.tsx').read_text()
actions=(ROOT/'apps/web/app/business-portal/actions.ts').read_text()
sql=(ROOT/'supabase/migrations/202611020015_business_self_service_portal.sql').read_text()
account=(ROOT/'apps/web/app/account/page.tsx').read_text()
retailers=(ROOT/'apps/web/app/for-retailers/page.tsx').read_text()
check('business portal route exists', 'BusinessPortalPage' in page)
check('private workspace RPC used', "get_my_business_workspace" in page)
check('registration workflow form', 'submitBusinessApplication' in page and 'legal_name' in page)
check('GSTIN format validation', "^[0-9A-Z]{15}$" in actions)
check('business registration RPC used', 'submit_business_account' in actions)
check('enquiry action calls ownership-checked RPC', 'create_trade_enquiry' in actions)
check('quote response action uses controlled RPC', 'respond_to_trade_quote' in actions)
check('quote accept and decline UI', 'Accept quotation' in page and 'Decline quotation' in page)
check('business application defaults pending review', "'pending_review'" in sql)
check('only owner sees business workspace', 'where b.owner_user_id=v_user' in sql)
check('public execution revoked', 'from public,anon' in sql)
check('authenticated execution granted', 'to authenticated' in sql)
check('audit event on application', 'b2b.business_application_submitted' in sql)
check('account links business workspace', '/business-portal' in account)
check('retailer landing page links live portal', '/business-portal' in retailers and 'not yet enabled' not in retailers)
result={'suite':'phase7_business_portal','passed':sum(x['passed'] for x in checks),'total':len(checks),'checks':checks}
out=ROOT/'qa/phase7_business_portal_static_results.json'; out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if result['passed']!=result['total']: raise SystemExit(1)
