import Image from 'next/image';
import Link from 'next/link';
import { biharHomeFoodItems } from '@/lib/bihar-home-food-items';
import { regions } from '@/lib/regions';

const featuredNames = ['Silao Khaja', 'Thekua', 'Tilkut', 'Sattu Ladoo'];
const featured = featuredNames
  .map((name) => biharHomeFoodItems.find((item) => item.name === name || item.aliases.includes(name)))
  .filter((item): item is NonNullable<typeof item> => Boolean(item));
const states = regions.slice(0, 28);

/** India-first landing page. Bihar is the only live state today; every other state is marked "soon". */
export function HomeLanding() {
  return <div className="landing">
    <section className="lp-hero">
      <div className="wrap lp-hero-grid">
        <div className="lp-hero-copy">
          <p className="lp-badge"><span className="launch-dot" aria-hidden="true" /> For all of India · <b>live in Bihar today</b></p>
          <h1>Taste India<br /><em>From Home</em></h1>
          <p className="lp-lead">Authentic regional vegetarian foods, made by home bakers and local kitchens. Order online for home delivery or collect from a partner shop.</p>
          <form action="/explore-india" method="get" role="search" className="lp-search">
            <label className="sr-only" htmlFor="lp-q">Search regional foods</label>
            <input id="lp-q" type="search" name="q" minLength={2} maxLength={80} placeholder="What do you want to taste from India?" autoComplete="off" />
            <button type="submit" aria-label="Search">Search</button>
          </form>
          <ul className="lp-trust">
            <li><b>100%</b> vegetarian</li>
            <li><b>Home-made</b> by local bakers</li>
            <li><b>Bihar</b> orders open now</li>
            <li><b>More states</b> coming soon</li>
          </ul>
        </div>
        <div className="lp-hero-art">
          <Image src="/images/rasvani-feast-hero.webp" alt="A rich vegetarian Indian food spread on traditional serving dishes" fill priority sizes="(max-width: 900px) 100vw, 50vw" />
          <span className="lp-hero-note">Different states.<br />Different flavours.<br /><b>One India.</b></span>
        </div>
      </div>
    </section>

    <section className="lp-states wrap" aria-labelledby="lp-states-h">
      <div className="lp-states-panel">
        <h2 id="lp-states-h">Taste India by State</h2>
        <p className="lp-sub">Bihar is open for orders. Other states will open one by one.</p>
        <Link href="/bihar" className="lp-bihar-card">
          <span className="lp-live">LIVE NOW</span>
          <strong>Bihar</strong>
          <small>Order home-made Bihari foods →</small>
        </Link>
        <ul className="lp-state-list">
          {states.filter((name) => name !== 'Bihar').map((name) => <li key={name}><span>{name}</span><i>Soon</i></li>)}
        </ul>
        <Link className="text-link" href="/india-map">Open the India map ↗</Link>
      </div>
      <div className="lp-featured">
        <div className="lp-featured-head"><h2>Featured regional foods</h2><Link className="text-link" href="/bihar">See all of Bihar →</Link></div>
        <div className="lp-food-row">{featured.map((item) => <Link key={item.id} href="/bihar" className="lp-food-card">
          <span className="lp-food-img"><Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 700px) 45vw, 18vw" /></span>
          <strong>{item.name}</strong><small>Bihar</small>
        </Link>)}</div>
        <div className="lp-promo">
          <div><span className="eyebrow">NOW LIVE IN BIHAR</span><h3>Home-made Bihari foods, ordered from your phone.</h3><p>Choose your food, order online, pay by cash or UPI, and get home delivery or collect it from a shop.</p></div>
          <Link href="/bihar" className="btn lp-promo-btn">Explore Bihar foods</Link>
        </div>
      </div>
    </section>

    <section className="lp-strip" aria-label="What Rasvani stands for">
      <div className="wrap"><span>Traditional recipes</span><span>Regional authenticity</span><span>Local home bakers</span><span>100% vegetarian</span></div>
    </section>
  </div>;
}
