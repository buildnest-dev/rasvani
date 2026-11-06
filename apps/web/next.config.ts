import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// External origins the app actually contacts (see components/india-boundary-map.tsx and app/globals.css).
// TODO(verify): move the PMTiles boundary archives from the public r2.dev bucket to an owner-controlled bucket/CDN, then update this origin.
const MAP_TILES = 'https://pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev';
const MAP_GLYPHS = 'https://fonts.openmaptiles.org';

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; a nonce-based policy is the next hardening step.
  `script-src 'self' 'unsafe-inline' https://apis.google.com https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://www.googleapis.com ${MAP_TILES} ${MAP_GLYPHS}${isDev ? ' ws:' : ''}`,
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://appleid.apple.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // same-origin-allow-popups is required so the Google / Apple sign-in popup can report back.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() { return [{ source: '/(.*)', headers: securityHeaders }]; },
};

export default nextConfig;
