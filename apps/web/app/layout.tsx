import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import './globals.css';
import './flow.css';
import './landing.css';
import './district.css';
import './region.css';
import { SiteHeader } from '@/components/site-header';
import { LocaleProvider } from '@/components/locale-provider';
import { LaunchStrip } from '@/components/launch-strip';
import { CartProvider } from '@/components/cart-provider';
import { AuthProvider } from '@/components/auth-provider';
import { SiteMotionDirector } from '@/components/site-motion-director';
import { LocalizedCopy } from '@/components/localized-copy';

// Self-hosted, preloaded and swap-displayed by Next.js instead of an @import from fonts.googleapis.com,
// which would block rendering on a round trip to Google before any text could paint. The CSS variables
// below feed the existing --sans/--serif custom properties, so no other file needs to change.
// Fraunces (warm, artisanal display serif) for headings; Plus Jakarta Sans (clean, high-x-height, reads
// well on mobile in bright sunlight) for body copy and UI — the pairing requested for an all-India,
// mobile-first food brand.
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });
const serif = Fraunces({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Rasvani — India, Served by Region', template: '%s | Rasvani' },
  description: 'Discover India’s regional food traditions, stories and makers — one region at a time.',
  // Paste the content value Google Search Console shows for the HTML-tag verification method into
  // NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Vercel (no quotes). Once set and redeployed, "Verify" in
  // Search Console will find the tag on the homepage automatically — nothing else to change here.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
  openGraph: { title: 'Rasvani — India, Served by Region', description: 'Discover India’s regional food traditions, stories and makers — one region at a time.', images: [{ url: '/images/rasvani-logo-lockup.webp', width: 1536, height: 1024, alt: 'Rasvani, Traditional Foods of India' }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${sans.variable} ${serif.variable}`}><head>
    {/* AuthProvider calls Firebase Auth on every page; connecting to these origins before they are
        needed shaves the DNS/TLS round trip off the time to first know whether someone is signed in. */}
    <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
    <link rel="preconnect" href="https://securetoken.googleapis.com" />
  </head><body><LocaleProvider><AuthProvider><CartProvider><a className="skip-link" href="#main-content">Skip to content</a><div className="announcement">BIHAR’S HOME-MADE REGIONAL FOODS · ORDER ONLINE OR COLLECT FROM A PARTNER SHOP</div><SiteHeader /><LaunchStrip /><SiteMotionDirector /><main id="main-content" className="site-motion-main"><LocalizedCopy>{children}</LocalizedCopy></main><LocalizedCopy><footer className="footer footer-premium"><div className="wrap footer-row"><div><div className="brand" style={{color:'#f0d8b4'}}><span className="footer-logo-tile"><Image className="brand-logo" src="/images/rasvani-mark.png" alt="" width={50} height={47} /></span>Rasvani</div><p>India, Served by Region. Live in Bihar today, coming to every state.</p></div><div><Link href="/india-map">India Map</Link><br/><Link href="/explore-india">Explore India</Link><br/><Link href="/shop">Shop</Link></div><div><Link href="/food-stories">Food Stories</Link><br/><Link href="/better-choices">Better Choices</Link><br/><Link href="/for-producers">For Producers</Link><br/><Link href="/for-retailers">For Retailers</Link></div><div><div className="footer-heading">Founder</div><p className="footer-founder">Chinmay Anand</p><div className="footer-heading">Contact</div><a href="mailto:rasvanifoods@gmail.com">rasvanifoods@gmail.com</a></div></div><div className="wrap"><p className="notice" style={{color:'#c9bcae'}}>Regional information and product availability are updated as collections are reviewed and approved.</p></div></footer></LocalizedCopy></CartProvider></AuthProvider></LocaleProvider></body></html>
}
