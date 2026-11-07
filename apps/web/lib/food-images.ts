import { biharHomeFoodItems } from '@/lib/bihar-home-food-items';

// Pictures come from two places only: the built-in library that ships with the site, or a picture the admin
// uploaded (stored by the server and served from /api/food-image/<id>). Never a free-form URL.
export type FoodImage = { path: string; label: string };
export const foodImages: FoodImage[] = Array.from(new Map(biharHomeFoodItems.map((item) => [item.image, { path: item.image, label: item.name }])).values())
  .sort((a, b) => a.label.localeCompare(b.label));

export const UPLOAD_PREFIX = '/api/food-image/';
export const UPLOAD_ID = /^[A-Za-z0-9]{20}$/;
/** Returns the stored-picture id when the path has the exact shape of an uploaded picture, else null. */
export function uploadedImageId(path: string | null | undefined): string | null {
  if (!path || !path.startsWith(UPLOAD_PREFIX)) return null;
  const id = path.slice(UPLOAD_PREFIX.length);
  return UPLOAD_ID.test(id) ? id : null;
}

export const isLibraryImage = (path: string) => foodImages.some((image) => image.path === path);
export const isAllowedFoodImage = (path: string) => isLibraryImage(path) || uploadedImageId(path) !== null;

/** Picks the library image whose food has the same name as the product, if any. */
export function imageForName(name: string): string | null {
  const needle = name.trim().toLowerCase();
  const hit = biharHomeFoodItems.find((item) => item.name.toLowerCase() === needle || item.aliases.some((alias) => alias.toLowerCase() === needle));
  return hit?.image ?? null;
}
export const productImage = (product: { name: string; image?: string | null }) =>
  (product.image && isAllowedFoodImage(product.image) ? product.image : null) ?? imageForName(product.name);
