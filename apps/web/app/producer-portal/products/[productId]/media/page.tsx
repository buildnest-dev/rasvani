import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { UploadControl } from './upload-control';

export const metadata: Metadata = { title: 'Product image submissions' };
type Product = { product_id:string;sku:string;name:string;approval_status:string };
type Media = { media_id:string;object_path:string;original_filename:string;mime_type:string;byte_size:number;review_status:string;uploaded_at:string };
const labels: Record<string,string> = { draft:'Draft',pending_review:'Pending product review',approved:'Approved',rejected:'Not approved',archived:'Archived' };
export default async function ProductMediaPage({ params }: { params: Promise<{productId:string}> }) {
  await requireAnyRole(['producer']);
  const { productId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(productId)) notFound();
  const supabase = await createClient();
  const [{data:productData}, {data:mediaData,error}] = await Promise.all([
    supabase.rpc('get_my_producer_products'), supabase.rpc('get_my_producer_product_media',{p_product_id:productId}),
  ]);
  const product = (Array.isArray(productData) ? productData : []).find((item:Product) => item.product_id===productId) as Product|undefined;
  if (!product) notFound();
  const media = Array.isArray(mediaData) ? mediaData as Media[] : [];
  const previews = await Promise.all(media.map(async (item) => {
    const {data} = await supabase.storage.from('producer-product-media').createSignedUrl(item.object_path,300);
    return {...item,url:data?.signedUrl ?? null};
  }));
  return <section className="wrap producer-portal-page"><div className="page-hero"><div className="eyebrow">Rasvani · Producer workspace</div><h1>Product photos</h1><p className="section-intro">{product.name} · {product.sku} · {labels[product.approval_status] ?? product.approval_status}</p><p><Link className="text-link" href="/producer-portal/products">← Back to product submissions</Link></p></div>
    {['approved','archived'].includes(product.approval_status) ? <p className="status" role="status">This product is not accepting new images in its current state. Contact the catalogue team for a controlled update.</p> : <section className="producer-form-panel"><div className="eyebrow">Private image intake</div><h2>Submit a product photo</h2><p className="notice">Uploads are private and are not displayed publicly until quality review and the product publication workflow are complete. No document uploads are allowed here.</p><UploadControl productId={productId}/></section>}
    <section className="producer-status-panel"><div className="eyebrow">Image review status</div><h2>Your submitted photos</h2>{error ? <p className="notice">Image status is unavailable. Confirm migration 020.</p> : previews.length===0 ? <p className="notice">No product photos have been submitted.</p> : <div className="media-grid">{previews.map((item) => <article className="media-card" key={item.media_id}>{item.url ? <Image src={item.url} alt={`Private upload ${item.original_filename}`} width={420} height={280} unoptimized/> : <div className="media-unavailable">Preview unavailable</div>}<div><strong>{item.original_filename}</strong><p>{labels[item.review_status] ?? item.review_status} · {(item.byte_size/1024).toFixed(0)} KB</p><small>Uploaded {new Date(item.uploaded_at).toLocaleDateString('en-IN')}</small></div></article>)}</div>}</section>
    <p className="notice">Only product images are accepted in this private bucket. Government IDs, licences, certificates, bank details and personal records must not be uploaded here.</p>
  </section>;
}
