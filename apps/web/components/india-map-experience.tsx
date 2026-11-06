'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { IndiaBoundaryMap } from '@/components/india-boundary-map';
import { regions } from '@/lib/regions';
import { biharDistricts, slugifyDistrict } from '@/lib/bihar-districts';
import { useLocale } from '@/components/locale-provider';
import { biharDrySnackByDistrict } from '@/lib/bihar-dry-snacks';

type Step = 'regions' | 'districts' | 'foods';
const regionShort: Record<string, string> = {
  'Andaman and Nicobar Islands': 'Andaman & Nicobar', 'Dadra and Nagar Haveli and Daman and Diu': 'Dadra & Nagar Haveli and Daman & Diu',
};
const slugifyRegion = (name: string) => name.toLowerCase().normalize('NFC').replaceAll(' ', '-');
const regionAliases: Record<string, string> = {
  'nct of delhi': 'Delhi',
  'national capital territory of delhi': 'Delhi',
  'jammu & kashmir': 'Jammu and Kashmir',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
  'dadra & nagar haveli and daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
};
const biharDistrictAliases: Record<string, string> = {
  'kaimur': 'Kaimur (Bhabua)',
  'purba champaran': 'East Champaran',
  'purbi champaran': 'East Champaran',
  'pashchim champaran': 'West Champaran',
  'pashchimi champaran': 'West Champaran',
};
const canonicalBiharDistrict = (name: string) => {
  const normalized = name.trim().toLocaleLowerCase();
  return biharDistricts.find((district) => slugifyDistrict(district) === slugifyDistrict(name))
    ?? biharDistrictAliases[normalized]
    ?? name.trim();
};
const canonicalRegion = (name: string) => {
  const normalized = name.trim().toLocaleLowerCase();
  return regions.find((item) => item.toLocaleLowerCase() === normalized)
    ?? regionAliases[normalized]
    ?? name.trim();
};

