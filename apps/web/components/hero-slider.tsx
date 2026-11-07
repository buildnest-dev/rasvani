'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const slides = [
  { image: '/images/rasvani-feast-hero.webp', eyebrow: 'For all of India · live in Bihar today', title: 'Taste India', accent: 'From Home', text: 'Authentic regional vegetarian foods from home bakers and local kitchens.', cta: 'Explore India', href: '/explore-india', alt: 'A rich vegetarian Indian food spread' },
  { image: '/images/rasvani-editorial-sweets-brass.webp', eyebrow: 'Bihar mithai', title: 'Thekua, Tilkut', accent: 'Silao Khaja', text: 'Festival sweets made the way your nani made them.', cta: 'Shop Bihar sweets', href: '/bihar', alt: 'Bihari sweets on brass plates' },
  { image: '/images/rasvani-savory-collection.webp', eyebrow: 'Namkeen & snacks', title: 'Crunchy. Spicy.', accent: 'Ghar Jaisa.', text: 'Nimki, makhana, chura bhunja and more, fresh from local kitchens.', cta: 'Shop snacks', href: '/bihar', alt: 'Bihari savoury snacks' },
  { image: '/images/rasvani-editorial-vegetarian-feast.webp', eyebrow: 'Har Jile Ka Swad', title: '38 Districts.', accent: '38 Flavours.', text: 'Pick a district of Bihar and taste what it is famous for.', cta: 'Find your district', href: '/bihar', alt: 'A Bihari vegetarian feast' },
];

/** Full-width rotating banner. Auto-advances every 5 s, pauses on hover/focus or when the user presses pause. */
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const go = useCallback((n: number) => setIndex((n + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused || hover || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, hover]);

  return <section className="hs" aria-roledescription="carousel" aria-label="Featured" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
    {slides.map((slide, i) => <div key={slide.title} className={`hs-slide${i === index ? ' on' : ''}`} aria-hidden={i !== index} role="group" aria-label={`${i + 1} of ${slides.length}`}>
      <Image src={slide.image} alt={slide.alt} fill priority={i === 0} sizes="100vw" />
      <div className="hs-shade" />
      <div className="wrap hs-copy">
        <p className="hs-eyebrow">{slide.eyebrow}</p>
        {i === 0 ? <h1 className="hs-title">{slide.title}<br /><em>{slide.accent}</em></h1> : <p className="hs-title" role="heading" aria-level={2}>{slide.title}<br /><em>{slide.accent}</em></p>}
        <p className="hs-text">{slide.text}</p>
        <Link href={slide.href} className="hs-cta" tabIndex={i === index ? 0 : -1}>{slide.cta} →</Link>
      </div>
    </div>)}
    <button type="button" className="hs-arrow prev" aria-label="Previous slide" onClick={() => go(index - 1)}>‹</button>
    <button type="button" className="hs-arrow next" aria-label="Next slide" onClick={() => go(index + 1)}>›</button>
    <div className="hs-dots">
      {slides.map((slide, i) => <button key={slide.title} type="button" className={i === index ? 'on' : ''} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} onClick={() => go(i)} />)}
      <button type="button" className="hs-pause" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused((p) => !p)}>{paused ? '▶' : '❚❚'}</button>
    </div>
  </section>;
}
