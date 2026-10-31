import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NotifyButton } from '@/components/features/notify-button';
import { STATES, STATE_BY_SLUG } from '@/modules/catalog/states';
import { STATE_META } from '@/modules/catalog/state-meta';
import { STATE_IMAGES } from '@/modules/catalog/state-images';
import { foodsFor } from '@/modules/catalog/foods';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = STATE_BY_SLUG[slug];
  if (!s) return { title: 'State not found — Rasvani' };
  const names = foodsFor(s.code).map((f) => f.name).join(', ');
  return {
    title: `${s.name} — traditional foods | Rasvani`,
    description: `Traditional vegetarian foods associated with ${s.name}: ${names}.`,
  };
}

export default async function StatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = STATE_BY_SLUG[slug];
  const meta = STATE_META[slug];
  const img = STATE_IMAGES[slug];
  if (!s || !meta || !img) notFound();

  const idx = STATES.findIndex((x) => x.slug === slug);
  const prev = STATES[(idx + STATES.length - 1) % STATES.length]!;
  const next = STATES[(idx + 1) % STATES.length]!;
  const foods = foodsFor(s.code);
  const pending = foods.filter((f) => f.confirm).length;
  const split = idx % 2 === 1;

  return (
    <div className="subpage statepage" style={{ ['--state-hue' as string]: meta.hue }}>
      <div className="container statepage__back">
        <Link href="/states">← All 28 states</Link>
      </div>

      <section className={split ? 'container sp-hero sp-hero--split' : 'container sp-hero'}>
        <div className="sp-hero__copy">
          <p className="eyebrow eyebrow--state">{meta.region} India</p>
          <h1 className="sp-hero__title">{s.name}</h1>
          {s.native && (
            <p className="sp-hero__native" lang="und">
              {s.native}
            </p>
          )}
          <p className="sp-hero__intro">{meta.intro}</p>
          <a className="btn btn--maroon" href="#collection">
            See the {foods.length} foods
          </a>
        </div>
        <figure className={split ? 'sp-hero__img grain' : 'sp-hero__img grain arch'}>
          <Image src={img} alt={`Illustration of traditional food of ${s.name}`} priority sizes="(min-width: 1024px) 46vw, 92vw" />
          <figcaption>Illustrative image, not a product photo.</figcaption>
        </figure>
      </section>

      <section className="sp-collection" id="collection">
        <div className="container">
          <p className="eyebrow eyebrow--state">Traditional vegetarian collection</p>
          <h2 className="h2">
            {foods.length} foods from {s.name}
          </h2>
          <p className="lede">
            Representative foods traditionally associated with {s.name}, not exclusive to it. Recipes vary by district and community.
            {pending > 0 && ` ${pending} ${pending === 1 ? 'is' : 'are'} marked while we confirm a meat- and fish-free recipe with a maker.`}
          </p>
          <ol className="sp-foods">
            {foods.map((f, i) => (
              <li key={f.name} className="sp-food">
                <span className="sp-food__n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{f.name}</h3>
                <p>{f.desc}</p>
                {f.confirm && <span className="food__tag food__tag--light">Veg recipe being confirmed</span>}
                <NotifyButton dish={f.name} state={s.code} className="btn btn--maroon">
                  Tell me when it’s available
                </NotifyButton>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <nav className="container sp-pager" aria-label="Other states">
        {([['Previous', prev], ['Next', next]] as const).map(([label, st]) => {
          const pimg = STATE_IMAGES[st.slug];
          return (
            <Link key={label} href={`/states/${st.slug}`} className={label === 'Next' ? 'sp-pager__item sp-pager__item--next' : 'sp-pager__item'}>
              {pimg && <Image src={pimg} alt="" width={80} height={80} />}
              <span>
                <span className="eyebrow">{label} state</span>
                <span className="sp-pager__name">{st.name}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
