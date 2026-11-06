'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { RegionDirectory } from '@/components/region-directory';
import { useLocale } from '@/components/locale-provider';

export function ExploreIndiaExperience({ query, children }: { query: string; children?: ReactNode }) {
  const { t } = useLocale();
  return <LocalizedCopy><div className="explore-india-page">
    <section className="explore-page-hero">
      <div className="wrap explore-page-hero-grid">
        <div><div className="eyebrow">A SEPARATE EDITORIAL DESTINATION / 36 REGIONS</div><h1>{t('exploreTitle')}</h1><p>{t('exploreLead')}</p><div className="explore-hero-actions"><Link className="btn" href="/india-map">Open interactive India map ↗</Link><span>STATE · DISTRICT · FOOD · STORY</span></div></div>
        <div className="explore-hero-art"><Image src="/images/rasvani-editorial-vegetarian-feast.webp" alt="A richly arranged vegetarian food spread from across India" fill sizes="(max-width: 850px) 100vw, 54vw"/><span className="explore-art-stamp">DISCOVER<br/><strong>BY REGION</strong></span></div>
      </div>
    </section>
    <section className="wrap explore-search-section">
      <div className="explore-search-heading"><div className="eyebrow">SEARCH THE REGIONAL PANTRY</div><h2>{t('searchIndia')}</h2><p>{t('searchHint')}</p></div>
      <form className="regional-global-search explore-search-form" action="/explore-india" method="get" role="search">
        <label htmlFor="regional-food-search">{t('searchPlaceholder')}</label>
        <div className="regional-global-search-row"><input id="regional-food-search" type="search" name="q" maxLength={80} minLength={2} defaultValue={query} placeholder={t('searchPlaceholder')} autoComplete="off"/><button className="btn" type="submit">{t('searchIndia')} ↗</button></div>
        <p className="notice">Search uses published product names, evidence-reviewed regional spellings and reviewed aliases for the supported language options.</p>
      </form>
      {children}
    </section>
    <section className="explore-directory-section">
      <div className="wrap">
        <div className="section-heading-premium"><div><div className="eyebrow">{t('browseRegions')} / 28 + 08</div><h2>Choose a region to begin.</h2></div><p>Regional guides and food associations appear only after review. Bihar is the first editorial launch focus.</p></div>
        <RegionDirectory/>
      </div>
    </section>
    <section className="explore-story-bridge"><div className="wrap explore-story-bridge-inner"><div><div className="eyebrow">BEYOND THE PLATE</div><h2>Places have stories.<br/>Food is how we remember.</h2></div><Link className="btn btn-ornament" href="/food-stories">Enter the food journal ↗</Link></div></section>
  </div></LocalizedCopy>;
}
