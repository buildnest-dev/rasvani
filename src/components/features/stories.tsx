import Image from 'next/image';
import Link from 'next/link';
import story from '@/assets/story.jpg';

/* Editorial teasers. Wording stays hedged ("traditionally associated with"); the picture is illustrative. TODO(verify): story copy with regional sources. */
const TEASERS: ReadonlyArray<{ state: string; slug: string; line: string }> = [
  { state: 'West Bengal', slug: 'west-bengal', line: 'Joynagarer Moa, the puffed-millet and date-palm-jaggery sweet associated with Joynagar.' },
  { state: 'Rajasthan', slug: 'rajasthan', line: 'Ghewar, a festive sweet, and the other kitchen staples of the desert.' },
  { state: 'Gujarat', slug: 'gujarat', line: 'Dhokla and the other steamed, fermented snacks of a Gujarati table.' },
];

export function Stories() {
  return (
    <section className="stories" id="stories" aria-labelledby="storiesTitle">
      <div className="container">
        <p className="eyebrow">Food stories</p>
        <h2 className="h2" id="storiesTitle">
          Every food has a story.
        </h2>
        <div className="stories__grid">
          <figure className="stories__main">
            <div className="grain arch-soft">
              <Image src={story} alt="Illustration of a family shaping thekua around a clay stove" sizes="(min-width: 1024px) 60vw, 92vw" />
            </div>
            <figcaption>
              <p className="eyebrow">Bihar · Chhath Puja</p>
              <p className="stories__title">Thekua, traditionally associated with Chhath, is shaped by hand in many homes.</p>
              <small>Illustrative image, not a product photo.</small>
            </figcaption>
          </figure>
          <ul className="stories__side">
            {TEASERS.map((t) => (
              <li key={t.slug}>
                <Link href={`/states/${t.slug}`} className="teaser" data-cursor="link">
                  <span className="eyebrow">{t.state}</span>
                  <span className="teaser__line">{t.line}</span>
                  <span className="teaser__go">See the foods →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
