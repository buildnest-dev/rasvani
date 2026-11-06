import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { LocaleProvider } from '@/components/locale-provider';
import { LaunchStrip } from '@/components/launch-strip';
import { CartProvider } from '@/components/cart-provider';
import { SiteMotionDirector } from '@/components/site-motion-director';
import { LocalizedCopy } from '@/components/localized-copy';

export const metadata: Metadata = {
  title: { default: 'Rasvani — India, Served by Region', template: '%s | Rasvani' },
  description: 'Discover India’s regional food traditions, stories and makers — one region at a time.',
  openGraph: { title: 'Rasvani — India, Served by Region', description: 'Discover India’s regional food traditions, stories and makers — one region at a time.', images: [{ url: '/images/rasvani-logo-lockup.webp', width: 1536, height: 1024, alt: 'Rasvani, Traditional Foods of India' }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><LocaleProvider><CartProvider><a className="skip-link" href="#main-content">Skip to content</a><div className="announcement">BIHAR’S HOME-MADE REGIONAL FOODS · ORDER ONLINE OR COLLECT FROM A PARTNER SHOP</div><SiteHeader /><LaunchStrip /><SiteMotionDirector /><main id="main-content" className="site-motion-main"><LocalizedCopy>{children}</LocalizedCopy></main><LocalizedCopy><footer className="footer footer-premium"><div className="wrap footer-row"><div><div className="brand" style={{color:'#f0d8b4'}}><span className="footer-logo-tile"><Image className="brand-logo" src="/images/rasvani-mark.png" alt="" width={50} height={47} /></span>Rasvani</div><p>India, Served by Region. Live in Bihar today, coming to every state.</p></div><div><Link href="/india-map">India Map</Link><br/><Link href="/explore-india">Explore India</Link><br/><Link href="/shop">Shop</Link></div><div><Link href="/food-stories">Food Stories</Link><br/><Link href="/better-choices">Better Choices</Link><br/><Link href="/for-producers">For Producers</Link><br/><Link href="/for-retailers">For Retailers</Link></div><div><div className="footer-heading">Founder</div><p className="footer-founder">Chinmay Anand</p><div className="footer-heading">Contact</div><a href="mailto:rasvanifoods@gmail.com">rasvanifoods@gmail.com</a></div></div><div className="wrap"><p className="notice" style={{color:'#c9bcae'}}>Regional information and product availability are updated as collections are reviewed and approved.</p></div></footer></LocalizedCopy></CartProvider></LocaleProvider></body></html>
}
