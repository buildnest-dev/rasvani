import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="eyebrow">404 · Not found</div>
        <h1 className="page-title">This path hasn’t been mapped yet.</h1>
        <p className="section-intro">The page may have moved, or its regional content may not be published yet.</p>
        <div className="cta-row">
          <Link className="btn" href="/">Return home</Link>
          <Link className="btn secondary" href="/explore-india">Explore India</Link>
        </div>
      </div>
    </section>
  );
}
