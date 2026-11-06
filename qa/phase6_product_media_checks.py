from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
sql=(root/'supabase/migrations/202611020020_private_product_media.sql').read_text()
producer_page=(root/'apps/web/app/producer-portal/products/[productId]/media/page.tsx').read_text()
upload=(root/'apps/web/app/producer-portal/products/[productId]/media/upload-control.tsx').read_text()
action=(root/'apps/web/app/producer-portal/products/[productId]/media/actions.ts').read_text()
review_page=(root/'apps/web/app/catalogue-review/page.tsx').read_text()
review_action=(root/'apps/web/app/catalogue-review/actions.ts').read_text()
checks={
 'migration 020 exists': (root/'supabase/migrations/202611020020_private_product_media.sql').exists(),
 'storage bucket is private': "'producer-product-media', 'producer-product-media', false" in sql,
 'storage bucket restricts MIME types and 5 MB': '5242880' in sql and "image/jpeg','image/png','image/webp" in sql,
 'upload policy requires authenticated approved producer': 'for insert to authenticated' in sql and 'public.can_upload_producer_product_media()' in sql and "application_status='approved'" in sql,
 'storage path begins with authenticated user id': '(storage.foldername(name))[1] = auth.uid()::text' in sql,
 'storage policy uses safe helper for pending object cleanup': 'public.can_delete_unregistered_producer_product_media(name)' in sql and 'security definer' in sql,
 'media table has RLS and no direct client grants': 'alter table public.producer_product_media enable row level security' in sql and 'revoke all on table public.producer_product_media from anon, authenticated' in sql,
 'registration checks producer owns product': 'where id=p_product_id and producer_id=v_producer' in sql,
 'registration checks image object exists': 'from storage.objects o where o.bucket_id=' in sql,
 'product image submission count is bounded': 'v_existing_count >= 12' in sql,
 'registration restricts product image format and size': "p_mime_type not in ('image/jpeg','image/png','image/webp')" in sql and 'p_byte_size not between 1 and 5242880' in sql,
 'producer media status RPC is owner scoped': 'p.user_id=auth.uid()' in sql and 'get_my_producer_product_media' in sql,
 'review queue requires quality role': 'get_catalogue_media_review_queue' in sql and "public.has_app_role('quality_reviewer')" in sql,
 'media review function requires reason': 'p_reason is null or length(trim(p_reason))<3' in sql,
 'publication blocked by pending media review': "m.review_status='pending_review'" in sql and 'publish_catalogue_product' in sql,
 'producer media route requires producer role': "requireAnyRole(['producer'])" in producer_page,
 'producer upload uses private bucket': "from('producer-product-media').upload" in upload,
 'browser validates allowed MIME and size': "'image/jpeg':'jpg'" in upload and 'maxBytes = 5 * 1024 * 1024' in upload,
 'server action finalizes through narrow RPC': "rpc('register_producer_product_media'" in action,
 'review workspace renders private signed image previews': 'createSignedUrl(item.object_path,300)' in review_page,
 'review workspace supports approve/reject image actions': 'reviewProductMedia' in review_page and "rpc('review_producer_product_media'" in review_action,
 'producer product list links to image management': 'Manage photos' in (root/'apps/web/app/producer-portal/products/page.tsx').read_text(),
}
passed=sum(bool(v) for v in checks.values()); total=len(checks)
out={'suite':'Private product image upload and quality review','passed':passed,'total':total,'status':'PASS' if passed==total else 'FAIL','checks':{k:{'passed':bool(v)} for k,v in checks.items()}}
(root/'qa/phase6_product_media_static_results.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed!=total: raise SystemExit(1)
