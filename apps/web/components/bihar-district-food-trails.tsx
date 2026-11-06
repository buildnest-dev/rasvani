'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SiwanFood3DStage } from '@/components/siwan-food-3d-stage';
import type { BiharDrySnackDistrict } from '@/lib/bihar-dry-snacks';

type FoodTrailItem = BiharDrySnackDistrict['snacks'][number];

function storyHref(district: BiharDrySnackDistrict, item: FoodTrailItem) {
  return `/food-stories?district=${encodeURIComponent(district.district)}&food=${encodeURIComponent(item.name)}`;
}

export function BiharDistrictFoodTrails({ district }: { district: BiharDrySnackDistrict }) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return district.snacks.filter((item) => !q || `${item.name} ${item.slug} ${item.basis} ${item.caution ?? ''}`.toLocaleLowerCase().includes(q));
  }, [district.snacks, query]);

  const stageItems = district.snacks.map((item) => ({
    name: item.name,
    category: item.basis === 'district-linked' ? 'District-linked candidate' : 'Bihar-wide fallback',
    image: item.image,
    imageAlt: item.imageAlt,
  }));

  return <LocalizedCopy><section className="bihar-district-trails" id="traditional-foods" aria-labelledby="district-trails-title">
    <div className="bihar-district-trails-heading">
      <div>
        <div className="eyebrow">FLAVOUR TRAILS · BIHAR RESEARCH LIST</div>
        <h2 id="district-trails-title">Traditional foods of {district.district}</h2>
        <p>Food names are shown in English, matching the district-wise Rasvani research list.</p>
      </div>
      <label className="bihar-district-food-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search foods in this district</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search food" /></label>
    </div>

    <div className="bihar-district-origin-note">
      <span className="bihar-district-origin-mark" aria-hidden="true">✳</span>
      <p><strong>District research reference:</strong> {district.districtLinkedSpeciality}. Food associations are research candidates, not exclusive-origin claims or approved products.</p>
    </div>

    <div className="bihar-district-stage-wrap">
      <SiwanFood3DStage
        items={stageItems}
        eyebrow={`${district.district.toUpperCase()} · FOOD ATLAS`}
        title="Flavours in focus"
        ariaLabel={`Interactive three-dimensional food showcase for ${district.district}`}
      />
    </div>

    <div className="bihar-district-food-grid" aria-live="polite">
      {visible.map((item, index) => <article className="bihar-district-food-card" key={`${district.slug}-${item.slug}-${index}`}>
        <Link className="bihar-district-food-photo" href={storyHref(district, item)} aria-label={`Open food stories about ${item.name}`}>
          <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 650px) 92vw, (max-width: 1000px) 45vw, 40vw" priority={index < 2} />
          <span className="bihar-district-food-photo-shade" aria-hidden="true" />
          <span className="bihar-district-food-photo-index">{String(index + 1).padStart(2, '0')}</span>
        </Link>
        <div className="bihar-district-food-copy">
          <div className="bihar-district-food-status-row">
            <span className={item.basis === 'district-linked' ? 'bihar-food-status linked' : 'bihar-food-status fallback'}>{item.basis === 'district-linked' ? 'DISTRICT-LINKED CANDIDATE' : 'BIHAR-WIDE FALLBACK'}</span>
            <span className="bihar-district-food-category">VEGETARIAN · DRY SNACK</span>
          </div>
          <h3>{item.name}</h3>
          {item.caution && <p className="bihar-district-food-caution">{item.caution}</p>}
          <Link className="bihar-district-story-link" href={storyHref(district, item)}><span aria-hidden="true">▶</span> Food Stories &amp; Vlogs <span aria-hidden="true">→</span></Link>
        </div>
      </article>)}
    </div>

    {visible.length === 0 && <div className="bihar-district-no-results"><h3>No matching food found</h3><p>Try another food name from this district’s research list.</p></div>}

    <p className="bihar-district-shelf-note"><strong>Illustrative food visuals.</strong> These images help visitors recognise the food and are not photographs of an approved producer or sellable pack. The names are candidate research entries, not a guarantee of a seven-day shelf life. Any “7 days or more” claim requires validation for the exact recipe, producer, batch and sealed pack.</p>
    {district.linkedSnackNote && <p className="bihar-district-speciality-note">{district.linkedSnackNote}</p>}
  </section></LocalizedCopy>;
}
