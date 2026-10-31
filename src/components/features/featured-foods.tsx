'use client';

import Image, { type StaticImageData } from 'next/image';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { goToNotify } from '@/lib/notify';
import { SplitHeading } from '@/components/motion/split-heading';
import { useMotion } from '@/components/motion/motion-provider';
import { FOODS } from '@/modules/catalog/foods';
import { STATE_BY_CODE } from '@/modules/catalog/states';
import khaja from '@/assets/dishes/khaja.jpg';
import selroti from '@/assets/dishes/selroti.jpg';
import kafuli from '@/assets/dishes/kafuli.jpg';
import faraa from '@/assets/dishes/faraa.jpg';
import eromba from '@/assets/dishes/eromba.jpg';
import kersangri from '@/assets/dishes/kersangri.jpg';
import dhokla from '@/assets/dishes/dhokla.jpg';
import puranpoli from '@/assets/dishes/puranpoli.jpg';

/* Cards read name and description from the seed Library (never invented). No prices, shelf lives or delivery times:
   those come from real listings and the serviceability engine (AGENTS §2.2, §2.4). */
const PICKS: ReadonlyArray<{ code: string; food: string; img: StaticImageData }> = [
  { code: 'BR', food: 'Silao Khaja', img: khaja },
  { code: 'SK', food: 'Sel Roti', img: selroti },
  { code: 'UK', food: 'Kafuli', img: kafuli },
  { code: 'CG', food: 'Faraa', img: faraa },
  { code: 'MN', food: 'Eromba', img: eromba },
  { code: 'RJ', food: 'Ker Sangri', img: kersangri },
  { code: 'GJ', food: 'Dhokla', img: dhokla },
  { code: 'MH', food: 'Puran Poli', img: puranpoli },
];

export function FeaturedFoods() {
  const { ready, motionOK } = useMotion();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ready || !motionOK) return;
      gsap.from('.dcard', {
        y: 48,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.09,
        clearProps: 'opacity,transform,translate',
        scrollTrigger: { trigger: '.dgrid', start: 'top 85%', once: true },
      });
    },
    { scope: root, dependencies: [ready, motionOK] },
  );

  return (
    <section ref={root} className="featured" id="featured" aria-labelledby="featuredTitle">
      <div className="container">
        <p className="hand">starting with these</p>
        <SplitHeading id="featuredTitle" className="h2">
          Foods we’re bringing to the Library
        </SplitHeading>
        <p className="lede">Each one is made by regional makers we’re onboarding now. Tell us which you want and we’ll message you when it can reach your PIN.</p>
        <ul className="dgrid">
          {PICKS.map(({ code, food, img }) => {
            const item = (FOODS[code] ?? []).find((f) => f.name.toLowerCase().startsWith(food.toLowerCase()));
            const state = STATE_BY_CODE[code];
            if (!item || !state) return null;
            return (
              <li key={food} className="dcard">
                <div className="dcard__img">
                  <Image src={img} alt={`${item.name}, illustrative image`} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 92vw" />
                  <span className="dcard__badge">Illustrative image</span>
                </div>
                <div className="dcard__body">
                  <p className="dcard__state">{state.name}</p>
                  <h3 className="dcard__name">{item.name}</h3>
                  <p className="dcard__desc">{item.desc}</p>
                  <p className="dcard__status">{item.confirm ? 'Veg recipe being confirmed' : 'Maker onboarding'}</p>
                  <button type="button" className="btn btn--maroon btn--block" data-cursor="link" onClick={() => goToNotify({ dish: item.name, state: code })}>
                    Notify me
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
