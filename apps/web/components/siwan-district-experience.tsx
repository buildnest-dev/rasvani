'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SiwanFood3DStage } from '@/components/siwan-food-3d-stage';
import { siwanFoods as foods, officialSource, type SiwanFood } from '@/lib/siwan-foods';
import { biharDrySnackByDistrict } from '@/lib/bihar-dry-snacks';


type CategoryName = 'All Foods' | 'Meals & Savoury' | 'Snacks & Staples' | 'Sweets';
const categories: { name: CategoryName; count: number; icon: 'all' | 'meal' | 'snack' | 'drink' | 'sweet'; note: string }[] = [
  { name: 'All Foods', count: foods.length, icon: 'all', note: 'Explore every collection' },
  { name: 'Meals & Savoury', count: foods.filter((food) => food.category === 'Meals & Savoury').length, icon: 'meal', note: 'Documented regional dishes' },
  { name: 'Snacks & Staples', count: foods.filter((food) => food.category === 'Snacks & Staples').length, icon: 'snack', note: 'Crisp snacks and pantry staples' },
  { name: 'Sweets', count: foods.filter((food) => food.category === 'Sweets').length, icon: 'sweet', note: 'Traditional sweet-shop favourites' },
];

function CategoryMark({ kind }: { kind: (typeof categories)[number]['icon'] }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.65, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <svg viewBox="0 0 64 64" aria-hidden="true" {...common}>
    {kind === 'all' && <><path d="M10 27h44c-2 16-10 24-22 24S12 43 10 27Z"/><path d="M7 24c7-8 15-11 25-11s18 3 25 11"/><path d="M20 33h24M25 40h14"/><path d="M32 5v6"/></>}
    {kind === 'meal' && <><path d="M8 31c0 13 10 23 24 23s24-10 24-23H8Z"/><path d="M14 25c4-8 10-12 18-12s14 4 18 12"/><path d="M20 29c2-5 6-8 12-8s10 3 12 8"/><path d="M32 6v7"/></>}
    {kind === 'snack' && <><path d="M11 38c0-10 9-18 21-18s21 8 21 18v7H11v-7Z"/><path d="M18 20l-3-6m16 4V9m16 11 4-6"/><path d="M18 45v6m28-6v6M23 31l5 4m8-5 5 4"/></>}
    {kind === 'drink' && <><path d="M18 12h28l-3 39H21l-3-39Z"/><path d="M20 23h24M25 31c5 4 9 4 14 0"/><path d="M37 12c0-6 5-7 8-10M28 8l-4-5"/><path d="M26 39h12"/></>}
    {kind === 'sweet' && <><path d="M32 7 54 29 32 54 10 29 32 7Z"/><path d="m21 29 11-11 11 11-11 13-11-13Z"/><path d="M32 3v7M7 29h7m36 0h7M32 54v7"/><circle cx="32" cy="29" r="4"/></>}
  </svg>;
}

