'use client';

import Image from 'next/image';
import { goToNotify } from '@/lib/notify';
import { FOODS } from '@/modules/catalog/foods';
import thali from '@/assets/bharat-thali.jpg';

interface Dish {
  name: string;
  state: string;
  code: string;
  x: number;
  y: number;
  /** Seed-Library name when it differs from the label on the plate. */
  lib?: string;
}

/* Bowl centres measured on the thali image (percent), clockwise from top-left. */
const DISHES: readonly Dish[] = [
  { name: 'Silao Khaja', state: 'Bihar', code: 'BR', x: 34, y: 14 },
  { name: 'Dal Baati Churma', state: 'Rajasthan', code: 'RJ', x: 54, y: 12 },
  { name: 'Sel Roti', state: 'Sikkim', code: 'SK', x: 75, y: 21 },
  { name: 'Eromba', state: 'Manipur', code: 'MN', x: 85, y: 36 },
  { name: 'Kafuli', state: 'Uttarakhand', code: 'UK', x: 85, y: 55 },
  { name: 'Faraa', state: 'Chhattisgarh', code: 'CG', x: 86, y: 73 },
  { name: 'Dhuska', state: 'Jharkhand', code: 'JH', x: 71, y: 78 },
  { name: 'Pakhala Bhata', state: 'Odisha', code: 'OD', x: 53, y: 82 },
  { name: 'Undhiyu', state: 'Gujarat', code: 'GJ', x: 32, y: 79 },
  { name: 'Puran Poli', state: 'Maharashtra', code: 'MH', x: 18, y: 64 },
  { name: 'Bebinca', state: 'Goa', code: 'GA', x: 13, y: 45 },
  { name: 'Mishti Doi', state: 'West Bengal', code: 'WB', x: 18, y: 27 },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
const inLibrary = (d: Dish) => (FOODS[d.code] ?? []).some((f) => norm(f.name).includes(norm(d.lib ?? d.name)));

function Hotspot({ d, i }: { d: Dish; i: number }) {
  const right = d.x > 68;
  const left = d.x < 20;
  const top = d.y < 22;
  const known = inLibrary(d);
  return (
    <div className="hotspot" style={{ left: `${d.x}%`, top: `${d.y}%` }} data-right={right} data-left={left} data-top={top}>
      <button type="button" className="hotspot__btn" aria-label={`${d.name}, ${d.state}`}>
        <span className="hotspot__glow" style={{ animationDelay: `${i * 2}s` }} />
        <span className="hotspot__dot" />
      </button>
      <div className="hotspot__card" role="tooltip">
        <p className="hotspot__name">{d.name}</p>
        <p className="hotspot__state">{d.state}</p>
        <p className="hotspot__status">{known ? 'In our seed Library' : 'Not in the seed Library yet'}</p>
        <button type="button" className="hotspot__cta" onClick={() => goToNotify({ dish: d.name, state: d.code })}>
          Tell me when it’s available →
        </button>
      </div>
    </div>
  );
}

export function ThaliHero() {
  return (
    <figure className="hero__thali hero-rv">
      <div className="thali__glow" aria-hidden="true" />
      <div className="thali__float">
        <div className="thali__bob">
        <Image src={thali} alt="A brass thali with twelve regional vegetarian dishes from twelve Indian states" priority sizes="(min-width: 1024px) 44vw, 92vw" className="thali__img" />
        <div className="thali__center" aria-hidden="true">
          <div className="thali__petals">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} style={{ transform: `rotate(${i * 30}deg)` }}>
                <i style={{ background: i % 2 ? 'var(--color-saffron-500)' : 'var(--color-gold-500)' }} />
              </span>
            ))}
          </div>
          <div className="thali__disc">
            <svg viewBox="0 0 120 90" className="thali__diya">
              <use href="#diya" />
            </svg>
            <strong>12 States</strong>
            <em>One Thali</em>
          </div>
        </div>
        {DISHES.map((d, i) => (
          <Hotspot key={d.name} d={d} i={i} />
        ))}
        </div>
      </div>
      <figcaption className="thali__cap">
        <span className="hand">12 states. 12 flavours. One thali.</span>
        <small>Illustrative image, not a product photo.</small>
      </figcaption>
    </figure>
  );
}
