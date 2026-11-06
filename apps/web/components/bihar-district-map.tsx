'use client';

import Link from 'next/link';
import { IndiaBoundaryMap } from '@/components/india-boundary-map';
import { biharDistricts, slugifyDistrict } from '@/lib/bihar-districts';

const bounds: [[number, number], [number, number]] = [[83.2, 24.2], [88.4, 27.6]];

export function BiharDistrictMap() {
  return <section className="bihar-map-feature" aria-labelledby="bihar-map-title">
    <div className="bihar-map-intro"><span className="eyebrow">EXPLORE THE LAND · 38 DISTRICTS</span><h2 id="bihar-map-title">A map of Bihar, one district at a time.</h2><p>Choose a district on the map or from the directory to open its Rasvani Flavour Trail.</p></div>
    <div className="bihar-map-layout">
      <div className="bihar-map-canvas"><div className="bihar-map-canvas-label"><span>BIHAR · DISTRICT BOUNDARIES</span><b>38 CLICKABLE DISTRICTS</b></div>
        <IndiaBoundaryMap level="districts" selectedState="Bihar" selectedBounds={bounds} fallbackItems={biharDistricts} onSelect={(name) => { const aliases: Record<string,string> = { 'Kaimur':'Kaimur (Bhabua)', 'Purba Champaran':'East Champaran', 'Pashchim Champaran':'West Champaran' }; const canonical = biharDistricts.find((d) => slugifyDistrict(d) === slugifyDistrict(name)) ?? aliases[name] ?? name; window.location.href = `/explore-india/bihar/district/${encodeURIComponent(slugifyDistrict(canonical))}`; }} />
      </div>
      <aside className="bihar-map-directory"><div className="eyebrow">THE DISTRICT INDEX</div><h3>Choose your destination</h3><div className="bihar-map-district-links">{biharDistricts.map((district, index) => <Link key={district} href={`/explore-india/bihar/district/${encodeURIComponent(slugifyDistrict(district))}`}><span>{String(index + 1).padStart(2,'0')}</span><strong>{district}</strong><i>↗</i></Link>)}</div></aside>
    </div>
    <p className="bihar-map-attribution">District boundary layer: Local Government Directory 2024 snapshot via Bharatlas. Administrative boundary data is a dated reference layer and should be reconciled with the latest official district register before legal or surveying use.</p>
  </section>;
}
