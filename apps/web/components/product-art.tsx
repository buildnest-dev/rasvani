import Image from 'next/image';
import { productImage } from '@/lib/food-images';

/** Product picture: admin-chosen or name-matched from the built-in library, else a branded placeholder. */
export function ProductArt({ product, sizes = '(max-width: 700px) 90vw, 30vw', priority = false, className = '' }: { product: { name: string; image?: string | null }; sizes?: string; priority?: boolean; className?: string }) {
  const src = productImage(product);
  if (!src) return <div className={`shop-card-art ${className}`} aria-hidden="true"><span>Rasvani · Bihar</span></div>;
  return <div className={`shop-card-art has-img ${className}`}><Image src={src} alt={`${product.name} (illustrative picture)`} fill sizes={sizes} priority={priority} /></div>;
}
