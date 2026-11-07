import Image from 'next/image';
import Link from 'next/link';
import { regions } from '@/lib/regions';
import { biharDistricts, slugifyDistrict } from '@/lib/bihar-districts';
import { biharHomeFoodItems } from '@/lib/bihar-home-food-items';

const regionSlug = (name: string) => name.toLowerCase().replaceAll(' ', '-');

/** Searches the built-in lists only (states, Bihar districts, Bihar foods). Nothing is sent to a database. */
export function RegionalSearchResults({ query }: { query: string }) {
  const term = query.trim().normalize('NFC').slice(0, 80);
  if (term.length < 2) return <p className="notice">Type at least two letters to search foods and places.</p>;
  const needle = term.toLocaleLowerCase();
  const matchedRegions = regions.filter((region) => region.toLocaleLowerCase().includes(needle));
  const matchedDistricts = biharDistricts.filter((name) => name.toLocaleLowerCase().includes(needle));
  const foods = biharHomeFoodItems.filter((item) =>
    [item.name, item.category, ...item.aliases].some((value) => value.toLocaleLowerCase().includes(needle))).slice(0, 24);
  const nothing = !matchedRegions.length && !matchedDistricts.length && !foods.length;

  return <section className="regional-search-results" aria-live="polite" aria-label="Search results">
    <div className="regional-search-heading"><div className="eyebrow">Search results</div><p>Matches for <strong>&ldquo;{term}&rdquo;</strong></p></div>
    {matchedRegions.length > 0 && <div className="regional-result-group"><h3>States and Union Territories</h3><div className="regional-result-chips">{matchedRegions.map((region) => <Link key={region} href={`/explore-india/${regionSlug(region)}`}>{region}<span aria-hidden="true"> →</span></Link>)}</div></div>}
    {matchedDistricts.length > 0 && <div className="regional-result-group"><h3>Bihar districts</h3><div className="regional-result-chips">{matchedDistricts.map((name) => <Link key={name} href={`/explore-india/bihar/district/${encodeURIComponent(slugifyDistrict(name))}`}>{name}<span aria-hidden="true"> →</span></Link>)}</div></div>}
    {foods.length > 0 && <div className="regional-result-group"><h3>Bihar foods</h3><div className="rg-foods">{foods.map((food) => <Link key={food.id} href={food.href} className="rg-food">
      <span className="rg-food-img"><Image src={food.image} alt={food.imageAlt} fill sizes="(max-width: 700px) 45vw, 22vw" /></span><strong>{food.name}</strong><small>{food.category}</small></Link>)}</div></div>}
    {nothing && <p className="shop-empty" role="status">Nothing matches this search yet. Try another spelling, a Bihar district or a food name like Thekua.</p>}
  </section>;
}
