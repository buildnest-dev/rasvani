import Link from 'next/link';

// Shown on every screen: Rasvani is built for all of India, but ordering is live in Bihar first.
export function LaunchStrip() {
  return <div className="launch-strip" role="note"><div className="wrap launch-strip-row">
    <span className="launch-dot" aria-hidden="true" /><strong>Live now in Bihar</strong>
    <span className="launch-sep" aria-hidden="true">·</span><span>Built for all of India. More states open soon.</span>
    <Link className="text-link" href="/shop">Order from Bihar →</Link>
  </div></div>;
}
