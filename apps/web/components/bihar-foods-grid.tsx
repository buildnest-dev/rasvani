'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export type BiharFoodCard = { id: string; name: string; category: string; image: string; imageAlt: string; place: string; href: string; group: 'sweets' | 'snacks' | 'other' };
const filters = [['all', 'All'], ['sweets', 'Sweets'], ['snacks', 'Snacks'], ['other', 'Other traditions']] as const;

export function BiharFoodsGrid({ items }: { items: BiharFoodCard[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>('all');
  const [term, setTerm] = useState('');
  const shown = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return items.filter((item) => (filter === 'all' || item.group === filter) && (!needle || `${item.name} ${item.place}`.toLowerCase().includes(needle)));
  }, [items, filter, term]);
  return <>
    <div className="bh-tools">
      <div className="bh-chips" role="group" aria-label="Filter foods">{filters.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} className={`chip ${filter === value ? 'is-on' : ''}`} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <label className="bh-search"><span className="sr-only">Search Bihar foods</span><input type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search a food or place" maxLength={60} /></label>
    </div>
    {shown.length === 0 ? <p className="notice">No foods match. Try another name.</p> : <div className="bh-grid">{shown.map((item) => <Link key={item.id} href={item.href} className="bh-card">
      <span className="bh-card-img"><Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 600px) 46vw, (max-width: 1000px) 30vw, 18vw" /></span>
      <strong>{item.name}</strong><small>{item.category}</small><em>{item.place}</em>
    </Link>)}</div>}
  </>;
}
