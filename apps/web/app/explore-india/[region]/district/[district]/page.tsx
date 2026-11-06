import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { regions } from '@/lib/regions';
import { biharDistricts, slugifyDistrict } from '@/lib/bihar-districts';
import { DistrictFoodDiscovery } from '@/components/district-food-discovery';
import { BiharDistrictSwitcher } from '@/components/bihar-district-switcher';
import { biharFoodResearchLeads } from '@/lib/bihar-food-research';
import { biharDrySnackByDistrict } from '@/lib/bihar-dry-snacks';
import { BiharDistrictFoodTrails } from '@/components/bihar-district-food-trails';
import { SiwanDistrictExperience } from '@/components/siwan-district-experience';
import { BiharTouristPlacesSection } from '@/components/bihar-tourist-places-section';
import { DistrictAbout, DistrictGallery, DistrictHeroArt, DistrictMotion, DistrictSpotlight, DistrictTaste } from '@/components/district-showcase';
import { biharHomeFoodItems } from '@/lib/bihar-home-food-items';
import { biharTouristPlaces } from '@/lib/bihar-tourist-places';

type District = { id: string; name: string; slug: string; introduction: string | null; heritage_note: string | null };
type Association = { id: string; association_type: string; relationship_note: string | null; products: { id: string; name: string; slug: string; description: string | null; ingredients: string[] | null; categories: { name: string } | null } | null };
type PublicMedia = { product_id: string; object_path: string };
const relationLabels: Record<string, string> = { origin_claim: 'Origin claim', produced_in: 'Produced in', traditionally_associated_with: 'Traditionally associated with', popular_in: 'Popular in' };
const slugFor = (name: string) => name.toLowerCase().replaceAll(' ', '-');
export async function generateMetadata({ params }: { params: Promise<{ region: string; district: string }> }): Promise<Metadata> {
  const p = await params; const region = regions.find(r => slugFor(r) === p.region);
  return { title: region ? `${p.district.replaceAll('-', ' ')} · ${region} | Rasvani` : 'District not found' };
}
export default async function DistrictPage({ params }: { params: Promise<{ region: string; district: string }> }) {
  const { region: regionSlug, district: districtSlug } = await params;
  const region = regions.find(r => slugFor(r) === regionSlug); if (!region) notFound();

  // Siwan has a deliberately district-specific editorial experience. Resolve this
  // route before catalogue/database lookups so a missing Supabase configuration
  // can never send Siwan visitors to the generic district template.
  if (regionSlug === 'bihar' && districtSlug === 'siwan') {
    return <div className="district-page-premium siwan-page-premium">
      <div className="wrap siwan-breadcrumb"><Link href="/explore-india">India</Link><span>›</span><Link href="/explore-india/bihar">Bihar</Link><span>›</span><strong>Siwan</strong></div>
      <main className="wrap district-main-content siwan-main"><SiwanDistrictExperience /><BiharTouristPlacesSection districtSlug="siwan" districtName="Siwan" /><BiharDistrictSwitcher activeDistrict="Siwan" /><div className="district-bottom-nav"><Link className="btn" href="/explore-india/bihar">Back to Bihar districts</Link><Link className="text-link" href="/india-map">Explore India map ↗</Link></div></main>
    </div>;
  }
  const district = null as District | null; const associations = [] as Association[]; const productImages = new Map<string, string>();
  const configured = true; const loadError = false;

  const BiharDistrictName = region === 'Bihar' ? biharDistricts.find((name) => slugifyDistrict(name) === districtSlug) : undefined;
  if (configured && !loadError && !district && !BiharDistrictName) notFound();
  const districtName = district?.name ?? BiharDistrictName ?? districtSlug.replaceAll('-', ' ');
  const researchLeads = region === 'Bihar' ? (biharFoodResearchLeads[districtSlug] ?? []) : [];
  const drySnackDistrict = region === 'Bihar' ? biharDrySnackByDistrict[districtSlug] : undefined;

  const fallbackFoods = biharHomeFoodItems.slice(0, 6).map((item) => ({ name: item.name, image: item.image, alt: item.imageAlt }));
  const ownFoods = [
    ...(drySnackDistrict?.snacks ?? []).map((item) => ({ name: item.name, image: item.image, alt: item.imageAlt })),
    ...researchLeads.map((lead) => ({ name: lead.name, image: lead.image, alt: lead.imageAlt })),
  ];
  const showcaseFoods = ownFoods.length >= 3 ? ownFoods : [...ownFoods, ...fallbackFoods];
  const speciality = drySnackDistrict && !/^No verified/i.test(drySnackDistrict.districtLinkedSpeciality) ? drySnackDistrict.districtLinkedSpeciality : null;
  const placeCount = (biharTouristPlaces[districtSlug] ?? []).length;

  return <div className="district-page-premium">
    <DistrictMotion />
    <header className="district-hero-premium"><div className="wrap">
      <Link href={`/explore-india/${regionSlug}`} className="region-back-link">← Back to {region}</Link>
      <div className="district-hero-layout"><div className="district-hero-copy">
        <div className="eyebrow">DISTRICT FOOD ATLAS · {region.toUpperCase()}</div><h1>{districtName}</h1>
        <p className="section-intro district-guide-intro">{district?.introduction ?? `Discover the traditional vegetarian food culture, local flavours, food-making traditions and notable places of ${districtName}.`}</p>
        <div className="district-hero-bottom"><span>VEGETARIAN FOOD DISCOVERY</span><span>ONE DISTRICT · ITS MANY FLAVOURS</span></div>
      </div><DistrictHeroArt district={districtName} foods={showcaseFoods} /></div>
    </div></header>
    <main className="wrap district-main-content">
      <nav className="district-section-nav" aria-label={`${districtName} page sections`}>
        <a href="#traditional-foods">Traditional Foods</a><a href="#food-stories">Food Stories</a><a href="#district-places">Famous Places</a><a href="#district-gallery">District Gallery</a><a href="#district-about">About {districtName}</a>
      </nav>
      {district?.heritage_note && <section className="district-heritage-note"><div className="eyebrow">FOOD HERITAGE &amp; TRADITIONS</div><p>{district.heritage_note}</p></section>}
      {region === 'Bihar' && <DistrictSpotlight district={districtName} foods={showcaseFoods} foodCount={Math.max(drySnackDistrict?.snacks.length ?? 0, researchLeads.length)} placeCount={placeCount} speciality={speciality} />}
      {drySnackDistrict && <BiharDistrictFoodTrails district={drySnackDistrict} />}
      {associations.length > 0 && <section className="district-approved-catalogue"><div className="eyebrow">RASVANI APPROVED CATALOGUE</div><h2>Available approved products</h2><DistrictFoodDiscovery districtName={districtName} foods={associations.flatMap((item) => item.products ? [{ id: item.id, name: item.products.name, slug: item.products.slug, description: item.products.description, ingredients: item.products.ingredients, category: item.products.categories?.name ?? null, image: productImages.get(item.products.id), associationType: item.association_type, relationshipNote: item.relationship_note }] : [])} /></section>}
      {associations.length === 0 && <section className="district-curation-empty district-curation-empty-premium"><div className="district-empty-art" aria-hidden="true"><span>✳</span><i/></div><div><div className="eyebrow">DISTRICT RESEARCH &amp; CURATION</div><h3>{districtName}’s approved food collection is being prepared.</h3><p>This district page is part of Rasvani’s Bihar food atlas. We publish food cards only after checking the dish name, vegetarian recipe, district relationship, ingredients, cultural context and supporting evidence. A dish will not be described as originating exclusively here unless the evidence supports that claim.</p><div className="district-research-status"><span><b>0</b> approved food records currently published</span><span><b>{researchLeads.length}</b> official-source research {researchLeads.length === 1 ? 'lead' : 'leads'} identified</span><span><b>Illustrative</b> artwork supplied · editorial verification pending</span></div>
        {researchLeads.length > 0 && <div className="district-research-leads"><h4>Research leads · not yet approved for publication</h4>{researchLeads.map((lead) => <article className="district-research-lead" key={`${lead.place}-${lead.name}`}><div><span className="district-lead-status">EDITORIAL REVIEW PENDING</span><h5>{lead.name}</h5><p className="district-lead-place">Place named in source: {lead.place}</p><p>{lead.evidenceNote}</p><p><strong>Ingredients noted by source:</strong> {lead.ingredients.join(', ')}</p><p>{lead.reviewNote}</p><a href={lead.sourceUrl} target="_blank" rel="noreferrer">{lead.sourceLabel} ↗</a></div><div className="district-lead-image"><Image src={lead.image} alt={lead.imageAlt} fill sizes="(max-width: 640px) 100vw, 150px"/><span>Illustrative visual · not product photography</span></div></article>)}</div>}
        <p className="district-image-policy">Illustrative artwork helps visitors recognise each research lead, but it is not an actual producer or pack photograph and does not establish district origin. Add to Cart will appear only when an approved, in-stock Rasvani product is linked to the food record.</p><Link href="/regional-review" className="text-link">Editorial review workspace ↗</Link></div></section>}
      <section className="district-editorial-sections" aria-label={`${districtName} food and place stories`}>
        <DistrictTaste district={districtName} foods={showcaseFoods} speciality={speciality} />
        <BiharTouristPlacesSection districtSlug={districtSlug} districtName={districtName} />
        <DistrictGallery district={districtName} foods={showcaseFoods} />
        <DistrictAbout district={districtName} otherDistrictsHref={`/explore-india/${regionSlug}`} />
      </section>
      {region === 'Bihar' && <BiharDistrictSwitcher activeDistrict={districtName} />}
      <p className="notice district-association-disclaimer">Regional relationship labels describe the specific association approved for publication. This relationship does not imply exclusive origin; a food may be associated with multiple places. Not every product is available to buy.</p>
      <div className="district-bottom-nav"><Link className="btn" href={`/explore-india/${regionSlug}`}>Back to {region} districts</Link><Link className="text-link" href="/india-map">Explore another region ↗</Link></div>
    </main>
  </div>;
}
