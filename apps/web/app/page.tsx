import type { Metadata } from 'next';
import { HomeLanding } from '@/components/home-landing';
import { loadVisibleProducts } from '@/lib/firebase/catalogue';
import { productImage } from '@/lib/food-images';

export const metadata: Metadata = { title: 'Taste India From Home', description: 'Authentic regional vegetarian foods from home bakers. For all of India, live in Bihar today.' };
// Re-checks the catalogue every 5 minutes instead of on every request, so a newly published food
// (with its price and photo) shows up here on its own within minutes, with no admin step needed —
// no live Firestore hit per visit either, so Core Web Vitals stay as fast as before.
export const revalidate = 300;

export default async function HomePage() {
  const { products } = await loadVisibleProducts();
  // Same picture a product's own card shows: the admin's uploaded photo, or — for the common Bihar
  // foods most products are published without one — the matching built-in library photo. Checking
  // product.image alone (not this resolved picture) was why the hero ran empty with real products live.
  const heroProducts = products.filter((p) => productImage(p)).slice(0, 6);
  return <HomeLanding heroProducts={heroProducts} />;
}
