"use client";
import { LocalizedCopy } from '@/components/localized-copy';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { regions } from '@/lib/regions';
import { useLocale } from '@/components/locale-provider';

type RegionScope = 'all' | 'states' | 'territories';
const stateRegions = regions.slice(0, 28);
const territoryRegions = regions.slice(28);

export function RegionDirectory() {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<RegionScope>('all');
  const filtered = useMemo(() => {
    const source = scope === 'states' ? stateRegions : scope === 'territories' ? territoryRegions : regions;
    const normalized = query.trim().toLocaleLowerCase();
    return source.filter((region) => region.toLocaleLowerCase().includes(normalized));
  }, [query, scope]);

  return <LocalizedCopy><div className="region-directory">
    <div className="region-directory-tools">
      <label htmlFor="region-search">{t('selectRegion')}</label>
      <input id="region-search" className="field" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('allRegions')} autoComplete="off" />
      <p className="region-directory-coverage">28 States <span aria-hidden="true">·</span> 8 Union Territories</p>
      <div className="region-scope" role="group" aria-label="Filter regions by type">
        <button type="button" className={scope === 'all' ? 'active' : ''} aria-pressed={scope === 'all'} onClick={() => setScope('all')}>{t('allRegions')}</button>
        <button type="button" className={scope === 'states' ? 'active' : ''} aria-pressed={scope === 'states'} onClick={() => setScope('states')}>{t('states')}</button>
        <button type="button" className={scope === 'territories' ? 'active' : ''} aria-pressed={scope === 'territories'} onClick={() => setScope('territories')}>{t('territories')}</button>
      </div>
      <p aria-live="polite" className="notice">Showing {filtered.length} of {scope === 'states' ? 28 : scope === 'territories' ? 8 : 36} {scope === 'territories' ? 'Union Territories' : scope === 'states' ? 'states' : 'regions'}</p>
    </div>
    {filtered.length > 0 ? <div className="region-list">{filtered.map((region) => {
      const index = regions.indexOf(region);
      const isBihar = region === 'Bihar';
      return <Link href={`/explore-india/${encodeURIComponent(region.toLowerCase().replaceAll(' ', '-'))}`} key={region} className={isBihar ? 'region-link region-link-featured' : 'region-link'}>
        <span className="notice">{String(index + 1).padStart(2, '0')} / {index < 28 ? 'STATE' : 'UNION TERRITORY'}</span>
        <strong>{region}</strong>
        {isBihar && <span className="region-first-label">{t('firstLaunch')}</span>}
      </Link>;
    })}</div> : <p className="shop-empty" role="status">No matching region. Try another spelling or change the region filter.</p>}
    <p className="notice region-directory-note">All 36 regions are included in the navigation taxonomy. Individual food, district and producer content will be published only when verified; a region appearing here does not imply product availability or delivery coverage.</p>
  </div></LocalizedCopy>;
}
