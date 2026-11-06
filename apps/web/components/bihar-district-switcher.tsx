'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { biharDistricts, slugifyDistrict } from '@/lib/bihar-districts';

export function BiharDistrictSwitcher({ activeDistrict }: { activeDistrict: string }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => biharDistricts.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  return <LocalizedCopy><section className="bihar-district-switcher" aria-labelledby="bihar-district-switcher-title">
    <div className="bihar-district-switcher-heading">
      <div><span className="eyebrow">EXPLORE THE STATE</span><h2 id="bihar-district-switcher-title">Discover another Bihar district</h2></div>
      <span className="bihar-district-total">38 districts</span>
    </div>
    <label className="bihar-district-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a district…" aria-label="Search Bihar districts" /></label>
    <nav className="bihar-district-pills" aria-label="Bihar districts">
      {filtered.map((name) => <Link key={name} aria-current={name === activeDistrict ? 'page' : undefined} className={name === activeDistrict ? 'is-active' : ''} href={`/explore-india/bihar/district/${encodeURIComponent(slugifyDistrict(name))}`}>{name}<span aria-hidden="true">↗</span></Link>)}
    </nav>
    {filtered.length === 0 && <p className="bihar-district-no-results">No district matches that search.</p>}
  </section></LocalizedCopy>;
}
