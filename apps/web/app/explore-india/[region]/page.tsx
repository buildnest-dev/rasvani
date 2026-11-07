import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { regions } from '@/lib/regions';
import { biharDistricts, slugifyDistrict } from '@/lib/bihar-districts';
import { biharHomeFoodItems } from '@/lib/bihar-home-food-items';
import { BiharDistrictMap } from '@/components/bihar-district-map';

const slugFor = (name: string) => name.toLowerCase().replaceAll(' ', '-');
const heroImages: Record<string, string> = {
  Bihar: '/images/bihar-food.jpg',
  Rajasthan: '/images/rajasthan-food.jpg',
  'West Bengal': '/images/bengal-food.jpg',
  'Tamil Nadu': '/images/tamil-food.jpg',
};
const fallbackHero = '/images/rasvani-editorial-vegetarian-feast.webp';

export function generateStaticParams() { return regions.map((region) => ({ region: slugFor(region) })); }
export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const slug = (await params).region;
  const region = regions.find((r) => slugFor(r) === slug);
  if (!region) return { title: 'Region not found' };
  return {
    title: `${region} | Explore India`,
    description: region === 'Bihar'
      ? 'Bihar districts, traditional vegetarian foods and home-made food you can order today.'
      : `${region} is coming soon to Rasvani. Bihar is live today.`,
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const slug = (await params).region;
  const region = regions.find((r) => slugFor(r) === slug);
  if (!region) notFound();
  const isBihar = region === 'Bihar';
  const foods = biharHomeFoodItems.filter((item) => item.image).slice(0, isBihar ? 12 : 6);
  const hero = heroImages[region] ?? fallbackHero;

  return <div className="rg-page">
    <header className="rg-hero">
      <Image src={hero} alt="" fill priority sizes="100vw" className="rg-hero-img" />
      <div className="rg-hero-shade" aria-hidden="true" />
      <div className="wrap rg-hero-copy">
        <Link href="/explore-india" className="rg-back">← All regions</Link>
        <span className={`rg-badge ${isBihar ? 'is-live' : ''}`}>{isBihar ? 'Live in Bihar today' : 'Coming soon'}</span>
        <h1>{region}</h1>
        <p>{isBihar
          ? 'Traditional vegetarian foods, made by home bakers and local kitchens, with all 38 districts to explore.'
          : `Rasvani starts in Bihar. We have not opened ${region} yet, so there are no orders here for now.`}</p>
        <div className="cta-row">
          {isBihar ? <><Link className="btn" href="/bihar#order-now">Order Bihar foods</Link><a className="btn secondary rg-light" href="#districts">Explore districts</a></>
            : <><Link className="btn" href="/bihar">See what is live in Bihar</Link><Link className="btn secondary rg-light" href="/for-producers">Cook in {region}? Talk to us</Link></>}
        </div>
      </div>
    </header>

    <main className="wrap rg-main">
      {isBihar && <section className="rg-block" id="districts" aria-labelledby="rg-districts">
        <div className="eyebrow">THE DISTRICT INDEX</div>
        <h2 id="rg-districts">Discover Bihar, district by district.</h2>
        <BiharDistrictMap />
        <ul className="rg-district-list">{biharDistricts.map((name) => <li key={name}><Link href={`/explore-india/bihar/district/${encodeURIComponent(slugifyDistrict(name))}`}>{name}<span aria-hidden="true">↗</span></Link></li>)}</ul>
      </section>}

      {!isBihar && <section className="rg-steps" aria-label="How Rasvani opens a new state">
        <article><b>1</b><h3>Bihar first</h3><p>Rasvani is live in Bihar, with home bakers and local kitchens.</p></article>
        <article><b>2</b><h3>Bakers join</h3><p>We open a state only after local home bakers and kitchens are on board.</p></article>
        <article><b>3</b><h3>Then {region}</h3><p>When {region} opens you will see its foods and districts here.</p></article>
      </section>}

      <section className="rg-block" aria-labelledby="rg-foods">
        <div className="eyebrow">{isBihar ? 'FAMOUS FOODS OF BIHAR' : 'WHILE YOU WAIT'}</div>
        <h2 id="rg-foods">{isBihar ? 'Foods you can look for.' : 'Taste Bihar today.'}</h2>
        <div className="rg-foods">{foods.map((food) => <Link key={food.id} href={food.href} className="rg-food">
          <span className="rg-food-img"><Image src={food.image} alt={food.imageAlt} fill sizes="(max-width: 700px) 45vw, 22vw" /></span>
          <strong>{food.name}</strong><small>{food.category}</small>
        </Link>)}</div>
      </section>

      <div className="rg-actions"><Link href="/india-map" className="btn secondary">Open the India map</Link><Link href="/shop" className="text-link">Browse the shop →</Link></div>
    </main>
  </div>;
}
