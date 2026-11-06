import { biharHomeFoodItems } from '@/lib/bihar-home-food-items';

// Admin may only choose from this built-in library (images that ship with the site), never a free-form URL.
export type FoodImage = { path: string; label: string };
export const foodImages: FoodImage[] = Array.from(new Map(biharHomeFoodItems.map((item) => [item.image, { path: item.image, label: item.name }])).values())
  .sort((a, b) => a.label.localeCompare(b.label));

export const isAllowedFoodImage = (path: string) => foodImages.some((image) => image.path === path);

/** Picks the library image whose food has the same name as the product, if any. */
export function imageForName(name: string): string | null {
  const needle = name.trim().toLowerCase();
  const hit = biharHomeFoodItems.find((item) => item.name.toLowerCase() === needle || item.aliases.some((alias) => alias.toLowerCase() === needle));
  return hit?.image ?? null;
}
export const productImage = (product: { name: string; image?: string | null }) =>
  (product.image && isAllowedFoodImage(product.image) ? product.image : null) ?? imageForName(product.name);
