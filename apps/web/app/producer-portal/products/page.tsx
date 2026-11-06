import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { submitProducerProduct } from './actions';

export const metadata: Metadata = { title: 'Producer product submissions' };
type Category = { id: string; name: string };
type Product = { product_id: string; sku: string; name: string; category_name: string | null; approval_status: string; published_at: string | null; created_at: string; pending_claims: number };
const statusLabel: Record<string, string> = { draft: 'Draft', pending_review: 'Under review', approved: 'Approved, awaiting publication', rejected: 'Not approved', archived: 'Archived' };

export default async function ProducerProductsPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  await requireAnyRole(['producer']);
  const supabase = await createClient();
  const [categoriesResult, productsResult, params] = await Promise.all([
    supabase.from('categories').select('id,name').eq('active', true).order('name').limit(200),
    supabase.rpc('get_my_producer_products'), searchParams,
  ]);
  const categories = (categoriesResult.data ?? []) as Category[];
  const products = (productsResult.data ?? []) as Product[];
  return <section className="wrap producer-portal-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · Producer workspace</div><h1>Product submissions</h1>
      <p className="section-intro">Submit products for catalogue review. Submission is not product approval, a safety certification, price approval or publication.</p>
      <p><Link className="text-link" href="/producer-portal">← Back to producer application</Link> <span aria-hidden="true"> · </span><Link className="text-link" href="/producer-portal/facilities">Manage registered facilities</Link></p>
    </div>
    {params.error && <p className="status" role="alert">{params.error === 'invalid-fields' ? 'Check the required fields, category and claim details.' : 'Product submission failed. Confirm your producer profile is approved, a category is active and migration 018 is applied.'}</p>}
    {params.submitted && <p className="status" role="status">Product submitted for review. It is not yet approved or published.</p>}
    <section className="producer-form-panel"><div className="eyebrow">New catalogue submission</div><h2>Product details</h2>
      {categories.length === 0 ? <p className="notice">No active categories are configured. Contact the Rasvani catalogue team before submitting a product.</p> : <form action={submitProducerProduct} className="producer-form">
        <label>Producer SKU<input name="sku" required maxLength={80} placeholder="Your internal product code"/></label>
        <label>Product name<input name="name" required maxLength={180}/></label>
        <label>Category<select name="category_id" required defaultValue=""><option value="" disabled>Select active category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Storage requirement<select name="storage_condition" required defaultValue="ambient"><option value="ambient">Ambient</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="other">Other / confirm with operations</option></select></label>
        <label className="producer-wide">Product description<textarea name="description" rows={4} maxLength={5000}/></label>
        <label className="producer-wide">Ingredients (one per line)<textarea name="ingredients" rows={4} placeholder="Enter only the actual ingredients"/></label>
        <label className="producer-wide">Allergen statement<textarea name="allergen_statement" rows={2} maxLength={1500} placeholder="State known allergens accurately; do not guess"/></label>
        <fieldset className="producer-wide"><legend>Optional product claim for separate review</legend><p className="notice">Do not submit unsupported health, nutrition, origin, organic or certification claims. Evidence is reviewed separately.</p>
          <label>Claim type<input name="claim_type" maxLength={80} placeholder="For example: origin / certification / ingredient claim"/></label>
          <label>Claim text<textarea name="claim_text" rows={2} maxLength={1000}/></label>
          <label>Evidence reference<input name="claim_evidence_reference" maxLength={500} placeholder="Internal document reference; do not paste sensitive IDs"/></label>
        </fieldset>
        <button type="submit" className="btn producer-wide">Submit product for review</button>
      </form>}
    </section>
    <section className="producer-status-panel"><div className="eyebrow">Your submissions</div><h2>Product status</h2>
      {productsResult.error ? <p className="notice">Product status is unavailable. Confirm migration 018 and producer access.</p> : products.length === 0 ? <p className="notice">No product submissions yet.</p> : <div className="warehouse-table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Status</th><th>Pending claims</th><th>Submitted</th><th>Images</th></tr></thead><tbody>{products.map((product) => <tr key={product.product_id}><th>{product.name}</th><td>{product.sku}</td><td>{product.category_name ?? '—'}</td><td>{statusLabel[product.approval_status] ?? 'Status unavailable'}{product.published_at ? ' · Published' : ''}</td><td>{product.pending_claims}</td><td>{new Date(product.created_at).toLocaleDateString('en-IN')}</td><td><Link className="text-link" href={`/producer-portal/products/${product.product_id}/media`}>Manage photos</Link></td></tr>)}</tbody></table></div>}
    </section>
    <p className="notice">Product photos are submitted separately through the private image workflow and remain unavailable to the public until quality review and catalogue publication are complete. Verified prices, batch/lot information, packaging evidence and regulatory documents are handled through separate approved workflows.</p>
  </section>;
}
