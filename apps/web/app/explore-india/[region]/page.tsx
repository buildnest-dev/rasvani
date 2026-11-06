import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { regions } from '@/lib/regions';
import { biharDistricts, slugifyDistrict } from '@/lib/bihar-districts';
import { createClient } from '@/lib/supabase/server';
import { BiharDistrictMap } from '@/components/bihar-district-map';

type District = { id: string; name: string; slug: string };
type RegionGuide = { introduction: string | null; food_heritage_note: string | null };
type Association = {
  id: string; association_type: string; relationship_note: string | null;
  products: { id: string; name: string; slug: string; description: string | null; category_id: string | null } | null;
};
type PublicMedia = { product_id: string; object_path: string };
type RegionalCategory = { id: string; name: string; productCount: number };
const relationLabels: Record<string, string> = {
  origin_claim: 'Origin claim', produced_in: 'Produced in',
  traditionally_associated_with: 'Traditionally associated with', popular_in: 'Popular in',
};
const slugFor = (name: string) => name.toLowerCase().replaceAll(' ', '-');
export function generateStaticParams() { return regions.map(region => ({ region: slugFor(region) })); }
export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const slug = (await params).region;
  const region = regions.find(r => slugFor(r) === slug);
  return { title: region ? `${region} | Explore India` : 'Region not found', description: region ? `Explore district guides and regional food collections from ${region}.` : undefined };
}
export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const slug = (await params).region;
  const region = regions.find(r => slugFor(r) === slug);
  if (!region) notFound();

  let districts: District[] = [];
  let guide: RegionGuide | null = null;
  let associations: Association[] = [];
  const productImages = new Map<string, string>();
  let regionalCategoryCounts: RegionalCategory[] = [];
  let regionalCategoryNames = new Map<string, string>();
  let configured = true;
  let loadError = false;
  try {
    const supabase = await createClient();
    const [districtResult, guideResult, associationResult] = await Promise.all([
      supabase.from('districts').select('id,name,slug').eq('region_id', slug).eq('publication_status', 'approved').order('name').limit(200),
      supabase.from('region_guides').select('introduction,food_heritage_note').eq('region_id', slug).eq('publication_status', 'approved').maybeSingle(),
      supabase.from('product_regional_associations').select('id,association_type,relationship_note,products!inner(id,name,slug,description,category_id,dietary_classification,dietary_review_status)').eq('region_id', slug).is('district_id', null).eq('review_status', 'approved').eq('products.dietary_review_status', 'approved').in('products.dietary_classification', ['vegetarian','vegan']).limit(100),
    ]);
    districts = (districtResult.data ?? []) as District[];
    guide = (guideResult.data ?? null) as RegionGuide | null;
    associations = (associationResult.data ?? []) as unknown as Association[];
    const associatedCategoryIds = [...new Set(associations.map((item) => item.products?.category_id).filter((id): id is string => Boolean(id)))];
    const categoryResult = associatedCategoryIds.length
      ? await supabase.from('categories').select('id,name').in('id', associatedCategoryIds).eq('active', true).order('name')
      : { data: [], error: null };
    const activeCategories = (categoryResult.data ?? []) as { id: string; name: string }[];
    regionalCategoryCounts = activeCategories.map((category) => ({
      ...category,
      productCount: new Set(associations.filter((item) => item.products?.category_id === category.id).map((item) => item.products?.id).filter((id): id is string => Boolean(id))).size,
    })).filter((category) => category.productCount > 0);
    regionalCategoryNames = new Map(regionalCategoryCounts.map((category) => [category.id, category.name]));
    loadError = Boolean(districtResult.error || guideResult.error || associationResult.error || categoryResult.error);
    const productIds = [...new Set(associations.map((item) => item.products?.id).filter((id): id is string => Boolean(id)))];
    if (productIds.length) {
      const media = await supabase.rpc('get_public_catalogue_product_media', { p_product_ids: productIds, p_limit_per_product: 1 });
      if (!media.error) {
        const rows = (media.data ?? []) as PublicMedia[];
        const signed = await Promise.all(rows.map(async (row) => {
          const { data } = await supabase.storage.from('producer-product-media').createSignedUrl(row.object_path, 900);
          return data?.signedUrl ? [row.product_id, data.signedUrl] as const : null;
        }));
        signed.forEach((entry) => { if (entry) productImages.set(entry[0], entry[1]); });
      }
    }
  } catch { configured = false; }

  // Bihar's district names are an independently verified navigation baseline;
  // they do not imply that food, producer or product content is published.
  const districtNavigation: District[] = districts.length > 0
    ? districts
    : region === 'Bihar'
      ? biharDistricts.map((name) => ({ id: slugifyDistrict(name), name, slug: slugifyDistrict(name) }))
      : [];
  const districtCount = region === 'Bihar' ? districtNavigation.length : districts.length;

  return <div className="region-page-premium">
    <header className="region-hero-premium"><div className="wrap">
      <Link href="/explore-india" className="region-back-link">← Explore all regions</Link>
      <div className="eyebrow">REGIONAL FIELD GUIDE · INDIA</div><h1>{region}</h1>
      {region === 'Bihar' && <span className="region-first-label">First editorial launch focus</span>}
      {guide?.introduction ? <p className="section-intro region-guide-intro">{guide.introduction}</p> : <p className="section-intro">Follow the places, food traditions and regional collections of {region}. District and food stories are added as their records are reviewed.</p>}
      <div className="region-hero-stats"><span><b>{districtCount || '—'}</b> {region === 'Bihar' ? 'districts in directory' : 'approved district guides'}</span><i/><span><b>{associations.length}</b> approved region-level food associations</span></div>
    </div></header>
    <main className="wrap region-main-content">
      {!configured && <p className="region-inline-state">Regional stories and product collections are being prepared for publication.</p>}
      {configured && loadError && <p className="region-inline-state" role="status">Some regional details are temporarily unavailable. Please revisit this collection shortly.</p>}
      {guide?.food_heritage_note && <section className="region-heritage-note"><div className="eyebrow">FOOD HERITAGE &amp; TRADITIONS</div><p>{guide.food_heritage_note}</p></section>}
      {region === 'Bihar' && <BiharDistrictMap />}
      <section className="district-explorer" aria-labelledby="district-heading">
        <div className="eyebrow">01 / THE DISTRICT INDEX</div><h2 id="district-heading">Discover {region}, district by district.</h2>
        {districtNavigation.length > 0
          ? <ul className="district-list">{districtNavigation.map((district) => <li key={district.id}><Link href={`/explore-india/${slug}/district/${encodeURIComponent(district.slug)}`}>{district.name}<span aria-hidden="true">↗</span></Link></li>)}</ul>
          : <p className="notice">District guides for {region} will appear here as their administrative names and publication records are verified.</p>}
        {region === 'Bihar' && <p className="district-index-footnote">These district names are provided for navigation. Food associations, stories and products are presented separately after review.</p>}
      </section>
      {regionalCategoryCounts.length > 0 && <section className="region-category-discovery" aria-labelledby="region-category-heading">
        <div className="eyebrow">02 / BROWSE THE REGIONAL PANTRY</div><h2 id="region-category-heading">Explore {region} by food category.</h2>
        <div className="region-category-list">{regionalCategoryCounts.map((category) => <Link href={`/shop?category=${encodeURIComponent(category.id)}`} key={category.id}>
          <strong>{category.name}</strong><span>{category.productCount} approved {category.productCount === 1 ? 'product' : 'products'}</span>
        </Link>)}</div>
        <p className="notice">Category links open the wider Shop category filter; not every product in a category is necessarily associated with {region}.</p>
      </section>}
      <section className="region-food-collection" aria-labelledby="region-food-heading"><div className="eyebrow">03 / REGIONAL FOOD COLLECTION</div><h2 id="region-food-heading">Foods associated with {region}.</h2>
        {associations.length === 0
          ? <div className="region-empty-curation"><span>✳</span><h3>The regional table is taking shape.</h3><p>Food stories and product listings for {region} will appear here as their names, regional relationships and catalogue details are reviewed.</p></div>
          : <div className="region-food-list-premium">{associations.map(item => item.products && <article className="district-food-card region-food-card-premium" key={item.id}>
            {productImages.get(item.products.id) && <div className="regional-product-art"><Image src={productImages.get(item.products.id)!} alt={item.products.name} width={640} height={420} unoptimized/></div>}
            <div className="eyebrow">{regionalCategoryNames.get(item.products.category_id ?? '') ?? 'Regional food'} · {relationLabels[item.association_type] ?? 'Regional association'}</div><h3><Link href={`/shop/${encodeURIComponent(item.products.slug)}`}>{item.products.name}</Link></h3>{item.relationship_note && <p>{item.relationship_note}</p>}{item.products.description && <p>{item.products.description}</p>}
            <Link className="regional-product-link" href={`/shop/${encodeURIComponent(item.products.slug)}`}>View catalogue details ↗</Link>
          </article>)}</div>}
      </section>
      <p className="notice region-association-disclaimer">Regional relationship labels describe the specific association approved for publication. This relationship does not imply exclusive origin; a food may be associated with multiple places. Not every item in a wider category belongs to this region.</p>
      <div className="region-page-actions"><Link href="/india-map" className="btn">Open the interactive India map ↗</Link><Link href="/shop" className="text-link">Browse approved catalogue →</Link></div>
    </main>
  </div>;
}
