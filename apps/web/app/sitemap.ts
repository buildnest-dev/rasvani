import type { MetadataRoute } from 'next';
import { biharDistricts, slugifyDistrict } from '@/lib/bihar-districts';

const base = 'https://www.rasvani.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/bihar', '/shop', '/explore-india', '/explore-india/bihar', '/india-map', '/food-stories', '/better-choices', '/for-producers', '/for-retailers'];
  const districts = biharDistricts.map((name) => `/explore-india/bihar/district/${encodeURIComponent(slugifyDistrict(name))}`);
  return [...pages, ...districts].map((path) => ({ url: `${base}${path}` }));
}
