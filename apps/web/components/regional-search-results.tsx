import Link from 'next/link';
import { LocalizedCopy } from '@/components/localized-copy';
import { regions } from '@/lib/regions';
import { createClient } from '@/lib/supabase/server';

type DistrictMatch = { id: string; region_id: string; name: string; slug: string };
type SearchTermMatch = { product_id: string; term: string; locale: string; term_type: string };
type CategoryMatch = { id: string; name: string };
type ProductMatch = { id: string; slug: string; name: string; description: string | null; category_id: string | null };
type AssociationMatch = { product_id: string; region_id: string; district_id: string | null; association_type: string };

const localeNames: Record<string, string> = {
  en: 'English', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi',
  gu: 'Gujarati', pa: 'Punjabi', kn: 'Kannada', ml: 'Malayalam', or: 'Odia', as: 'Assamese',
};
const relationNames: Record<string, string> = {
  origin_claim: 'Origin claim', produced_in: 'Produced in',
  traditionally_associated_with: 'Traditionally associated with', popular_in: 'Popular in',
};
const regionSlug = (name: string) => name.toLowerCase().replaceAll(' ', '-');

export async function RegionalSearchResults({ query }: { query: string }) {
  const term = query.trim().normalize('NFC').slice(0, 80);
  if (term.length < 2) return <p className="notice">Enter at least two characters to search regional foods, names and places.</p>;
  // Treat user input as literal text, not PostgREST pattern syntax.
  const safeTerm = term.replace(/[\\%_(),.*]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!safeTerm) return <p className="notice">Enter letters or numbers to search.</p>;
  const pattern = `%${safeTerm}%`;
  const matchedRegions = regions.filter((region) => region.toLocaleLowerCase().includes(safeTerm.toLocaleLowerCase()));

  let districts: DistrictMatch[] = [];
  let searchTerms: SearchTermMatch[] = [];
  let categories: CategoryMatch[] = [];
  let products: ProductMatch[] = [];
  let associations: AssociationMatch[] = [];
  let configured = true;
  let loadError = false;

  try {
    const supabase = await createClient();
    const [districtResult, termResult, categoryResult, directProductResult] = await Promise.all([
      supabase.from('districts').select('id,region_id,name,slug').eq('publication_status', 'approved').ilike('name', pattern).limit(50),
      supabase.from('product_search_terms').select('product_id,term,locale,term_type').eq('review_status', 'approved').ilike('normalized_term', pattern).limit(100),
      supabase.from('categories').select('id,name').eq('active', true).ilike('name', pattern).limit(50),
      supabase.from('products').select('id,slug,name,description,category_id').eq('approval_status', 'approved').not('published_at', 'is', null).ilike('name', pattern).limit(100),
    ]);
    loadError = Boolean(districtResult.error || termResult.error || categoryResult.error || directProductResult.error);
    districts = (districtResult.data ?? []) as DistrictMatch[];
    searchTerms = (termResult.data ?? []) as SearchTermMatch[];
    categories = (categoryResult.data ?? []) as CategoryMatch[];

    const productIds = new Set<string>([
      ...((directProductResult.data ?? []) as ProductMatch[]).map((p) => p.id),
      ...searchTerms.map((item) => item.product_id),
    ]);

    // A state, district or category query also discovers published products
    // linked through separately approved regional relationships.
    const matchedRegionIds = matchedRegions.map(regionSlug);
    const matchedDistrictIds = districts.map((district) => district.id);
    const categoryIds = categories.map((category) => category.id);
    const associationQueries = [];
    if (matchedRegionIds.length) {
      associationQueries.push(supabase.from('product_regional_associations').select('product_id,region_id,district_id,association_type').eq('review_status', 'approved').in('region_id', matchedRegionIds).limit(200));
    }
    if (matchedDistrictIds.length) {
      associationQueries.push(supabase.from('product_regional_associations').select('product_id,region_id,district_id,association_type').eq('review_status', 'approved').in('district_id', matchedDistrictIds).limit(200));
    }
    const [categoryProductsResult, ...associationResults] = await Promise.all([
      categoryIds.length
        ? supabase.from('products').select('id').eq('approval_status', 'approved').not('published_at', 'is', null).in('category_id', categoryIds).limit(100)
        : Promise.resolve({ data: [], error: null }),
      ...associationQueries,
    ]);
    if (categoryProductsResult.error || associationResults.some((result) => result.error)) loadError = true;
    for (const row of categoryProductsResult.data ?? []) productIds.add((row as { id: string }).id);
    associations = associationResults.flatMap((result) => (result.data ?? []) as AssociationMatch[]);
    associations.forEach((item) => productIds.add(item.product_id));

    const ids = [...productIds].slice(0, 100);
    if (ids.length) {
      const productResult = await supabase.from('products').select('id,slug,name,description,category_id').eq('approval_status', 'approved').not('published_at', 'is', null).in('id', ids).order('name').limit(100);
      if (productResult.error) loadError = true;
      else products = (productResult.data ?? []) as ProductMatch[];
    }
  } catch {
    configured = false;
  }

  const regionNameById = new Map(regions.map((name) => [regionSlug(name), name]));
  const districtById = new Map(districts.map((district) => [district.id, district]));
  const termsByProduct = new Map<string, SearchTermMatch[]>();
  searchTerms.forEach((item) => termsByProduct.set(item.product_id, [...(termsByProduct.get(item.product_id) ?? []), item]));
  const associationsByProduct = new Map<string, AssociationMatch[]>();
  associations.forEach((item) => associationsByProduct.set(item.product_id, [...(associationsByProduct.get(item.product_id) ?? []), item]));
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  return <LocalizedCopy><section className="regional-search-results" aria-live="polite" aria-label="Regional search results">
    <div className="regional-search-heading"><div className="eyebrow">Search results</div><p>Matches for <strong>“{term}”</strong></p></div>
    {!configured ? <p className="status">State and Union Territory matches are available below. District and product matches will appear as their reviewed records are published.</p> : loadError ? <p className="status">Some regional results are temporarily unavailable. Please try again shortly.</p> : null}

    {matchedRegions.length > 0 && <div className="regional-result-group"><h3>States and Union Territories</h3><div className="regional-result-chips">{matchedRegions.map((region) => <Link key={region} href={`/explore-india/${regionSlug(region)}`}>{region}<span aria-hidden="true"> →</span></Link>)}</div></div>}
    {districts.length > 0 && <div className="regional-result-group"><h3>Verified districts</h3><ul className="regional-result-list">{districts.map((district) => <li key={district.id}><Link href={`/explore-india/${district.region_id}/district/${encodeURIComponent(district.slug)}`}>{district.name}, {regionNameById.get(district.region_id) ?? district.region_id}<span aria-hidden="true"> →</span></Link></li>)}</ul></div>}
    {products.length > 0 && <div className="regional-result-group"><h3>Published regional foods</h3><div className="regional-search-product-list">{products.map((product) => {
      const aliases = termsByProduct.get(product.id) ?? [];
      const links = associationsByProduct.get(product.id) ?? [];
      const associationLabels = [...new Set(links.map((item) => {
        const district = item.district_id ? districtById.get(item.district_id) : undefined;
        return `${relationNames[item.association_type] ?? 'Regional association'} · ${district ? `${district.name}, ` : ''}${regionNameById.get(item.region_id) ?? item.region_id}`;
      }))];
      return <article className="regional-search-product" key={product.id}><div><div className="eyebrow">{product.category_id ? categoryNameById.get(product.category_id) ?? 'Regional food' : 'Regional food'}</div><h4><Link href={`/shop/${encodeURIComponent(product.slug)}`}>{product.name}</Link></h4>{product.description && <p>{product.description}</p>}
        {aliases.length > 0 && <p className="regional-match-note">Matched approved name: {aliases.slice(0, 2).map((alias) => `${alias.term} (${localeNames[alias.locale] ?? alias.locale})`).join(' · ')}</p>}
        {associationLabels.length > 0 && <p className="regional-match-note">{associationLabels.slice(0, 2).join(' · ')}</p>}
      </div><Link className="text-link" href={`/shop/${encodeURIComponent(product.slug)}`}>View food →</Link></article>;
    })}</div></div>}
    {matchedRegions.length === 0 && districts.length === 0 && products.length === 0 && configured && !loadError && <p className="shop-empty" role="status">No approved regional foods or places match this search yet. Try another spelling, or search in a supported regional language.</p>}
    <p className="notice regional-search-note">Search results include only published products, approved regional associations, approved districts and evidence-reviewed search terms. Draft spellings and unreviewed origin claims are never used.</p>
  </section></LocalizedCopy>;
}
