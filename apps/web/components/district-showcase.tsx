'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export type ShowcaseFood = { name: string; image: string; alt: string };

/** Adds the "is-in" class to .rv-reveal blocks as they scroll into view. Does nothing for reduced-motion users. */
export function DistrictMotion() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.rv-reveal'));
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { nodes.forEach((node) => node.classList.add('is-in')); return; }
    // Content stays visible unless this script runs: only then do blocks start hidden and fade in.
    document.body.classList.add('rv-ready');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); observer.unobserve(entry.target); } }), { threshold: 0.05 });
    nodes.forEach((node) => observer.observe(node));
    return () => { observer.disconnect(); document.body.classList.remove('rv-ready'); };
  }, []);
  return null;
}

export function DistrictSpotlight({ district, foods, foodCount, placeCount, speciality }: { district: string; foods: ShowcaseFood[]; foodCount: number; placeCount: number; speciality: string | null }) {
  const floaters = foods.slice(0, 5);
  return <section className="ds-spotlight rv-reveal" aria-label={`${district} at a glance`}>
    <div className="ds-spot-copy">
      <span className="eyebrow">{district.toUpperCase()} · AT A GLANCE</span>
      <h2>Taste {district}</h2>
      <p>{speciality ? `Research reference for this district: ${speciality}.` : `Explore the traditional vegetarian foods and notable places connected with ${district}.`}</p>
      <ul className="ds-stats">
        <li><b>{foodCount}</b><span>traditional foods</span></li>
        <li><b>{placeCount}</b><span>places to visit</span></li>
        <li><b>100%</b><span>vegetarian</span></li>
      </ul>
      <div className="cta-row"><Link className="btn" href="/bihar#order-now">Order Bihar foods</Link><a className="btn secondary" href="#traditional-foods">See the foods</a></div>
    </div>
    <div className="ds-stage" aria-hidden="true">
      <span className="ds-ring ds-ring-a" /><span className="ds-ring ds-ring-b" />
      {floaters.map((food, index) => <span key={`${food.name}-${index}`} className={`ds-float ds-float-${index + 1}`}><Image src={food.image} alt="" fill sizes="160px" /></span>)}
    </div>
  </section>;
}

export function DistrictTaste({ district, foods, speciality }: { district: string; foods: ShowcaseFood[]; speciality: string | null }) {
  const names = Array.from(new Set(foods.map((food) => food.name)));
  return <article className="district-editorial-panel ds-panel rv-reveal" id="food-stories">
    <div className="eyebrow">FROM THE LOCAL KITCHEN</div>
    <h2>Flavours of {district}</h2>
    <p>{speciality ? `${speciality} is the research reference for this district. ` : ''}These traditional vegetarian foods are linked with {district} or are loved across Bihar.</p>
    <div className="ds-chips">{names.slice(0, 10).map((name) => <span key={name}>{name}</span>)}</div>
    <div className="cta-row"><Link className="btn" href="/bihar#order-now">Order home-made foods</Link><Link className="text-link" href="/food-stories">Read food stories →</Link></div>
  </article>;
}

export function DistrictGallery({ district, foods }: { district: string; foods: ShowcaseFood[] }) {
  const unique = foods.filter((food, index) => foods.findIndex((other) => other.image === food.image) === index).slice(0, 8);
  if (unique.length === 0) return null;
  return <article className="district-editorial-panel district-gallery-panel ds-gallery rv-reveal" id="district-gallery">
    <div className="eyebrow">A VISUAL JOURNEY</div>
    <h2>{district} on a plate</h2>
    <div className="ds-gallery-grid">{unique.map((food) => <figure key={food.image}><span><Image src={food.image} alt={food.alt} fill sizes="(max-width: 700px) 45vw, 20vw" /></span><figcaption>{food.name}</figcaption></figure>)}</div>
    <p className="notice">Illustrative artwork to help you recognise each food. These are not photographs of a producer or a pack.</p>
  </article>;
}

export function DistrictAbout({ district, otherDistrictsHref }: { district: string; otherDistrictsHref: string }) {
  return <article className="district-editorial-panel ds-panel rv-reveal" id="district-about">
    <div className="eyebrow">KNOW THE DISTRICT</div>
    <h2>About {district}</h2>
    <p>{district} is one of the 38 districts of Bihar. Use this page to explore its traditional foods and notable places, then order Bihar&apos;s home-made foods from our local bakers.</p>
    <div className="cta-row"><Link className="btn secondary" href={otherDistrictsHref}>See all Bihar districts</Link><Link className="text-link" href="/bihar">Bihar famous foods →</Link></div>
  </article>;
}

/** Hero panel: a slideshow of this district's foods (slow zoom + crossfade) so every district opens with food photos. */
export function DistrictHeroArt({ district, foods }: { district: string; foods: ShowcaseFood[] }) {
  const list = foods.filter((food, index) => foods.findIndex((other) => other.image === food.image) === index).slice(0, 6);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (list.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % list.length), 3400);
    return () => window.clearInterval(timer);
  }, [list.length]);
  const current = list[active];
  return <div className="district-hero-art dh-art" aria-label={`${district} district food photos`}>
    {list.map((food, index) => <Image key={food.image} className={`dh-slide ${index === active ? 'is-on' : ''}`} src={food.image} alt={index === active ? food.alt : ''} fill priority={index === 0} sizes="(max-width: 900px) 100vw, 45vw" />)}
    <div className="dh-shade" aria-hidden="true" />
    <div className="district-hero-art-caption"><small>RASVANI DISTRICT ATLAS</small><strong>{district}</strong><span>{current ? `Now showing: ${current.name}` : 'Food · Heritage · Places'}</span></div>
    {list.length > 1 && <div className="dh-dots" aria-hidden="true">{list.map((food, index) => <i key={food.image} className={index === active ? 'is-on' : ''} />)}</div>}
  </div>;
}
