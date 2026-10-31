'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { STATES_ALPHA } from '@/modules/catalog/states';
import { REGIONS, STATE_META, type Region } from '@/modules/catalog/state-meta';
import { STATE_IMAGES } from '@/modules/catalog/state-images';
import { foodCount } from '@/modules/catalog/foods';

export function StatesGrid() {
  const [region, setRegion] = useState<Region | 'All'>('All');
  const shown = STATES_ALPHA.filter((s) => region === 'All' || STATE_META[s.slug]?.region === region);

  return (
    <>
      <div className="chips" role="group" aria-label="Filter by region">
        {(['All', ...REGIONS] as const).map((r) => (
          <button key={r} type="button" className={cn('chip', region === r && 'is-on')} aria-pressed={region === r} onClick={() => setRegion(r)}>
            {r}
          </button>
        ))}
      </div>
      <p className="states__count" aria-live="polite">
        {shown.length} {shown.length === 1 ? 'state' : 'states'}
      </p>
      <ul className="sgrid">
        {shown.map((s) => {
          const meta = STATE_META[s.slug];
          const img = STATE_IMAGES[s.slug];
          return (
            <li key={s.slug} style={{ ['--state-hue' as string]: meta?.hue ?? 40 }}>
              <Link href={`/states/${s.slug}`} className="sgrid__card" data-cursor="view" data-cursor-label="Open">
                <span className="sgrid__img grain">{img && <Image src={img} alt="" sizes="(min-width: 1024px) 24vw, (min-width: 640px) 44vw, 92vw" />}</span>
                <span className="sgrid__body">
                  <span className="eyebrow">{meta?.region} India</span>
                  <span className="sgrid__name">{s.name}</span>
                  {s.native && (
                    <span className="sgrid__native" lang="und">
                      {s.native}
                    </span>
                  )}
                  <span className="sgrid__meta">{foodCount(s.code)} traditional foods</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
