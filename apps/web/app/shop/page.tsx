import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { regions } from '@/lib/regions';
import { AddToCart } from '@/components/add-to-cart';
import { formatPaise } from '@/lib/money';

export const metadata: Metadata = { title: 'Shop regional foods', description: 'Explore approved and published regional food stories and catalogue entries from Rasvani.' };
type Product = { id: string; slug: string; name: string; description: string | null; storage_condition: string; category_id: string | null; created_at: string };
type Category = { id: string; name: string; slug: string };
type PublicMedia = { product_id: string; media_id: string; object_path: string; mime_type: string; uploaded_at: string };
type DistrictOption = { name: string; slug: string };
const regionSlug = (name: string) => name.toLowerCase().replaceAll(' ', '-');
const storageLabels: Record<string, string> = { ambient: 'Ambient storage', chilled: 'Chilled storage', frozen: 'Frozen storage', other: 'Storage details to confirm' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; region?: string; district?: string }> }) {
  const params = await searchParams;
  const term = (params.q ?? '').trim().slice(0, 80);
  const safeTerm = term.normalize('NFC').replace(/[\\%_(),.*]/g, ' ').replace(/\s+/g, ' ').trim();
  const category = (params.category ?? '').trim();
  const region = (params.region ?? '').trim();
  const district = (params.district ?? '').trim();
  const validRegion = regions.some((name) => regionSlug(name) === region);
  const validDistrictFilter = validRegion && Boolean(district);
  let products: Product[] = [];
  let categories: Category[] = [];
  let districts: DistrictOption[] = [];
  const productImages = new Map<string, string>();
  const prices = new Map<string, number>();
  let configured = true;
  let loadError = false;
  try {
    const supabase = await createClient();
    const [categoryResult, productResult] = await Promise.all([
      supabase.from('categories').select('id,name,slug').eq('active', true).order('name').limit(100),
      (() => {
        let query = supabase.from('products').select('id,slug,name,description,storage_condition,category_id,created_at').eq('approval_status', 'approved').not('published_at', 'is', null).order('name').limit(100);
        if (safeTerm) query = query.ilike('name', `%${safeTerm}%`);
        if (category) query = query.eq('category_id', category);
        return query;
      })(),
    ]);
    categories = (categoryResult.data ?? []) as Category[];
    products = (term && !safeTerm ? [] : (productResult.data ?? [])) as Product[];
    loadError = Boolean(categoryResult.error || productResult.error);

    // Region/district filters are driven by approved associations only.
    if (validRegion) {
      const regionDistrictResult = await supabase.from('districts').select('name,slug').eq('region_id', region).eq('publication_status', 'approved').order('name').limit(200);
      if (regionDistrictResult.error) loadError = true;
      else districts = (regionDistrictResult.data ?? []) as DistrictOption[];
      let associationQuery = supabase.from('product_regional_associations').select('product_id,district_id,products!inner(dietary_classification,dietary_review_status)').eq('region_id', region).eq('review_status', 'approved').eq('products.dietary_review_status', 'approved').in('products.dietary_classification', ['vegetarian','vegan']).limit(500);
      if (validDistrictFilter) {
        const selectedDistrict = districts.find((item) => item.slug === district);
        if (!selectedDistrict) {
          products = [];
        } else {
          const districtLookup = await supabase.from('districts').select('id').eq('region_id', region).eq('slug', district).eq('publication_status', 'approved').maybeSingle();
          if (districtLookup.error) loadError = true;
          if (!districtLookup.data) products = [];
          else associationQuery = associationQuery.eq('district_id', districtLookup.data.id);
        }
      }
      if (!(validDistrictFilter && products.length === 0)) {
        const associationResult = await associationQuery;
        if (associationResult.error) loadError = true;
        else {
          const regionalProductIds = [...new Set((associationResult.data ?? []).map((item) => item.product_id as string))];
          products = products.filter((product) => regionalProductIds.includes(product.id));
        }
      }
    } else if (region || district) {
      products = [];
    }
    if (term) {
      if (safeTerm) {
        const aliasResult = await supabase.from('product_search_terms').select('product_id').eq('review_status', 'approved').ilike('normalized_term', `%${safeTerm}%`).limit(100);
        if (aliasResult.error) loadError = true;
        else {
          const known = new Set(products.map((product) => product.id));
          const aliasIds = [...new Set((aliasResult.data ?? []).map((item) => item.product_id as string))].filter((id) => !known.has(id));
          if (aliasIds.length) {
            let aliasProductsQuery = supabase.from('products').select('id,slug,name,description,storage_condition,category_id,created_at').eq('approval_status', 'approved').not('published_at', 'is', null).in('id', aliasIds).order('name').limit(100);
            if (category) aliasProductsQuery = aliasProductsQuery.eq('category_id', category);
            const aliasProductsResult = await aliasProductsQuery;
            if (aliasProductsResult.error) loadError = true;
            else products = [...products, ...((aliasProductsResult.data ?? []) as Product[])];
          }
        }
      }
    }
    // Alias matches are merged after the primary query; re-apply the regional scope
    // so an approved spelling cannot bypass the selected state/district filter.
    if (validRegion && products.length > 0) {
      let scopedQuery = supabase.from('product_regional_associations').select('product_id,district_id,products!inner(dietary_classification,dietary_review_status)').eq('region_id', region).eq('review_status', 'approved').eq('products.dietary_review_status', 'approved').in('products.dietary_classification', ['vegetarian','vegan']).limit(500);
      if (validDistrictFilter) {
        const selectedDistrict = await supabase.from('districts').select('id').eq('region_id', region).eq('slug', district).eq('publication_status', 'approved').maybeSingle();
        if (selectedDistrict.error) loadError = true;
        if (selectedDistrict.data) scopedQuery = scopedQuery.eq('district_id', selectedDistrict.data.id);
        else products = [];
      }
      const scopedResult = await scopedQuery;
      if (scopedResult.error) loadError = true;
      else {
        const scopedIds = new Set((scopedResult.data ?? []).map((item) => item.product_id as string));
        products = products.filter((product) => scopedIds.has(product.id));
      }
    }
    if (!productResult.error && products.length > 0) {
      const priceResult = await supabase.rpc('get_public_product_prices', { p_product_ids: products.map((product) => product.id) });
      if (!priceResult.error) ((priceResult.data ?? []) as { product_id: string; amount_paise: number | string }[]).forEach((row) => prices.set(row.product_id, Number(row.amount_paise)));
      const mediaResult = await supabase.rpc('get_public_catalogue_product_media', {
        p_product_ids: products.map((product) => product.id), p_limit_per_product: 1,
      });
      if (!mediaResult.error) {
        const mediaRows = (mediaResult.data ?? []) as PublicMedia[];
        const signedImages = await Promise.all(mediaRows.map(async (item) => {
          const { data } = await supabase.storage.from('producer-product-media').createSignedUrl(item.object_path, 900);
          return data?.signedUrl ? [item.product_id, data.signedUrl] as const : null;
        }));
        signedImages.forEach((entry) => { if (entry) productImages.set(entry[0], entry[1]); });
      }
    }
  } catch { configured = false; }
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));
  return <section className="wrap shop-page">
    <div className="page-hero"><div className="eyebrow">Shop regional foods</div><h1>A considered collection.</h1><p className="section-intro">Home-made vegetarian regional foods from Bihar. Add to cart, then choose home delivery (selected areas of Bihar) or order online and collect from a Rasvani partner shop.</p></div>
    {!configured ? <div className="shop-empty-editorial" role="status"><div className="shop-empty-editorial-image"><Image src="/images/rasvani-feast-hero.webp" alt="A richly arranged vegetarian table with regional dishes" fill sizes="(max-width: 760px) 100vw, 45vw"/></div><div className="shop-empty-editorial-copy"><div className="eyebrow">THE RASVANI COLLECTION</div><h2>A thoughtful collection is taking shape.</h2><p>Our first regional collections are being prepared with care. Published foods will appear here with their approved details and availability.</p><div className="cta-row"><Link href="/explore-india" className="btn">Explore India ↗</Link><Link href="/india-map" className="text-link">Start with the map →</Link></div></div></div> : loadError ? <p className="status" role="status">We are refreshing the catalogue. Please revisit this collection shortly.</p> : <>
      <form className="shop-filters" action="/shop" method="get">
        <label>Search products<input type="search" name="q" defaultValue={term} maxLength={80} placeholder="Search product names and reviewed regional spellings"/></label>
        <label>State / Union Territory<select name="region" defaultValue={validRegion ? region : ''}><option value="">All regions</option>{regions.map((name) => <option key={name} value={regionSlug(name)}>{name}</option>)}</select></label>
        <label>District<select name="district" defaultValue={validDistrictFilter ? district : ''} disabled={!validRegion}><option value="">All approved districts</option>{districts.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
        <label>Category<select name="category" defaultValue={category}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <button className="btn" type="submit">Apply filters</button>
        {(term || category || validRegion || district) && <Link className="text-link" href="/shop">Clear filters</Link>}
      </form>
      {products.length === 0 ? <div className="shop-empty"><h2>The collection is taking shape.</h2><p>{term || category || region || district ? 'No published products match those filters.' : 'No products are currently published. New entries appear here only after the required reviews are complete.'}</p></div> : <div className="shop-grid">{products.map((product) => <article className="shop-card" key={product.id}>
        {productImages.has(product.id) ? <div className="shop-card-photo"><Image src={productImages.get(product.id)!} alt={`${product.name} product photo`} width={640} height={420} unoptimized/></div> : <div className="shop-card-art" aria-hidden="true"><span>Rasvani · Regional catalogue</span></div>}
        <div className="shop-card-body"><div className="eyebrow">{product.category_id ? categoryNames.get(product.category_id) ?? 'Regional food' : 'Regional food'}</div><h2><Link href={`/shop/${encodeURIComponent(product.slug)}`}>{product.name}</Link></h2><p>{product.description?.trim() || 'Product description is being prepared for publication.'}</p>{prices.has(product.id) ? <div className="shop-card-price"><strong>{formatPaise(prices.get(product.id)!)}</strong><AddToCart productId={product.id} slug={product.slug} name={product.name} unitPaise={prices.get(product.id)!} /></div> : <p className="notice">Price will be shown soon.</p>}<div className="shop-card-foot"><span>{storageLabels[product.storage_condition] ?? 'Storage details to confirm'}</span><Link className="text-link" href={`/shop/${encodeURIComponent(product.slug)}`}>View details →</Link></div></div>
      </article>)}</div>}
      <p className="notice shop-disclaimer">Ordering is open for Bihar only. Rasvani calls you to confirm every order, the final amount, and delivery or pickup. Only quality-approved photographs attached to published products are displayed.</p>
    </>}
  </section>;
}
