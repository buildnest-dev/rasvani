'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PriceTag } from '@/components/price-tag';
import { productImage } from '@/lib/food-images';
import type { Product } from '@/lib/firebase/catalogue';

/** A packed, sellable product shown in the hero — not a stock photo. */
export type HeroProduct = Pick<Product, 'id' | 'slug' | 'name' | 'image' | 'makerDistrict' | 'pricePaise' | 'mrpPaise'>;

// The opening slide: a single designed graphic (its own headline, India map and stats are baked into
// the picture), so it carries no separate text overlay — only a click-through to the India map.
const bannerSlide = {
  image: '/images/rasvani-india-catalogue-hero.webp', href: '/india-map',
  alt: 'Rasvani, Taste India From Home: a nationwide collection of regional traditional foods, one signature food from every state and union territory shown on a map of India — 263+ traditional foods, 28 states and 8 union territories, verified local producers, hygienic and quality assured, long-lasting dry foods, pan-India delivery.',
} as const;

// Shown only if there are no live products yet, so the homepage never ships with an empty hero.
const fallbackSlides = [
  { image: '/images/rasvani-feast-hero.webp', eyebrow: 'For all of India · live in Bihar today', title: 'Taste India', accent: 'From Home', text: 'Authentic regional vegetarian foods from home bakers and local kitchens.', cta: 'Explore India', href: '/explore-india', alt: 'A rich vegetarian Indian food spread' },
  { image: '/images/rasvani-editorial-sweets-brass.webp', eyebrow: 'Bihar mithai', title: 'Thekua, Tilkut', accent: 'Silao Khaja', text: 'Festival sweets made the way your nani made them.', cta: 'Shop Bihar sweets', href: '/bihar', alt: 'Bihari sweets on brass plates' },
] as const;

/** Full-width rotating banner. Auto-advances every 5 s, pauses on hover/focus or when the user presses pause. */
export function HeroSlider({ products = [] }: { products?: HeroProduct[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);

  const productSlides = products.slice(0, 6).map((product) => ({
    kind: 'product' as const, key: product.id, image: productImage(product), name: product.name,
    maker: product.makerDistrict ? `Home-made in ${product.makerDistrict}` : 'Home-made in Bihar',
    pricePaise: product.pricePaise, mrpPaise: product.mrpPaise, href: `/shop/${encodeURIComponent(product.slug)}`,
  }));
  const slides = [
    { kind: 'banner' as const, key: 'banner', ...bannerSlide },
    ...(productSlides.length > 0 ? productSlides : fallbackSlides.map((slide) => ({ kind: 'vision' as const, key: slide.title, ...slide }))),
  ];

  const go = useCallback((n: number) => setIndex((n + slides.length) % slides.length), [slides.length]);
  useEffect(() => { if (index >= slides.length) setIndex(0); }, [index, slides.length]);

  useEffect(() => {
    if (paused || hover || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, hover, slides.length]);

  return <section className="hs" aria-roledescription="carousel" aria-label="Featured" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
    {slides.map((slide, i) => {
      const on = i === index;
      if (slide.kind === 'banner') return <Link key={slide.key} href={slide.href} className={`hs-slide hs-slide-banner${on ? ' on' : ''}`} aria-hidden={!on} aria-label={`${slide.alt} — opens the India map`} tabIndex={on ? 0 : -1}>
        <Image aria-hidden="true" alt="" src={slide.image} fill sizes="(max-width: 700px) 100vw, 1999px" priority={i === 0} className="hs-product-bg" />
        <Image src={slide.image} alt={slide.alt} fill sizes="(max-width: 700px) 100vw, 1999px" priority={i === 0} className="hs-banner-fg" />
      </Link>;
      if (slide.kind === 'product') return <div key={slide.key} className={`hs-slide hs-slide-product${on ? ' on' : ''}`} aria-hidden={!on} role="group" aria-label={`${i + 1} of ${slides.length}`}>
        <div className="hs-product-art">{slide.image ? <>
          <Image aria-hidden="true" alt="" src={slide.image} fill sizes="(max-width: 700px) 100vw, 56vw" priority={i === 0} className="hs-product-bg" />
          <Image src={slide.image} alt={slide.name} fill sizes="(max-width: 700px) 100vw, 56vw" priority={i === 0} className="hs-product-fg" />
        </> : null}</div>
        <div className="hs-shade hs-shade-product" />
        <div className="wrap hs-copy hs-copy-product">
          <p className="hs-eyebrow">{slide.maker}</p>
          {i === 0 ? <h1 className="hs-title hs-title-product">{slide.name}</h1> : <p className="hs-title hs-title-product" role="heading" aria-level={2}>{slide.name}</p>}
          <PriceTag pricePaise={slide.pricePaise} mrpPaise={slide.mrpPaise} />
          <p className="hs-text">Packed and shipped the way you&apos;ll actually receive it.</p>
          <Link href={slide.href} className="hs-cta" tabIndex={on ? 0 : -1}>Shop this food →</Link>
        </div>
      </div>;
      return <div key={slide.key} className={`hs-slide${on ? ' on' : ''}`} aria-hidden={!on} role="group" aria-label={`${i + 1} of ${slides.length}`}>
        <Image src={slide.image} alt={slide.alt} fill priority={i === 0} sizes="100vw" />
        <div className="hs-shade" />
        <div className="wrap hs-copy">
          <p className="hs-eyebrow">{slide.eyebrow}</p>
          {i === 0 ? <h1 className="hs-title">{slide.title}<br /><em>{slide.accent}</em></h1> : <p className="hs-title" role="heading" aria-level={2}>{slide.title}<br /><em>{slide.accent}</em></p>}
          <p className="hs-text">{slide.text}</p>
          <Link href={slide.href} className="hs-cta" tabIndex={on ? 0 : -1}>{slide.cta} →</Link>
        </div>
      </div>;
    })}
    {slides.length > 1 && <>
      <button type="button" className="hs-arrow prev" aria-label="Previous slide" onClick={() => go(index - 1)}>‹</button>
      <button type="button" className="hs-arrow next" aria-label="Next slide" onClick={() => go(index + 1)}>›</button>
      <div className="hs-dots">
        {slides.map((slide, i) => <button key={slide.key} type="button" className={i === index ? 'on' : ''} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} onClick={() => go(i)} />)}
        <button type="button" className="hs-pause" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused((p) => !p)}>{paused ? '▶' : '❚❚'}</button>
      </div>
    </>}
  </section>;
}
