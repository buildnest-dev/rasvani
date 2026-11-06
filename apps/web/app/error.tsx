'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep diagnostic details in the framework logger; never expose them in the UI.
    console.error('Rasvani route rendering error', error.digest ?? 'no-digest');
  }, [error]);

  return (
    <section className="section">
      <div className="wrap">
        <div className="eyebrow">A brief pause</div>
        <h1 className="page-title">Let’s find your way back.</h1>
        <p className="section-intro">This page could not be opened just now. Your saved account information has not been changed.</p>
        <div className="cta-row"><button className="btn" type="button" onClick={() => reset()}>Try again</button><Link className="btn secondary" href="/">Return home</Link><Link className="text-link" href="/explore-india">Explore India</Link></div>
      </div>
    </section>
  );
}
