import Link from 'next/link';
import { biharTouristPlaces } from '@/lib/bihar-tourist-places';

const sourceUrl = 'https://tourism.bihar.gov.in/en/destinations';
const symbols: Record<string,string> = { 'Historical & heritage':'✧', 'Religious & cultural':'ॐ', 'Nature & wildlife':'❋' };

export function BiharTouristPlacesSection({ districtSlug, districtName }: { districtSlug: string; districtName: string }) {
  const places = biharTouristPlaces[districtSlug] ?? [];
  if (!places.length) return null;
  return <section className="bihar-tourist-section" id="district-places" aria-labelledby="bihar-tourist-title">
    <div className="bihar-tourist-heading"><div><span className="eyebrow">EXPLORE THE DISTRICT · HERITAGE & LANDMARKS</span><h2 id="bihar-tourist-title">Famous places of {districtName}</h2><p>Discover notable heritage sites, cultural landmarks and natural destinations connected with this district.</p></div><span className="bihar-tourist-count">{places.length.toString().padStart(2,'0')}<small>PLACES</small></span></div>
    <div className="bihar-tourist-grid">{places.map((place,index) => <article className="bihar-tourist-card" key={place.name}>
      <div className="bihar-tourist-art" aria-hidden="true"><span>{symbols[place.kind]}</span><i>{String(index+1).padStart(2,'0')}</i></div>
      <div className="bihar-tourist-copy"><span className="bihar-tourist-kind">{place.kind}</span><h3>{place.name}</h3><p>{place.note}</p></div>
    </article>)}</div>
    <div className="bihar-tourist-footer"><span>Editorial destination shortlist · confirm access, opening hours and local details before travel.</span><Link href={sourceUrl} target="_blank" rel="noreferrer">Explore Bihar Tourism destinations ↗</Link></div>
  </section>;
}
