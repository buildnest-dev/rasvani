import type { MetadataRoute } from 'next';

// Keep private screens out of search engines. This is not a security control: every protected action is checked on the server.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/baker', '/account', '/cart', '/checkout'] }],
    sitemap: 'https://www.rasvani.in/sitemap.xml',
  };
}
