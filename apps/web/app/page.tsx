import type { Metadata } from 'next';
import { HomeLanding } from '@/components/home-landing';
import { loadVisibleProducts } from '@/lib/firebase/catalogue';

export const metadata: Metadata = { title: 'Taste India From Home', description: 'Authentic regional vegetarian foods from home bakers. For all of India, live in Bihar today.' };
// Re-checks the catalogue every 5 minutes instead of on every request, so a newly published food
// shows up here soon without turning the homepage into a live Firestore hit on each visit.
export const revalidate = 300;

export default async function HomePage() {
  const { products } = await loadVisibleProducts();
  // The hero shows what a customer will actually receive, so only foods with a real photo qualify.
  const heroProducts = products.filter((p) => p.image).slice(0, 6);
  return <HomeLanding heroProducts={heroProducts} />;
}