export function IndiaMapExperience({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>('regions');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState<number | string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedBounds, setSelectedBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [mapDistrictNames, setMapDistrictNames] = useState<string[]>([]);
  const [districtSearch, setDistrictSearch] = useState('');
  const isBihar = selectedRegion === 'Bihar';
  const districtList = useMemo<string[]>(() => isBihar ? [...biharDistricts] : mapDistrictNames, [isBihar, mapDistrictNames]);
  const visibleDistrictList = useMemo(() => districtList.filter((district) => district.toLocaleLowerCase().includes(districtSearch.trim().toLocaleLowerCase())), [districtList, districtSearch]);
  const selectedDrySnackDistrict = isBihar && selectedDistrict ? biharDrySnackByDistrict[slugifyDistrict(selectedDistrict)] : undefined;

  const chooseRegion = useCallback((region: string, stateCode?: number | string | null, bounds?: [[number, number], [number, number]] | null) => {
    const canonical = canonicalRegion(region);
    setSelectedRegion(canonical);
    setSelectedStateCode(stateCode ?? null);
    setSelectedBounds(bounds ?? null);
    setSelectedDistrict(null);
    setMapDistrictNames([]);
    setDistrictSearch('');
    setHoveredRegion(canonical);
    setStep('districts');
  }, []);
  const chooseDistrict = useCallback((district: string) => {
    setSelectedDistrict(selectedRegion === 'Bihar' ? canonicalBiharDistrict(district) : district.trim());
    setStep('foods');
  }, [selectedRegion]);
  const chooseDistrictFromMap = useCallback((district: string) => chooseDistrict(district), [chooseDistrict]);
  function backToRegions() {
    setSelectedRegion(null); setSelectedDistrict(null); setSelectedStateCode(null); setSelectedBounds(null); setMapDistrictNames([]); setDistrictSearch(''); setHoveredRegion(null); setStep('regions');
  }
  function backToDistricts() { setSelectedDistrict(null); setStep('districts'); }

  return <LocalizedCopy><div className={`map-page map-page-premium ${embedded ? 'map-page-embedded' : ''}`}>
    <section className="map-page-hero">
      <div className="wrap">
        <div className="eyebrow">{embedded ? `${t('allRegions')} · 28 + 08` : `${t('mapEyebrow')} · RASVANI FIELD ATLAS`}</div>
        <h1>{t('mapTitle')}</h1>
        <p>{t('mapLead')}</p>
        <div className="map-journey-steps" aria-label="Discovery journey">
          <span className={step === 'regions' ? 'active' : 'complete'}><b>01</b> India</span><i>→</i><span className={step === 'districts' ? 'active' : step === 'foods' ? 'complete' : ''}><b>02</b> State & district</span><i>→</i><span className={step === 'foods' ? 'active' : ''}><b>03</b> Vegetarian foods</span>
        </div>
      </div>
    </section>

    <section className="wrap map-workspace" aria-live="polite">
      <div className="map-workspace-top">
        <div className="map-breadcrumbs">
          <button type="button" onClick={backToRegions} aria-label={t('backToIndia')} className={step === 'regions' ? 'current' : ''}>India</button>
          {selectedRegion && <><span>/</span><button type="button" onClick={backToDistricts} className={step === 'districts' ? 'current' : ''}>{selectedRegion}</button></>}
          {selectedDistrict && <><span>/</span><strong>{selectedDistrict}</strong></>}
        </div>
        {step !== 'regions' && <button type="button" className="map-back-link" onClick={step === 'foods' ? backToDistricts : backToRegions}>← {step === 'foods' ? t('backToDistricts') : t('backToIndia')}</button>}
      </div>

      {step === 'regions' && <div className="map-region-layout">
        <div className="map-visual-stage map-visual-stage-real">
          <div className="map-stage-topline"><span>{t('allRegions')} / LGD 2024 SNAPSHOT</span><span>HOVER · ZOOM · SELECT</span></div>
          <IndiaBoundaryMap level="states" onSelect={chooseRegion} onHover={setHoveredRegion}/>
          {hoveredRegion && <div className="map-hover-preview" aria-live="polite"><span className="map-hover-preview-mark">✳</span><div><small>REGION PREVIEW</small><strong>{hoveredRegion}</strong><p>Select the highlighted region on the map or in the regional index to explore its districts.</p></div></div>}
        </div>
        <div className="map-region-panel">
          <div className="map-region-panel-head"><div><span className="eyebrow">THE REGIONAL INDEX</span><h2>{t('selectRegion')}</h2></div><span className="region-count">36</span></div>
          <div className="map-region-filters"><span>{t('states')}</span><span>{t('territories')}</span></div>
          <div className="map-region-list">
            <div className="region-list-label">{t('states')}</div>
            {regions.slice(0, 28).map((region, index) => <button type="button" key={region} className={`map-region-option ${selectedRegion === region ? 'selected' : ''} ${region === 'Bihar' ? 'bihar-option' : ''}`} onMouseEnter={() => setHoveredRegion(region)} onMouseLeave={() => setHoveredRegion(null)} onFocus={() => setHoveredRegion(region)} onBlur={() => setHoveredRegion(null)} onClick={() => chooseRegion(region)}><span className="region-index">{String(index + 1).padStart(2, '0')}</span><strong>{region}</strong>{region === 'Bihar' && <em>{t('firstLaunch')}</em>}<span className="region-arrow">↗</span></button>)}
            <div className="region-list-label territory-label">{t('territories')}</div>
            {regions.slice(28).map((region, index) => <button type="button" key={region} className="map-region-option" onMouseEnter={() => setHoveredRegion(region)} onMouseLeave={() => setHoveredRegion(null)} onFocus={() => setHoveredRegion(region)} onBlur={() => setHoveredRegion(null)} onClick={() => chooseRegion(region)}><span className="region-index">U{String(index + 1).padStart(2, '0')}</span><strong>{regionShort[region] ?? region}</strong><span className="region-arrow">↗</span></button>)}
          </div>
        </div>
      </div>}

      {step === 'districts' && <div className="map-selection-view">
        <div className="selection-editorial">
          <div className="eyebrow">01 / REGION SELECTED</div><h2>{selectedRegion}</h2>
          <p>{isBihar ? 'Bihar is Rasvani’s first editorial launch focus. Choose a district to continue into its vegetarian food collection.' : `The ${selectedRegion} regional guide is part of the 36-region directory. District guides will appear after their names and supporting records are verified and approved.`}</p>
          {isBihar && <span className="approval-pill">38 district navigation records cross-checked</span>}
        </div>
        <div className="district-selection-panel district-selection-panel-map">
          <div className="district-selection-header"><div><span className="eyebrow">{t('districts')} / {selectedRegion}</span><h3>Choose a district on the map</h3></div><span className="region-count">{isBihar ? 38 : mapDistrictNames.length || '—'}</span></div>
          <IndiaBoundaryMap level="districts" selectedState={selectedRegion ?? undefined} selectedStateCode={selectedStateCode} selectedBounds={selectedBounds} fallbackItems={districtList} onDistrictsAvailable={setMapDistrictNames} onSelect={chooseDistrictFromMap}/>
          {districtList.length > 0 && <div className="bihar-district-index map-district-index-all">
            <div className="bihar-district-index-heading"><strong>{isBihar ? 'Browse all 38 Bihar districts' : `District index · ${selectedRegion}`}</strong><span>{isBihar ? '38 navigation records' : `${districtList.length} names currently surfaced from the selected boundary tiles`}</span></div>
            <label className="map-district-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search districts</span><input type="search" value={districtSearch} onChange={(event) => setDistrictSearch(event.target.value)} placeholder={`Search ${selectedRegion} districts…`} /></label>
            <div className="map-district-grid">{visibleDistrictList.map((district, index) => <button type="button" key={district} onClick={() => chooseDistrict(district)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{district}</strong><i aria-hidden="true">↗</i></button>)}</div>
            {visibleDistrictList.length === 0 && <p className="district-index-footnote">No district names match this search.</p>}
            <p className="district-index-footnote">District index is for navigation only. District food associations and products appear only after evidence review and approval.</p>
          </div>}
          {!isBihar && districtList.length === 0 && <p className="notice" role="status">District boundaries are loading. You can also select a district directly on the map; its name will appear in this index as boundary tiles load. Food collections require separate editorial approval.</p>}
        </div>
      </div>}

      {step === 'foods' && <div className="district-food-discovery">
        <div className="district-food-visual district-food-visual-pending" aria-label="District hero artwork placeholder; the research-list snack entries appear below">
          <div className="district-art-ornament" aria-hidden="true"><span>✳</span><i/><b/></div>
          <div className="district-visual-caption"><small>{selectedRegion?.toUpperCase()} / DISTRICT ATLAS</small><strong>{selectedDistrict}</strong><span>Vegetarian dry-snack research candidates · approval pending</span></div>
        </div>
        <div className="district-food-copy"><div className="eyebrow">{selectedRegion} · {selectedDistrict}</div><h2>{t('foodCollection')}</h2><p>Rasvani will show traditional vegetarian foods here only when the district association, supporting evidence and editorial review are complete.</p>
          {selectedDrySnackDistrict && <article className="map-selected-dry-snack-card">
            <div className="map-selected-dry-snack-heading"><div className="eyebrow">BIHAR · RASVANI DRY-SNACK RESEARCH LIST</div><h3>{selectedDrySnackDistrict.district} · Candidate dry snacks</h3></div>
            <p className="map-selected-dry-snack-speciality"><strong>District-linked food / speciality:</strong> {selectedDrySnackDistrict.districtLinkedSpeciality}</p>
            {selectedDrySnackDistrict.linkedSnackNote && <p className="map-selected-dry-snack-context">{selectedDrySnackDistrict.linkedSnackNote}</p>}
            <ul className="map-selected-dry-snack-list">{selectedDrySnackDistrict.snacks.map((item) => <li key={`${item.slug}-${item.name}`}><Image src={item.image} alt={item.imageAlt} width={56} height={56}/><span><strong>{item.name}</strong><small className={item.basis === 'district-linked' ? 'snack-basis-linked' : 'snack-basis-fallback'}>{item.basis === 'district-linked' ? 'District-linked candidate' : 'Bihar-wide fallback'}</small>{item.caution && <small>{item.caution}</small>}</span></li>)}</ul>
            <p className="map-selected-dry-snack-disclaimer">Candidate list only. Bihar-wide fallback snacks are not district-origin claims; no item is approved for sale by appearing here. Confirm the producer recipe, ingredients, batch and sealed-pack shelf life before listing.</p>
            <Link className="map-selected-dry-snack-guide" href={`/explore-india/bihar/district/${encodeURIComponent(slugifyDistrict(selectedDistrict ?? ''))}`}>Open {selectedDistrict} district guide ↗</Link>
          </article>}
          <div className="pending-collection-card"><span className="pending-collection-icon">✳</span><div><h3>{t('pendingTitle')}</h3><p>{t('pendingBody')}</p></div></div>
          <Link className="btn" href={`/shop?region=${encodeURIComponent(slugifyRegion(selectedRegion ?? ''))}&district=${encodeURIComponent(slugifyDistrict(selectedDistrict ?? ''))}`}>Check approved catalogue entries <span aria-hidden="true">↗</span></Link>
          <p className="notice">The catalogue link shows only approved, sellable entries. Research-list snacks and illustrative artwork are not live products.</p>
        </div>
      </div>}
    </section>
    <div className="wrap map-footer-note"><span>RASVANI / REGIONAL FOOD DISCOVERY</span><span>Only vegetarian collections are intended for this experience.</span><span>LGD 2024 BOUNDARIES · CONTENT VERIFIED BEFORE PUBLISHING</span></div>
  </div></LocalizedCopy>;
}