export function SiwanDistrictExperience() {
  const siwanDrySnacks = biharDrySnackByDistrict.siwan?.snacks ?? [];
  const stageFoods = [
    ...foods.map(({ name, category, image, imageAlt }) => ({ name, category, image, imageAlt })),
    ...siwanDrySnacks.map((item) => ({ name: item.name, category: item.basis === 'district-linked' ? 'District-linked candidate' : 'Bihar-wide fallback', image: item.image, imageAlt: item.imageAlt })),
  ];
  const [category, setCategory] = useState<CategoryName>('All Foods');
  const [query, setQuery] = useState('');
  const visible = useMemo(() => foods.filter((food) => (category === 'All Foods' || food.category === category) && `${food.name} ${food.description} ${food.ingredients}`.toLowerCase().includes(query.trim().toLowerCase())), [category, query]);

  return <LocalizedCopy><>
    <section className="siwan-home-hero" aria-label="Siwan district introduction">
      <div className="siwan-home-copy"><span className="siwan-kicker">SIWAN · DISTRICT FOOD ATLAS</span><h1>Siwan</h1><h2>Tradition lives in every flavour.</h2><p>A district-led collection of Siwan’s own food traditions, local makers and cultural landmarks. Every district will have its own distinct collection.</p><div className="siwan-hero-facts"><span>Local food traditions</span><span>Bhojpuri heritage</span><span>Curated discovery</span></div><div className="siwan-hero-actions"><a className="siwan-hero-cta" href="#siwan-foods">Explore Siwan Foods <span aria-hidden="true">↗</span></a><Link className="siwan-map-cta" href="/india-map">Explore the India map <span aria-hidden="true">↗</span></Link></div></div>
      <div className="siwan-home-food-art" aria-label="A visual introduction to Siwan food">
        <SiwanFood3DStage items={stageFoods} eyebrow="SIWAN · FLAVOUR TRAILS" title="Traditions in motion" ariaLabel="Interactive three-dimensional Siwan food showcase with the original collection and dry-snack research list" />
      </div>
    </section>



    <nav className="siwan-section-nav" aria-label="Siwan page sections"><a href="#siwan-foods" className="active">All Foods</a><a href="#siwan-producers">Local Producers</a><a href="#siwan-stories">Food Stories &amp; Vlogs</a><a href="#siwan-about">About Siwan</a></nav>

    <section id="siwan-foods" className="siwan-food-section">
      <div className="siwan-section-heading"><div><span className="siwan-kicker">THE LOCAL TABLE</span><h2>Explore Siwan’s Food Collections</h2><p>Choose a collection to explore food traditions documented in Siwan and local sweet-shop coverage. Choose a category or search by name.</p></div><div className="siwan-food-total"><strong>{foods.length}</strong><span>curated food<br/>entries</span></div></div>

      <div className="siwan-category-logos" aria-label="Siwan food categories">
        {categories.map((item) => <button key={item.name} type="button" className={`siwan-category-logo ${category === item.name ? 'selected' : ''}`} onClick={() => setCategory(item.name)} aria-pressed={category === item.name}>
          <span className="siwan-category-logo-mark"><CategoryMark kind={item.icon}/></span><span className="siwan-category-logo-copy"><b>{item.name}</b><small>{item.note}</small></span><span className="siwan-category-logo-count">{item.count}</span>
        </button>)}
      </div>

      <div className="siwan-food-tools"><label className="siwan-food-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search foods, snacks & sweets from Siwan…" aria-label="Search foods, snacks and sweets from Siwan"/></label><span className="siwan-results-count">Showing {visible.length} of {foods.length} foods</span></div>

      {visible.length > 0 ? <div className="siwan-food-grid">{visible.map((food, index) => <article className="siwan-food-tile" key={food.name} style={{ '--tile-index': index } as React.CSSProperties}>
        <div className={`siwan-food-art siwan-food-art-${food.name.toLowerCase().replaceAll(' ', '-')}`} data-motion-tilt="true">
          {food.image ? <img src={food.image} alt={food.imageAlt} loading={index < 2 ? 'eager' : 'lazy'} /> : <div className="siwan-food-image-pending"><span>PHOTO PENDING</span><strong>{food.name}</strong><small>Exact dish image will be added after producer verification.</small></div>}
          <span className="siwan-food-art-label">{food.category}</span>
          <span className="siwan-food-art-title">{food.name}</span>
          <span className="siwan-food-art-shimmer" aria-hidden="true"/>
          <span className="siwan-food-art-index">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="siwan-food-tile-copy"><span className={food.status === 'district-source' ? 'siwan-proof district' : 'siwan-proof regional'}>{food.status === 'district-source' ? 'SIWAN DISTRICT SOURCE' : 'LOCAL SWEET-SHOP COVERAGE'}</span><h3>{food.name}</h3><p>{food.description}</p><p className="siwan-ingredients"><b>Ingredients:</b> {food.ingredients}</p><p className="siwan-relation">{food.relation}</p><p className="siwan-art-note">{food.visualNote}</p><a className="siwan-source-link" href={food.sourceUrl} target="_blank" rel="noreferrer">Source: {food.source} ↗</a><div className="siwan-card-actions"><Link href="/shop?region=bihar&district=siwan">Check Siwan product availability ↗</Link></div></div>
      </article>)}</div> : <div className="siwan-no-results"><span aria-hidden="true">✳</span><h3>No matching foods found</h3><p>Try another English food name or choose a different collection.</p><button type="button" onClick={() => { setQuery(''); setCategory('All Foods'); }}>Show all foods</button></div>}

      <p className="siwan-research-note">Food visuals are illustrative artwork, not actual producer product photographs. Official district references and local sweet-shop mentions are labelled separately; neither implies exclusive origin. Traditional dishes shown for discovery are not automatically shelf-stable or available to buy. Every saleable item needs producer approval, compliant labelling, packaging validation and shelf-life testing before dispatch.</p>
    </section>

    <section className="siwan-food-section siwan-dry-snack-section" aria-labelledby="siwan-dry-snacks-heading">
      <div className="siwan-section-heading"><div><span className="siwan-kicker">RASVANI RESEARCH LIST · DRY VEGETARIAN SNACKS</span><h2 id="siwan-dry-snacks-heading">Traditional dry snacks listed for Siwan</h2><p>These are Bihar-wide fallback entries in the supplied district research list, not claims that the snacks originated exclusively in Siwan.</p></div><div className="siwan-food-total"><strong>{siwanDrySnacks.length}</strong><span>research<br/>entries</span></div></div>
      <div className="siwan-food-grid">{siwanDrySnacks.map((item, index) => <article className="siwan-food-tile siwan-dry-snack-tile" key={`${item.slug}-${index}`}>
        <div className="siwan-food-art"><img src={item.image} alt={item.imageAlt} loading="lazy"/><span className="siwan-food-art-label">{item.basis === 'district-linked' ? 'DISTRICT-LINKED CANDIDATE' : 'BIHAR-WIDE FALLBACK'}</span><span className="siwan-food-art-title">{item.name}</span></div>
        <div className="siwan-food-tile-copy"><span className={item.basis === 'district-linked' ? 'siwan-proof district' : 'siwan-proof regional'}>{item.basis === 'district-linked' ? 'DISTRICT-LINKED CANDIDATE' : 'BIHAR-WIDE FALLBACK'}</span><h3>{item.name}</h3><p>Candidate vegetarian dry-snack entry from the supplied Rasvani district research list.</p>{item.caution && <p className="siwan-art-note">{item.caution}</p>}<div className="siwan-card-actions"><Link href={`/food-stories?district=Siwan&food=${encodeURIComponent(item.name)}`}>Food Stories &amp; Vlogs ↗</Link></div></div>
      </article>)}</div>
      <p className="siwan-research-note">A “7 days or more” shelf-life claim is not guaranteed by the food name. It may be shown only after exact recipe, producer, batch and sealed-pack validation.</p>
    </section>

    <section id="siwan-producers" className="siwan-info-panel"><span className="siwan-kicker">MEET THE MAKERS</span><h2>Local Producers</h2><p>Rasvani will feature only verified and approved producers. Producer profiles and sellable products will appear here after onboarding and quality review.</p><Link href="/for-producers">Become a producer partner ↗</Link></section>
    <section id="siwan-stories" className="siwan-info-panel siwan-story-panel"><span className="siwan-kicker">FROM THE LOCAL KITCHEN</span><h2>Food Stories &amp; Vlogs</h2><p>Explore stories about Bhojpuri food culture, everyday home cooking, seasonal ingredients, Chhath traditions and the people who preserve local recipes.</p><Link href="/food-stories">Explore Rasvani food stories ↗</Link></section>
    <section id="siwan-about" className="siwan-info-panel siwan-about-panel"><span className="siwan-kicker">KNOW THE DISTRICT</span><h2>About Siwan</h2><p>Siwan lies in western Bihar and is closely connected with Bhojpuri language and culture. The official district culture page names Litti Chokha, Kadhi, Jhal Muri and Sattu among foods popular in Siwan.</p><p>Siwan is also known as the birthplace of Dr. Rajendra Prasad, India’s first President.</p><a href={officialSource} target="_blank" rel="noreferrer">Official Siwan culture &amp; heritage ↗</a></section>
  </></LocalizedCopy>;
}
