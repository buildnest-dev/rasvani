'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type Food = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ingredients?: string[] | null;
  category?: string | null;
  image?: string;
  associationType: string;
  relationshipNote: string | null;
};

const relationshipLabels: Record<string, string> = {
  origin_claim: 'Origin claim reviewed',
  produced_in: 'Produced in this district',
  traditionally_associated_with: 'Traditional association',
  popular_in: 'Popular in this district',
};

export function DistrictFoodDiscovery({ foods, districtName }: { foods: Food[]; districtName: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All foods');
  const categories = useMemo(() => ['All foods', ...Array.from(new Set(foods.map((food) => food.category).filter((value): value is string => Boolean(value))))], [foods]);
  const visibleFoods = useMemo(() => foods.filter((food) => {
    const matchesQuery = `${food.name} ${food.description ?? ''} ${(food.ingredients ?? []).join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === 'All foods' || food.category === category);
  }), [foods, query, category]);

  return <LocalizedCopy><section className="siwan-discovery" aria-label={`Traditional vegetarian foods of ${districtName}`}>
    <div className="siwan-discovery-toolbar">
      <label className="siwan-food-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search foods of ${districtName}...`} aria-label="Search district foods" /></label>
      <label className="siwan-food-category"><span className="sr-only">Food category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <span className="siwan-food-count">{visibleFoods.length} reviewed {visibleFoods.length === 1 ? 'record' : 'records'}</span>
    </div>

    {visibleFoods.length ? <div className="siwan-food-grid">
      {visibleFoods.map((food) => <article className="siwan-food-card" key={food.id}>
        <div className="siwan-food-image">
          {food.image ? <Image src={food.image} alt={`${food.name} — approved product photograph`} width={720} height={520} unoptimized /> : <div className="siwan-food-image-pending"><span aria-hidden="true">✳</span><small>Authentic dish photograph<br/>awaiting approval</small></div>}
          <span className="siwan-food-veg">✳ Vegetarian</span>
        </div>
        <div className="siwan-food-copy">
          <div className="siwan-food-kicker">{relationshipLabels[food.associationType] ?? 'Reviewed regional association'}</div>
          <h3><Link href={`/shop/${encodeURIComponent(food.slug)}`}>{food.name}</Link></h3>
          <p>{food.description || 'A verified public description is being prepared.'}</p>
          {food.ingredients?.length ? <p className="siwan-food-ingredients"><strong>Ingredients:</strong> {food.ingredients.join(', ')}</p> : <p className="siwan-food-ingredients"><strong>Ingredients:</strong> Awaiting verified product information</p>}
          {food.relationshipNote && <p className="siwan-food-story">{food.relationshipNote}</p>}
          <div className="siwan-food-actions">
            <Link className="siwan-food-details" href={`/shop/${encodeURIComponent(food.slug)}`}>Explore food <span aria-hidden="true">↗</span></Link>
            <button className="siwan-cart-unavailable" type="button" disabled title="Cart checkout is not enabled until an approved sellable SKU, current price and available warehouse stock are connected">Add to cart · Coming soon</button>
          </div>
        </div>
      </article>)}
    </div> : <div className="siwan-no-results"><span aria-hidden="true">⌕</span><h3>No matching reviewed foods</h3><p>Try another search or category. Unverified food names are intentionally not shown as confirmed district facts.</p></div>}
  </section></LocalizedCopy>;
}
