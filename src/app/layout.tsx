import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Caveat, DM_Sans, Fraunces, Noto_Serif_Devanagari } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Sprite } from '@/components/brand/sprite';
import { Intro } from '@/components/motion/intro';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { Cursor } from '@/components/motion/cursor';
import { Header } from '@/components/features/header';
import { Footer } from '@/components/features/footer';
import { PinDialog } from '@/components/features/pin-dialog';
import { StatePanel } from '@/components/map/state-panel';
import type { Lang } from '@/i18n/locale';
import './globals.css';
import './merge.css';

const fraunces = Fraunces({ subsets: ['latin'], axes: ['opsz'], style: ['normal', 'italic'], variable: '--font-fraunces', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-hand', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const deva = Noto_Serif_Devanagari({ subsets: ['devanagari', 'latin'], weight: ['600', '700'], variable: '--font-deva', display: 'swap' });

export const metadata: Metadata = {
  title: 'Rasvani — The taste of home, wherever you are',
  description: 'Traditional vegetarian foods from every corner of India, made by regional makers and delivered only where we can do it safely. Join the pilot waitlist.',
  icons: { icon: '/favicon.svg', apple: '/app-icon.svg' },
  openGraph: {
    title: 'Rasvani — The taste of home, wherever you are',
    description: 'One India. Many Traditions. A vegetarian marketplace for regional foods, with honest delivery by PIN code.',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#2b0a10', width: 'device-width', initialScale: 1 };

/* Runs before first paint: content is never hidden unless motion is allowed (04-AI-RULES §5.7). */
const MOTION_GATE = `(function(){var d=document.documentElement;try{var r=/(?:^|; )ys-reduce=1/.test(document.cookie)||localStorage.getItem('ys-reduce')==='1';var ok=matchMedia('(prefers-reduced-motion: no-preference)').matches&&!r;if(r)d.classList.add('reduce-motion');if(ok){d.classList.add('motion-ready');if(!sessionStorage.getItem('ys-intro'))d.classList.add('has-intro');}}catch(e){}})();`;

const JSON_LD = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Rasvani', slogan: 'The taste of home, wherever you are.' });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const lang: Lang = jar.get('ys-lang')?.value === 'hi' ? 'hi' : 'en';

  return (
    <html lang={lang} className={`${fraunces.variable} ${dmSans.variable} ${deva.variable} ${caveat.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_GATE }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      </head>
      <body>
        <Sprite />
        <Providers lang={lang}>
          <a className="skip" href="#main">
            Skip to content
          </a>
          <SmoothScroll />
          <Intro />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <PinDialog />
          <StatePanel />
          <Cursor />
        </Providers>
      </body>
    </html>
  );
}
