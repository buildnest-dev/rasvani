import { SplitHeading } from '@/components/motion/split-heading';

/* Server component: static copy. Authenticity wording follows 04-AI-RULES §2 (claims only from verified data). */
export function Promise() {
  return (
    <section className="promise" id="promise" aria-labelledby="promiseTitle">
      <div className="container promise__grid">
        <SplitHeading id="promiseTitle" className="h2">
          What we hold ourselves to
        </SplitHeading>
        <dl className="promise__list">
          <div>
            <dt>
              <svg className="vegmark" viewBox="0 0 24 24" role="img" aria-label="Vegetarian mark">
                <use href="#veg" />
              </svg>{' '}
              Vegetarian only
            </dt>
            <dd>
              A green veg mark on every product. Dishes that sometimes have non-vegetarian versions stay off sale until the maker confirms a meat-, fish- and egg-free recipe and we check it.
            </dd>
          </div>
          <div>
            <dt>Delivery we can stand behind</dt>
            <dd>Checked per product and per PIN code. Fresh foods stay local. If we can’t confirm a delivery, you won’t be able to order it, and we’ll say why.</dd>
          </div>
          <div>
            <dt>Origin before adjectives</dt>
            <dd>“Origin verified” appears only when we hold the evidence. Recipes vary by district and community, so we say “traditionally associated with”, never “belongs only to”.</dd>
          </div>
          <div>
            <dt>Real photos of real products</dt>
            <dd>No stock images standing in for what arrives at your door.</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
