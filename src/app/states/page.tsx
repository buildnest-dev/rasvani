import type { Metadata } from 'next';
import { StatesGrid } from '@/components/features/states-grid';

export const metadata: Metadata = {
  title: 'All 28 states — Rasvani',
  description: 'Browse the traditional vegetarian foods of every Indian state in the Rasvani Library.',
};

export default function StatesPage() {
  return (
    <div className="subpage">
      <section className="container states__head">
        <p className="eyebrow">Explore India</p>
        <h1 className="h2 states__title">28 states. Countless flavours. One India.</h1>
        <p className="lede">Pick a state to see the traditional vegetarian foods in our Library. Recipes vary by district and community, so these are representative, never exclusive.</p>
      </section>
      <section className="container states__body">
        <StatesGrid />
      </section>
    </div>
  );
}
