'use client';

import Image from 'next/image';
import { useLocale } from '@/i18n/locale';
import { goToNotify } from '@/lib/notify';
import { useUi } from '@/lib/ui-store';
import home from '@/assets/home.jpg';

/* "Ghar ka swaad" band, from the human-centered-web-studio design. */
export function HomeBand() {
  const { lang } = useLocale();
  const setPinDialogOpen = useUi((s) => s.setPinDialogOpen);
  return (
    <section className="homeband" id="home" aria-labelledby="homeTitle">
      <div className="container homeband__grid">
        <div>
          <p className="eyebrow eyebrow--gold">Ghar ka swaad</p>
          <h2 className="h2" id="homeTitle">
            Missing the taste of <em>home?</em>
          </h2>
          <p className="homeband__lede">Wherever life takes you, the flavours you grew up with should never feel far away. Tell us what you miss and where you are.</p>
          <p className="homeband__deva" lang="hi">
            घर की याद, थाली में।
          </p>
          <div className="homeband__cta">
            <button type="button" className="btn btn--gold" data-cursor="link" onClick={() => goToNotify({})}>
              {lang === 'hi' ? 'बताइए, किसकी याद आती है' : 'Tell us what you miss'}
            </button>
            <button type="button" className="btn btn--ghost" data-cursor="link" onClick={() => setPinDialogOpen(true)}>
              {lang === 'hi' ? 'डिलीवरी जाँचें' : 'Check delivery'}
            </button>
          </div>
        </div>
        <div className="grain arch">
          <Image src={home} alt="Illustration of hands packing a tiffin in a sunlit kitchen" sizes="(min-width: 1024px) 40vw, 92vw" />
        </div>
      </div>
    </section>
  );
}
