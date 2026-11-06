import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { formatPaise } from '@/lib/money';
import { changePrice, publishProduct, setVisibility } from './actions';

export const metadata: Metadata = { title: 'Products & prices (admin)' };
type Row = { product_id: string; sku: string; name: string; slug: string; visible: boolean; amount_paise: number | null };

export default async function AdminCataloguePage({ searchParams }: { searchParams: Promise<{ published?: string; priced?: string; visibility?: string; error?: string }> }) {
  await requireAnyRole(['admin', 'super_admin']);
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data, error }, categories] = await Promise.all([
    supabase.rpc('admin_list_products'),
    supabase.from('categories').select('id,name').eq('active', true).order('name').limit(100),
  ]);
  const rows = (Array.isArray(data) ? data : []) as Row[];
  return <section className="wrap customer-orders-page">
    <div className="page-hero"><div className="eyebrow">Operations</div><h1>Products &amp; prices</h1><p className="section-intro">Add only vegetarian products with real prices. Whatever you publish here is visible in the shop immediately.</p></div>
    <p><Link href="/account" className="text-link">← Account</Link> · <Link href="/admin/orders" className="text-link">Customer orders →</Link></p>
    {(params.published || params.priced || params.visibility) && <p className="status" role="status">Saved.</p>}
    {params.error && <p className="status" role="alert">Could not save: {params.error === 'invalid' ? 'check the fields (price must be at least ₹1).' : params.error}</p>}
    <form className="form-shell checkout-form" action={publishProduct}>
      <h2>Add a product</h2>
      <label htmlFor="p-name">Product name</label><input id="p-name" name="name" required maxLength={180} />
      <label htmlFor="p-sku">SKU (unique code, e.g. RV-THEKUA-250)</label><input id="p-sku" name="sku" required maxLength={80} />
      <label htmlFor="p-price">Price in rupees (₹), e.g. 250</label><input id="p-price" name="price" type="number" step="0.01" min="1" max="100000" required />
      <label htmlFor="p-desc">Description (what it is, weight/pack size)</label><textarea id="p-desc" name="description" rows={3} maxLength={5000} />
      <label htmlFor="p-cat">Category (optional)</label>
      <select id="p-cat" name="category" defaultValue=""><option value="">No category</option>{(categories.data ?? []).map((item) => <option key={item.id as string} value={item.id as string}>{item.name as string}</option>)}</select>
      <label htmlFor="p-storage">Storage</label>
      <select id="p-storage" name="storage" defaultValue="ambient"><option value="ambient">Room temperature (dry foods)</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="other">Other</option></select>
      <label htmlFor="p-ev">Vegetarian check (who made it / how you confirmed it is 100% vegetarian)</label>
      <input id="p-ev" name="evidence" required maxLength={300} placeholder="e.g. Verified recipe with baker, no egg or animal ingredients" />
      <button className="btn" type="submit">Publish product</button>
    </form>
    <h2 style={{ font: '500 28px var(--serif)', margin: '36px 0 12px' }}>All products</h2>
    {error ? <p className="notice">Products could not be loaded. Run migration 202611060044 in Supabase and make sure you have an admin role.</p> : rows.length === 0 ? <p className="notice">No products yet. Add the first one above.</p> : <div className="customer-order-list">
      {rows.map((row) => <article className="customer-order-card" key={row.product_id}>
        <div className="customer-order-head"><div><span className="eyebrow">{row.sku}</span><h2>{row.name}</h2></div><div className="customer-order-status"><strong>{row.amount_paise === null ? 'No price' : formatPaise(row.amount_paise)}</strong><span>{row.visible ? 'Visible in shop' : 'Hidden'}</span></div></div>
        <div className="admin-order-form">
          <form action={changePrice} className="admin-order-form"><input type="hidden" name="product_id" value={row.product_id} /><label>New price (₹)<input name="price" type="number" step="0.01" min="1" max="100000" required /></label><button className="btn secondary" type="submit">Change price</button></form>
          <form action={setVisibility}><input type="hidden" name="product_id" value={row.product_id} /><input type="hidden" name="visible" value={row.visible ? 'false' : 'true'} /><button className="btn secondary" type="submit">{row.visible ? 'Hide from shop' : 'Show in shop'}</button></form>
        </div>
      </article>)}
    </div>}
  </section>;
}
