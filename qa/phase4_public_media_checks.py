from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
migration = (root / 'supabase/migrations/202611020021_public_approved_product_media.sql').read_text()
listing = (root / 'apps/web/app/shop/page.tsx').read_text()
detail = (root / 'apps/web/app/shop/[slug]/page.tsx').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'public media migration exists': (root / 'supabase/migrations/202611020021_public_approved_product_media.sql').exists(),
    'private bucket is not changed to public': 'update storage.buckets' not in migration and "public = true" not in migration,
    'media approval required for storage read': "m.review_status = 'approved'" in migration,
    'owning product approval required for storage read': "p.approval_status = 'approved'" in migration,
    'owning product publication required for storage read': 'p.published_at is not null' in migration,
    'storage public-read policy is bucket-scoped': "bucket_id = 'producer-product-media'" in migration and 'producer_product_media_public_approved_read' in migration,
    'storage gate checks exact object path': 'm.object_path = p_object_path' in migration,
    'public-media RPC is security definer': 'get_public_catalogue_product_media' in migration and 'security definer' in migration,
    'public-media RPC bounds product IDs': 'cardinality(p_product_ids) > 100' in migration,
    'public-media RPC bounds image count': 'p_limit_per_product > 12' in migration,
    'public-media RPC returns only approved published media': "m.review_status = 'approved'" in migration and "p.approval_status = 'approved'" in migration and 'p.published_at is not null' in migration,
    'public-media RPC has explicit grants': 'to anon, authenticated' in migration,
    'shop still filters approved and published products': "eq('approval_status', 'approved')" in listing and "not('published_at', 'is', null)" in listing,
    'shop asks for public media using product IDs': "get_public_catalogue_product_media" in listing and 'products.map((product) => product.id)' in listing,
    'shop mints short-lived signed image URLs': 'createSignedUrl(item.object_path, 900)' in listing,
    'shop uses only approved photo lookup for cards': 'productImages' in listing and 'shop-card-photo' in listing,
    'detail still filters approved and published product': "eq('approval_status', 'approved')" in detail and "not('published_at', 'is', null)" in detail,
    'detail requests bounded approved photo set': 'get_public_catalogue_product_media' in detail and 'p_limit_per_product: 12' in detail,
    'detail mints short-lived signed image URLs': 'createSignedUrl(item.object_path, 900)' in detail,
    'detail includes safe photo fallback': 'No quality-approved product photograph is published yet.' in detail,
    'responsive no-crop product photo presentation exists': '.product-detail-gallery img' in css and 'object-fit:contain' in css,
    'public prices and inventory remain undisclosed': 'Price, pack options, availability and delivery details will appear when the order service is ready.' in detail and 'Prices, stock quantities, delivery promises and checkout are not displayed' in listing,
}
passed = sum(checks.values())
result = {'status': 'PASS' if passed == len(checks) else 'FAIL', 'passed': passed, 'total': len(checks), 'checks': {k: {'passed': v} for k, v in checks.items()}}
(root / 'qa/phase4_public_media_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks):
    raise SystemExit(1)
