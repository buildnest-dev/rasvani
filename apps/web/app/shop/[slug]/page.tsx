import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { regions } from '@/lib/regions';
import { createClient } from '@/lib/supabase/server';

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ingredients: string[] | null;
  allergen_statement: string | null;
  storage_condition: string;
  category_id: string | null;
};
type Category = { name: string };
type PublicMedia = { product_id: string; media_id: string; object_path: string; mime_type: string; uploaded_at: string };
type RegionalAssociation = {
  id: string;
  region_id: string;
  district_id: string | null;
  association_type: string;
  relationship_note: string | null;
};
type ApprovedDistrict = { id: string; name: string; slug: string; region_id: string };
type PublicRegionalRelationship = RegionalAssociation & {
  region_name: string;
  region_slug: string;
  district: ApprovedDistrict | null;
};
const storageLabels: Record<string, string> = {
  ambient: 'Ambient storage', chilled: 'Chilled storage', frozen: 'Frozen storage', other: 'Storage details to confirm',
};
const relationLabels: Record<string, string> = {
  origin_claim: 'Origin claim',
  produced_in: 'Produced in',
  traditionally_associated_with: 'Traditionally associated with',
  popular_in: 'Popular in',
};
const regionSlug = (name: string) => name.toLowerCase().replaceAll(' ', '-');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug.replaceAll('-', ' ')} · Regional food | Rasvani` };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: Product | null = null;
  let category: Category | null = null;
  let productImages: { media_id: string; url: string }[] = [];
  let regionalRelationships: PublicRegionalRelationship[] = [];
  let regionalContentUnavailable = false;

  try {
    const supabase = await createClient();
    const result = await supabase.from('products')
      .select('id,slug,name,description,ingredients,allergen_statement,storage_condition,category_id')
      .eq('slug', slug).eq('approval_status', 'approved').not('published_at', 'is', null).maybeSingle();
    if (result.error) throw result.error;
    product = result.data as Product | null;

    if (product?.category_id) {
      const categoryResult = await supabase.from('categories').select('name').eq('id', product.category_id).eq('active', true).maybeSingle();
      if (!categoryResult.error) category = categoryResult.data as Category | null;
    }

    if (product) {
      const [mediaResult, associationResult] = await Promise.all([
        supabase.rpc('get_public_catalogue_product_media', { p_product_ids: [product.id], p_limit_per_product: 12 }),
        supabase.from('product_regional_associations')
          .select('id,region_id,district_id,association_type,relationship_note')
          .eq('product_id', product.id).eq('review_status', 'approved').limit(100),
      ]);

      if (!mediaResult.error) {
        const mediaRows = (mediaResult.data ?? []) as PublicMedia[];
        productImages = (await Promise.all(mediaRows.map(async (item) => {
          const { data } = await supabase.storage.from('producer-product-media').createSignedUrl(item.object_path, 900);
          return data?.signedUrl ? { media_id: item.media_id, url: data.signedUrl } : null;
        }))).filter((item): item is { media_id: string; url: string } => item !== null);
      }

      if (associationResult.error) {
        regionalContentUnavailable = true;
      } else {
        const associationRows = (associationResult.data ?? []) as RegionalAssociation[];
        const knownRegions = new Map(regions.map((name) => [regionSlug(name), name]));
        const districtIds = [...new Set(associationRows.map((item) => item.district_id).filter((id): id is string => Boolean(id)))];
        let approvedDistricts: ApprovedDistrict[] = [];
        if (districtIds.length > 0) {
          const districtResult = await supabase.from('districts').select('id,name,slug,region_id')
            .in('id', districtIds).eq('publication_status', 'approved').limit(100);
          if (districtResult.error) regionalContentUnavailable = true;
          else approvedDistricts = (districtResult.data ?? []) as ApprovedDistrict[];
        }
        const districtsById = new Map(approvedDistricts.map((district) => [district.id, district]));
        regionalRelationships = associationRows.flatMap((association) => {
          const name = knownRegions.get(association.region_id);
          if (!name) return [];
          const district = association.district_id ? districtsById.get(association.district_id) ?? null : null;
          // An association with a district is only public here when that district itself is approved
          // and belongs to the same region. The RLS policy applies the same publication gate.
          if (association.district_id && (!district || district.region_id !== association.region_id)) return [];
          return [{ ...association, region_name: name, region_slug: association.region_id, district }];
        });
      }
    }
  } catch {
    return <section className="wrap shop-page"><div className="product-recovery-panel"><div className="product-recovery-image"><Image src="/images/rasvani-pantry-ingredients.webp" alt="A selection of grains, pulses, spices and fresh ingredients" fill sizes="(max-width: 760px) 100vw, 42vw"/></div><div className="product-recovery-copy"><div className="eyebrow">RASVANI CATALOGUE</div><h1>Product details are being prepared.</h1><p>This catalogue entry could not be opened just now. Return to the collection to explore the products currently available.</p><Link className="btn" href="/shop">Back to the collection ↗</Link></div></div></section>;
  }

  if (!product) notFound();

  return <section className="wrap shop-page">
    <div className="page-hero">
      <div className="eyebrow">{category?.name ?? 'Regional catalogue'}</div>
      <h1>{product.name}</h1>
      <p className="section-intro">{product.description || 'A product description has not been provided.'}</p>
      <Link className="text-link" href="/shop">← Back to shop</Link>
    </div>

    <div className="product-detail-panel">
      <div>
        {productImages.length ? <div className="product-detail-gallery">
          {productImages.map((item, index) => <figure key={item.media_id}>
            <Image src={item.url} alt={`${product.name} approved product photo ${index + 1}`} width={900} height={680} unoptimized />
            <figcaption>Approved product photograph</figcaption>
          </figure>)}
        </div> : <div className="shop-card-art shop-detail-art" aria-hidden="true">
          <span>Rasvani · Regional catalogue</span>
          <p className="product-photo-fallback">No quality-approved product photograph is published yet.</p>
        </div>}
      </div>
      <div className="product-detail-copy">
        <h2>Product information</h2>
        <dl>
          <dt>Storage</dt><dd>{storageLabels[product.storage_condition] ?? 'Storage details to confirm'}</dd>
          <dt>Ingredients</dt><dd>{product.ingredients?.length ? product.ingredients.join(', ') : 'Not provided'}</dd>
          <dt>Allergen statement</dt><dd>{product.allergen_statement || 'Not provided'}</dd>
        </dl>
        <p className="status">Ordering is not open for this catalogue entry yet. Price, pack options, availability and delivery details will appear when the order service is ready.</p>
      </div>
    </div>

    <section className="product-regional-section" aria-labelledby="product-regional-heading">
      <div className="eyebrow">Evidence-reviewed connections</div>
      <h2 id="product-regional-heading">Regional story</h2>
      {regionalContentUnavailable ? <p className="status">Approved regional connections could not be loaded. Please try again later.</p> : regionalRelationships.length === 0 ?
        <p className="notice">No approved regional or district relationship is currently published for this product. No place of origin is assumed.</p> :
        <div className="product-regional-grid">
          {regionalRelationships.map((relationship) => <article className="product-regional-card" key={relationship.id}>
            <div className="eyebrow">{relationLabels[relationship.association_type] ?? 'Regional association'}</div>
            <h3><Link href={`/explore-india/${relationship.region_slug}`}>{relationship.region_name}</Link></h3>
            {relationship.district && <p className="product-regional-district">District: <Link href={`/explore-india/${relationship.region_slug}/district/${encodeURIComponent(relationship.district.slug)}`}>{relationship.district.name}</Link></p>}
            {relationship.relationship_note && <p>{relationship.relationship_note}</p>}
          </article>)}
        </div>}
      <p className="notice product-regional-disclaimer">These labels describe the specific relationship approved for publication. A regional association does not establish that a food is exclusive to a place, nor does it confirm current stock or delivery coverage.</p>
    </section>
  </section>;
}
