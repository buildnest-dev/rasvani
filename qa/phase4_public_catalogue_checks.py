from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
shop=(root/'apps/web/app/shop/page.tsx').read_text()
detail=(root/'apps/web/app/shop/[slug]/page.tsx').read_text()
css=(root/'apps/web/app/globals.css').read_text()
migration=(root/'supabase/migrations/202611020002_phases3_10_domain_foundation.sql').read_text()
checks={
 'shop queries only approved products': ".eq('approval_status', 'approved')" in shop,
 'shop requires published timestamp': ".not('published_at', 'is', null)" in shop,
 'shop search is bounded': "slice(0, 80)" in shop and '.limit(100)' in shop,
 'category filter uses active categories': "from('categories')" in shop and ".eq('active', true)" in shop,
 'catalogue has no invented price or stock': 'amount_paise' not in shop and 'quantity_on_hand' not in shop,
 'public page explains checkout is disabled': 'checkout' in shop.lower() and 'not displayed' in shop.lower(),
 'product details route exists': 'export default async function ProductDetailPage' in detail,
 'detail route enforces approved publication': ".eq('approval_status', 'approved')" in detail and ".not('published_at', 'is', null)" in detail,
 'detail exposes ingredient and allergen fields': 'ingredients' in detail and 'allergen_statement' in detail,
 'detail does not expose internal SKU or producer data': 'producer_id' not in detail and 'sku' not in detail,
 'unconfigured Supabase state is handled': 'catch { configured = false; }' in shop and 'could not be opened just now' in detail and 'A thoughtful collection is taking shape' in shop,
 'responsive catalogue styles exist': '.shop-grid' in css and '@media(max-width:560px)' in css,
 'public product RLS policy is approval-gated': "approved_products_read on public.products for select to anon,authenticated using(approval_status='approved' and published_at is not null)" in migration,
}
passed=sum(checks.values()); result={'suite':'Public catalogue and product detail UI','passed':passed,'total':len(checks),'status':'PASS' if passed==len(checks) else 'FAIL','checks':checks}
(root/'qa/phase4_public_catalogue_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if passed != len(checks): raise SystemExit(1)
