'use client';
import { LocalizedCopy } from '@/components/localized-copy';
import { SiwanFood3DStage } from '@/components/siwan-food-3d-stage';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/components/locale-provider';
import { useMemo, useState } from 'react';
import { biharHomeFoodItems } from '@/lib/bihar-home-food-items';

const featured = [
  { id: '01', title: 'The savoury table', eyebrow: 'CRISP · SPICED · HAND-FINISHED', copy: 'Crisp textures, roasted spices and lively accompaniments from the vegetarian pantry.', image: '/images/rasvani-editorial-snack-feast.webp', alt: 'A selection of Indian vegetarian savoury foods', motion: 'food-float-a', href: '/shop' },
  { id: '02', title: 'Sweet traditions', eyebrow: 'SLOW-MADE · FESTIVE · SHARED', copy: 'A closer look at celebratory sweets, shared rituals and the pleasure of a thoughtful finish.', image: '/images/rasvani-editorial-sweets-brass.webp', alt: 'A selection of Indian vegetarian sweets', motion: 'food-float-b', href: '/food-stories' },
  { id: '03', title: 'The everyday pantry', eyebrow: 'GRAINS · PULSES · SPICES', copy: 'Grains, pulses and spices that bring depth, balance and character to everyday cooking.', image: '/images/rasvani-editorial-spice-pantry.webp', alt: 'Indian grains, pulses, spices and fresh ingredients', motion: 'food-float-c', href: '/better-choices' },
];

const homeFoodFilters = [
  { value: 'all', label: 'All food items' },
  { value: 'dry-snacks', label: 'Vegetarian dry snacks · PDF list' },
  { value: 'siwan', label: 'Foods already in Siwan collection' },
  { value: 'research', label: 'Existing research leads' },
] as const;

type HomeFoodFilter = (typeof homeFoodFilters)[number]['value'];

type HomeHeroStageItem = { name: string; category: string; image: string; imageAlt: string };
const homeHeroStageItems: HomeHeroStageItem[] = ['Thekua', 'Silao Khaja', 'Tilkut', 'Sattu Ladoo', 'Roasted Makhana']
  .map((name) => {
    const food = biharHomeFoodItems.find((item) => item.name === name || item.aliases.includes(name));
    return food ? {
      name: food.name,
      category: food.associations[0]?.label ?? 'Bihar tradition',
      image: food.image,
      imageAlt: food.imageAlt,
    } : null;
  })
  .filter((item): item is HomeHeroStageItem => item !== null);

export function HomeExperience() {
  const { locale, t } = useLocale();
  const [foodQuery, setFoodQuery] = useState('');
  const [foodFilter, setFoodFilter] = useState<HomeFoodFilter>('all');
  const visibleHomeFoodItems = useMemo(() => {
    const query = foodQuery.trim().toLocaleLowerCase();
    return biharHomeFoodItems.filter((item) => {
      const searchable = [item.name, item.category, item.description, ...item.aliases, ...item.associations.map((association) => association.label), ...item.notes].join(' ').toLocaleLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesFilter = foodFilter === 'all'
        || (foodFilter === 'dry-snacks' && item.isPdfDrySnack)
        || (foodFilter === 'siwan' && item.isOriginalSiwanFood)
        || (foodFilter === 'research' && item.isResearchLead);
      return matchesQuery && matchesFilter;
    });
  }, [foodQuery, foodFilter]);
  return <LocalizedCopy><div className="home-premium home-living-pantry">
    <div className="home-search-band">
      <div className="wrap home-search-inner">
        <div className="search-band-copy"><span className="search-kicker">{t('searchIndia')}</span><span className="search-caption">{t('searchHint')}</span></div>
        <form action="/explore-india" method="get" role="search" className="home-search-form">
          <label className="sr-only" htmlFor="home-food-search">{t('searchPlaceholder')}</label>
          <span aria-hidden="true" className="search-symbol">⌕</span>
          <input id="home-food-search" type="search" name="q" minLength={2} maxLength={80} placeholder={t('searchPlaceholder')} autoComplete="off" />
          <button type="submit">{t('search')} <span aria-hidden="true">↗</span></button>
        </form>
        <span className="search-band-note">12 LANGUAGE OPTIONS · ONE REGIONAL PANTRY</span>
      </div>
    </div>

    <section className="home-hero home-hero-living" aria-labelledby="home-title">
      <div className="home-hero-texture" aria-hidden="true" />
      <div className="wrap home-hero-grid">
        <div className="home-hero-copy">
          <div className="eyebrow"><span className="eyebrow-sun">✳</span> {t('heroEyebrow')} · RASVANI</div>
          <p className="hero-overline">{locale === 'en' ? 'INDIA IS MORE THAN A PLACE · IT IS A THOUSAND FLAVOURS OF HOME' : t('heroEyebrow')}</p>
          <h1 id="home-title">{t('heroTitle')}</h1>
          {locale === 'en' ? <>
            <p className="home-hero-lead">Every region of India has a taste worth remembering: a traditional recipe, a familiar aroma, a special sweet or a homemade delicacy that brings back memories of home.</p>
            <p className="home-hero-story">When life takes you far from the place where your favourite food belongs, Rasvani brings India’s regional food traditions closer. Discover traditional vegetarian foods from states and districts, explore the stories behind them, and order approved regional favourites wherever service is available across India.</p>
            <p className="home-hero-signoff">A taste of your hometown, even when you’re miles away.</p>
          </> : <p className="home-hero-lead">{t('heroLead')}</p>}
          <div className="hero-actions">
            <Link className="btn btn-ornament" href="/india-map">{t('discoverMap')} <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href="/shop">{t('shopCollection')} <span aria-hidden="true">→</span></Link>
          </div>
          <div className="hero-signature"><span className="signature-line"/><span>ROOTED IN PLACE · OPEN TO INDIA</span></div>
          <div className="hero-trust-row"><span><b>36</b> regions</span><i/><span><b>12</b> language options</span><i/><span><b>100%</b> vegetarian discovery</span></div>
        </div>
        <div className="home-hero-image-wrap home-orbit-stage home-hero-cinematic-stage" aria-label="A cinematic, interactive three-dimensional showcase of traditional Bihar foods">
          <div className="home-hero-cinematic-map" aria-hidden="true"><span>INDIA</span><i/><b/></div>
          <div className="home-hero-light-rings" aria-hidden="true"><i/><i/><i/></div>
          <div className="home-hero-cinematic-grain" aria-hidden="true"/>
          <SiwanFood3DStage
            items={homeHeroStageItems}
            eyebrow="HOME OF FLAVOURS · BIHAR FIRST"
            title="A thousand flavours of home"
            ariaLabel="Interactive cinematic three-dimensional carousel of Thekua, Silao Khaja, Tilkut, Sattu Ladoo and Roasted Makhana. Drag to rotate or use the arrow keys."
            variant="cinematic"
          />
          <div className="home-hero-stage-caption"><span>RASVANI · FIELD NOTES 01</span><b>Discover by flavour.<br/>Arrive by region.</b></div>
        </div>
      </div>
      <div className="hero-footnote wrap"><span>RASVANI FIELD NOTES · VOL. 01</span><span>INDIA, SERVED BY REGION.</span><span>SCROLL TO DISCOVER ↓</span></div>
    </section>

    <section className="home-section home-featured-section" aria-labelledby="featured-heading">
      <div className="wrap">
        <div className="section-heading-premium"><div><div className="eyebrow">02 / {t('featuredEyebrow')}</div><h2 id="featured-heading">{t('featuredTitle')}</h2></div><p>Food is more than a dish. It is the craft, memory and place carried from one table to another.</p></div>
        <div className="featured-orbit-grid">{featured.map((item) => <article className={`featured-orbit-card ${item.motion}`} key={item.id}>
          <Link href={item.href} className="featured-image-orbit" aria-label={`Explore ${item.title}`}>
            <span className="featured-image-ring"/><Image src={item.image} alt={item.alt} fill sizes="(max-width: 700px) 85vw, 30vw"/>
            <span className="featured-image-index">{item.id}</span><span className="featured-image-arrow">↗</span>
          </Link>
          <div className="featured-orbit-copy"><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.copy}</p><Link href={item.href}>Explore collection <span aria-hidden="true">↗</span></Link></div>
        </article>)}</div>
      </div>
    </section>

    <section className="home-section home-food-atlas-section" aria-labelledby="bihar-food-atlas-heading">
      <div className="wrap">
        <div className="section-heading-premium home-food-atlas-heading">
          <div><div className="eyebrow">03 / THE RASVANI FOOD ATLAS</div><h2 id="bihar-food-atlas-heading">Start with the food. Discover the place.</h2></div>
          <p>Browse the foods themselves first. Each item shows its relevant district associations, source status and research notes; use the India map when you want to explore by place.</p>
        </div>
        <div className="home-food-atlas-tools">
          <label className="home-food-atlas-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search food items and associated places</span><input type="search" value={foodQuery} onChange={(event) => setFoodQuery(event.target.value)} placeholder="Search a food item, snack or associated place…" /></label>
          <label className="home-food-atlas-filter"><span className="sr-only">Filter food collection</span><select value={foodFilter} onChange={(event) => setFoodFilter(event.target.value as HomeFoodFilter)}>{homeFoodFilters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}</select></label>
          <span className="home-food-atlas-count">{visibleHomeFoodItems.length} food items</span>
        </div>
        {visibleHomeFoodItems.length > 0 ? <div className="home-food-item-grid">
          {visibleHomeFoodItems.map((item, index) => {
            const previewAssociations = item.associations.slice(0, 3);
            const extraAssociations = Math.max(0, item.associations.length - previewAssociations.length);
            return <article className="home-food-item-card" key={item.id}>
              <Link className="home-food-item-image" href={item.href} aria-label={`Explore ${item.name} and its regional context`}>
                <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 650px) 88vw, (max-width: 1100px) 42vw, 24vw" />
                <span className="home-food-item-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="home-food-item-category">{item.category}</span>
              </Link>
              <div className="home-food-item-copy">
                <h3><Link href={item.href}>{item.name}</Link></h3>
                {item.aliases.length > 0 && <p className="home-food-item-alias"><span>Also listed as:</span> {item.aliases.join(' · ')}</p>}
                <p className="home-food-item-description">{item.description}</p>
                <div className="home-food-item-statuses">
                  {item.isPdfDrySnack && <span className="home-food-status source">PDF dry-snack list</span>}
                  {item.labels.includes('district-linked-candidate') && <span className="home-food-status linked">District-linked candidate</span>}
                  {item.labels.includes('bihar-wide-fallback') && <span className="home-food-status fallback">Bihar-wide fallback</span>}
                  {item.isOriginalSiwanFood && <span className="home-food-status existing">Original Siwan collection</span>}
                  {item.isResearchLead && <span className="home-food-status pending">Research review pending</span>}
                </div>
                {previewAssociations.length > 0 && <div className="home-food-item-places"><small>PLACE ASSOCIATIONS</small><p>{previewAssociations.map((association) => association.label).join(' · ')}{extraAssociations > 0 ? ` · +${extraAssociations} more` : ''}</p></div>}
                {item.notes.length > 0 && <p className="home-food-item-note">{item.notes[0]}</p>}
                <Link className="home-food-item-link" href={item.href}>Explore food context <span aria-hidden="true">↗</span></Link>
              </div>
            </article>;
          })}
        </div> : <div className="home-food-atlas-empty"><strong>No matching food items.</strong><span>Try another food name, spelling or associated place.</span></div>}
        <div className="home-food-atlas-source-note">
          <p><strong>Item-first discovery:</strong> Food names and images are the primary way to browse this collection. District names are supporting context, not the main catalogue cards.</p>
          <p><strong>Research accuracy:</strong> The 38-district dry-snack entries follow the supplied Rasvani research PDF (DOC-20261105-WA0005.pdf). Where a district-specific dry snack was not confirmed, Bihar-wide foods remain labelled as fallback options rather than district-origin claims. Existing Siwan foods and the six original research leads are retained separately.</p>
          <p><strong>Food and shelf-life limits:</strong> The PDF&apos;s dry-snack list excludes fresh fruit, wet chutneys, cooked curries, curd-based foods and other moist dishes. The original Siwan foods and pending research leads remain visible as discovery content but are not implied to be shelf-stable or sale-ready. A “7 days or more” claim may be shown only after documented shelf-life validation for the exact producer batch and sealed pack.</p>
          <small>All AI-generated thumbnails are illustrative artwork, not actual producer or pack photographs. Ingredients, allergens, district association, producer approval and sale availability require separate verification.</small>
        </div>
        <div className="home-food-atlas-map-link"><div><span className="eyebrow">WANT TO BEGIN WITH A PLACE?</span><strong>Explore India on the interactive map.</strong><p>Choose a State or Union Territory, then continue to its district guides and food collections.</p></div><Link className="btn btn-ornament" href="/india-map">Explore India map <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>

    <section className="home-regional-story-section home-story-editorial">
      <div className="wrap regional-story-feature">
        <div className="regional-story-image story-photo-depth"><Image src="/images/rasvani-feast-hero.webp" alt="A richly arranged Indian vegetarian food spread with traditional serving dishes" fill sizes="(max-width: 760px) 100vw, 48vw"/><span className="story-image-caption">FIELD JOURNAL / 01</span></div>
        <div className="regional-story-copy"><div className="eyebrow">04 / REGIONAL FOOD STORIES</div><h2>{t('storiesTitle')}</h2><p>Follow ingredients, traditions, celebrations and the hands that keep food knowledge alive. Stories will be published with source review, rights and consent.</p><Link href="/food-stories" className="text-link">Enter the Rasvani journal ↗</Link><div className="story-index-line"><span>01</span><i/><span>PLACE · PEOPLE · PRACTICE</span></div></div>
      </div>
    </section>

    <section className="home-producer-section home-producer-luxe">
      <div className="wrap home-producer-grid">
        <div className="producer-image-composition producer-collage-depth">
          <div className="producer-image-main"><Image src="/images/rasvani-editorial-spice-pantry.webp" alt="Indian grains, pulses, spices and fresh ingredients arranged in brass vessels" fill sizes="(max-width: 760px) 100vw, 45vw"/></div>
          <div className="producer-image-inset"><Image src="/images/rasvani-editorial-snack-feast.webp" alt="A curated assortment of Indian vegetarian savoury snacks" fill sizes="140px"/></div>
          <div className="producer-seal"><span>PARTNERSHIP</span><strong>Built on<br/>trust & care</strong></div>
        </div>
        <div className="producer-section-copy"><div className="eyebrow">05 / MEET OUR PRODUCERS</div><h2>{t('producersTitle')}</h2><p>Rasvani is building a curated producer network. Businesses, facilities and products move through separate review and approval steps before anything is presented as an approved partnership.</p><Link className="btn btn-dark-green" href="/for-producers">Discover producer partnerships ↗</Link></div>
      </div>
    </section>

    <section className="home-better-section home-better-luxe">
      <div className="wrap better-choice-panel">
        <div><div className="eyebrow">06 / TRANSPARENCY BY DESIGN</div><h2>{t('betterChoicesTitle')}</h2><p>Clear ingredients, allergens, storage, batch traceability and carefully reviewed claims are part of the product experience—not an afterthought.</p><Link href="/better-choices" className="text-link text-link-light">Discover Better Choices <span aria-hidden="true">↗</span></Link></div>
        <div className="better-orbit" aria-hidden="true"><span>INGREDIENTS</span><span>TRACEABILITY</span><span>CLARITY</span><strong>BETTER<br/>CHOICES</strong></div>
      </div>
    </section>

    <section className="home-explore-section home-explore-last">
      <div className="wrap explore-india-feature">
        <div className="explore-feature-image explore-coin-depth"><Image src="/images/rasvani-feast-hero.webp" alt="A richly arranged Indian vegetarian food spread inviting regional discovery" fill sizes="(max-width: 760px) 100vw, 52vw"/><span className="explore-feature-seal">EXPLORE<br/>BY REGION</span></div>
        <div className="explore-feature-copy"><div className="eyebrow">07 / A SEPARATE DESTINATION</div><h2>{t('exploreTitle')}</h2><p>{t('exploreLead')}</p><ul><li>Browse States and Union Territories</li><li>Explore reviewed district guides</li><li>Read regional food heritage stories</li><li>Discover approved vegetarian products</li></ul><Link href="/explore-india" className="btn btn-ornament">{t('exploreButton')} <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>

    <div className="home-manifesto home-manifesto-luxe"><div className="wrap"><span>RASVANI</span><p>“The taste of a place lives in the stories it shares.”</p><small>INDIA, SERVED BY REGION.</small></div></div>
  </div></LocalizedCopy>;
}
